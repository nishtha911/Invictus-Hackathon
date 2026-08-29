import re
import uuid
import hashlib
from typing import List, Dict, Any

import pdfplumber
from sentence_transformers import SentenceTransformer

from db import get_conn

_embedder = None

def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------

def extract_text_from_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
    """Return list of {page, text} dicts."""
    pages = []
    with pdfplumber.open(file_bytes) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                pages.append({"page": i, "text": text})
    return pages


def extract_text_from_txt(file_bytes) -> List[Dict[str, Any]]:
    if hasattr(file_bytes, "read"):
        text = file_bytes.read().decode("utf-8", errors="replace")
    else:
        text = file_bytes.decode("utf-8", errors="replace")
    return [{"page": 1, "text": text}]


def extract(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("txt", "md"):
        return extract_text_from_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


# ---------------------------------------------------------------------------
# Cleaning
# ---------------------------------------------------------------------------

def clean(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\.{3,}', ' ', text)       # remove dot leaders (table of contents)
    text = re.sub(r'-{3,}', ' ', text)
    text = text.strip()
    return text


# ---------------------------------------------------------------------------
# Chunking  — section-aware
# ---------------------------------------------------------------------------

# Common section headings found in loan policy documents
SECTION_PATTERN = re.compile(
    r'^(?P<heading>'
    r'(?:\d+[\.\)]\s+)?'
    r'(?:eligibility|loan amount|interest rate|tenure|repayment|collateral|'
    r'security|required documents|documents required|processing fee|'
    r'moratorium|margin|purpose|features|benefits|terms|conditions|'
    r'special conditions|restrictions|faq|frequently asked|overview|'
    r'introduction|scheme|product|about|general|age|income|employment)'
    r'[^\n]{0,80}'
    r')\s*$',
    re.IGNORECASE
)

SECTION_DIVIDER = re.compile(r'^[=\-]{10,}\s*$')


def chunk_pages(pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Split pages into section-aware chunks.
    Each chunk carries: {section, page, content}
    """
    chunks = []
    current_section = "General"
    current_page = 1
    buffer = []

    def flush(section, page, buf):
        text = clean(" ".join(buf))
        if len(text) > 80:
            chunks.append({"section": section, "page": page, "content": text})

    for page_obj in pages:
        page_num = page_obj["page"]
        lines = page_obj["text"].splitlines()

        for line in lines:
            stripped = line.strip()
            if SECTION_DIVIDER.match(stripped):
                continue  # skip divider lines, don't add to buffer
            heading_match = SECTION_PATTERN.match(stripped)
            if heading_match:
                flush(current_section, current_page, buffer)
                buffer = []
                current_section = heading_match.group("heading").strip().title()
                current_page = page_num
            else:
                buffer.append(line)

    flush(current_section, current_page, buffer)

    # Secondary split: if a chunk is very long, split by paragraph
    final = []
    for chunk in chunks:
        if len(chunk["content"]) <= 1500:
            final.append(chunk)
        else:
            paragraphs = re.split(r'\n{2,}|\. {2,}', chunk["content"])
            para_buf = ""
            for para in paragraphs:
                if len(para_buf) + len(para) < 1200:
                    para_buf += " " + para
                else:
                    if para_buf.strip():
                        final.append({**chunk, "content": para_buf.strip()})
                    para_buf = para
            if para_buf.strip():
                final.append({**chunk, "content": para_buf.strip()})

    return final


# ---------------------------------------------------------------------------
# Stable chunk ID
# ---------------------------------------------------------------------------

def make_chunk_id(doc_id: int, index: int) -> str:
    return f"doc{doc_id}-chunk{index:04d}"


# ---------------------------------------------------------------------------
# Ingest pipeline
# ---------------------------------------------------------------------------

def ingest_document(file_bytes: bytes, filename: str, loan_category: str) -> Dict[str, Any]:
    """
    Full pipeline: extract → clean → chunk → embed → store.
    Returns summary dict.
    """
    # 1. Extract
    pages = extract(file_bytes, filename)

    # 2. Chunk
    raw_chunks = chunk_pages(pages)

    if not raw_chunks:
        raise ValueError("No content could be extracted from the document.")

    # 3. Embed
    embedder = get_embedder()
    texts = [c["content"] for c in raw_chunks]
    embeddings = embedder.encode(texts, show_progress_bar=False).tolist()

    # 4. Store — all writes go to rag.documents and rag.chunks
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO rag.documents (name, loan_category) VALUES (%s, %s) RETURNING id;",
                (filename, loan_category)
            )
            doc_id = cur.fetchone()["id"]

            for i, (chunk, embedding) in enumerate(zip(raw_chunks, embeddings)):
                chunk_id = make_chunk_id(doc_id, i)
                cur.execute(
                    """
                    INSERT INTO rag.chunks
                        (id, doc_id, doc_name, loan_category, section, page_number, content, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s::vector)
                    ON CONFLICT (id) DO NOTHING;
                    """,
                    (
                        chunk_id,
                        doc_id,
                        filename,
                        loan_category,
                        chunk["section"],
                        chunk["page"],
                        chunk["content"],
                        str(embedding),
                    )
                )
        conn.commit()

    return {
        "doc_id": doc_id,
        "doc_name": filename,
        "loan_category": loan_category,
        "chunks_stored": len(raw_chunks),
    }
