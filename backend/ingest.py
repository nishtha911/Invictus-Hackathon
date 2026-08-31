import re
import uuid
import hashlib
from typing import List, Dict, Any

import pdfplumber
from sentence_transformers import SentenceTransformer

from db import get_conn

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

_embedder = None

def get_embedder() -> SentenceTransformer:
    from query import get_embedder as _get_query_embedder
    return _get_query_embedder()


def normalize_loan_category(category: str | None) -> str:
    """Normalize any loan category string (e.g., 'Home Loan', 'home-loan', 'HOME_LOAN') to standard snake_case."""
    if not category:
        return "general"
    cat_lower = category.strip().lower()
    if "home" in cat_lower:
        return "home_loan"
    elif "personal" in cat_lower:
        return "personal_loan"
    elif "vehicle" in cat_lower or "car" in cat_lower or "auto" in cat_lower:
        return "vehicle_loan"
    elif "education" in cat_lower or "student" in cat_lower or "scholar" in cat_lower:
        return "education_loan"
    elif "business" in cat_lower or "msme" in cat_lower or "sme" in cat_lower:
        return "business_loan"
    elif "gold" in cat_lower:
        return "gold_loan"
    return re.sub(r'[\s\-]+', '_', cat_lower)


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
# Chunking  — section-aware & metadata-enriched
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


def extract_doc_metadata(pages: List[Dict[str, Any]], filename: str) -> Dict[str, str]:
    """Extract Scheme Name and Bank Name from document text or fallback to filename."""
    full_text = "\n".join([p["text"] for p in pages])
    scheme_match = re.search(r"Scheme Name:\s*([^\n]+)", full_text, re.IGNORECASE)
    bank_match = re.search(r"Bank:\s*([^\n]+)", full_text, re.IGNORECASE)

    scheme_name = scheme_match.group(1).strip() if scheme_match else ""
    bank_name = bank_match.group(1).strip() if bank_match else ""

    if not scheme_name:
        # Infer from filename e.g. "home_scheme_easy_home.txt" -> "Easy Home"
        name_clean = Path(filename).stem
        for pfx in ("home_scheme_", "personal_scheme_", "vehicle_scheme_", "education_scheme_", "business_scheme_"):
            if name_clean.startswith(pfx):
                name_clean = name_clean[len(pfx):]
        scheme_name = name_clean.replace("_", " ").title()

    if not bank_name:
        bank_name = "Cognis Bank"

    return {"scheme_name": scheme_name, "bank_name": bank_name}


def chunk_pages(pages: List[Dict[str, Any]], filename: str = "document.txt") -> List[Dict[str, Any]]:
    """
    Split pages into section-aware chunks and enrich with document metadata headers.
    Each chunk carries: {section, page, content, scheme_name, bank_name}
    """
    meta = extract_doc_metadata(pages, filename)
    scheme_name = meta["scheme_name"]
    bank_name = meta["bank_name"]

    chunks = []
    current_section = "General"
    current_page = 1
    buffer = []

    def flush(section, page, buf):
        text = clean(" ".join(buf))
        if len(text) > 40:
            chunks.append({"section": section, "page": page, "content": text})

    for page_obj in pages:
        page_num = page_obj["page"]
        lines = page_obj["text"].splitlines()

        for line in lines:
            stripped = line.strip()
            if SECTION_DIVIDER.match(stripped):
                continue  # skip divider lines
            heading_match = SECTION_PATTERN.match(stripped)
            if heading_match:
                flush(current_section, current_page, buffer)
                buffer = []
                current_section = heading_match.group("heading").strip().title()
                current_page = page_num
            else:
                buffer.append(line)

    flush(current_section, current_page, buffer)

    # Secondary split and Header Enrichment
    final = []
    for chunk in chunks:
        sub_texts = []
        if len(chunk["content"]) <= 1500:
            sub_texts.append(chunk["content"])
        else:
            paragraphs = re.split(r'\n{2,}|\. {2,}', chunk["content"])
            para_buf = ""
            for para in paragraphs:
                if len(para_buf) + len(para) < 1200:
                    para_buf += " " + para
                else:
                    if para_buf.strip():
                        sub_texts.append(para_buf.strip())
                    para_buf = para
            if para_buf.strip():
                sub_texts.append(para_buf.strip())

        for stext in sub_texts:
            # Prepend explicit header metadata to chunk content so embedding & retrieval retain exact scheme context
            header_prefix = f"Scheme Name: {scheme_name}\nBank: {bank_name}\nDocument: {filename}\nSection: {chunk['section']}\n"
            enriched_content = f"{header_prefix}\n{stext}"
            final.append({
                "section": chunk["section"],
                "page": chunk["page"],
                "content": enriched_content,
                "scheme_name": scheme_name,
                "bank_name": bank_name,
            })

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
    normalized_category = normalize_loan_category(loan_category)

    # 1. Extract
    pages = extract(file_bytes, filename)

    # 2. Chunk with metadata enrichment
    raw_chunks = chunk_pages(pages, filename=filename)

    if not raw_chunks:
        raise ValueError("No content could be extracted from the document.")

    # 3. Embed
    embedder = get_embedder()
    texts = [c["content"] for c in raw_chunks]
    embeddings = embedder.encode(texts, show_progress_bar=False).tolist()

    # 4. Store — write to rag.documents and rag.chunks (deleting existing doc if re-ingesting)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM rag.documents WHERE name = %s;", (filename,))

            cur.execute(
                "INSERT INTO rag.documents (name, loan_category) VALUES (%s, %s) RETURNING id;",
                (filename, normalized_category)
            )
            doc_id = cur.fetchone()["id"]

            for i, (chunk, embedding) in enumerate(zip(raw_chunks, embeddings)):
                chunk_id = make_chunk_id(doc_id, i)
                cur.execute(
                    """
                    INSERT INTO rag.chunks
                        (id, doc_id, doc_name, loan_category, section, page_number, content, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s::vector)
                    ON CONFLICT (id) DO UPDATE SET
                        doc_id = EXCLUDED.doc_id,
                        doc_name = EXCLUDED.doc_name,
                        loan_category = EXCLUDED.loan_category,
                        section = EXCLUDED.section,
                        page_number = EXCLUDED.page_number,
                        content = EXCLUDED.content,
                        embedding = EXCLUDED.embedding;
                    """,
                    (
                        chunk_id,
                        doc_id,
                        filename,
                        normalized_category,
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
        "loan_category": normalized_category,
        "chunks_stored": len(raw_chunks),
    }


def auto_ingest_sample_docs(sample_docs_dir: Path | str | None = None, force: bool = False) -> list[dict]:
    """
    Check backend/sample_docs/ on disk and auto-ingest any missing .txt docs into rag.documents / rag.chunks.
    If force=True, re-ingests all documents to update enriched chunk headers.
    """
    if sample_docs_dir is None:
        sample_docs_dir = Path(__file__).resolve().parent / "sample_docs"
    else:
        sample_docs_dir = Path(sample_docs_dir)

    if not sample_docs_dir.exists() or not sample_docs_dir.is_dir():
        logger.warning(f"Sample docs directory not found at: {sample_docs_dir}")
        return []

    # Map filename prefixes / patterns to standard loan categories
    def infer_category_from_filename(fname: str) -> str:
        f_lower = fname.lower()
        if "home" in f_lower:
            return "home_loan"
        elif "personal" in f_lower:
            return "personal_loan"
        elif "vehicle" in f_lower or "car" in f_lower or "auto" in f_lower:
            return "vehicle_loan"
        elif "education" in f_lower or "student" in f_lower or "scholar" in f_lower:
            return "education_loan"
        elif "business" in f_lower or "msme" in f_lower:
            return "business_loan"
        elif "gold" in f_lower:
            return "gold_loan"
        return "general"

    ingested = []
    try:
        existing_doc_names = set()
        if not force:
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT name FROM rag.documents;")
                    existing_doc_names = {row["name"] for row in cur.fetchall()}

        for txt_file in sorted(sample_docs_dir.glob("*.txt")):
            if not force and txt_file.name in existing_doc_names:
                continue

            category = infer_category_from_filename(txt_file.name)
            logger.info(f"Auto-ingesting sample document '{txt_file.name}' as '{category}'...")
            try:
                content_bytes = txt_file.read_bytes()
                result = ingest_document(content_bytes, txt_file.name, category)
                ingested.append(result)
                logger.info(f"Successfully auto-ingested '{txt_file.name}' with {result['chunks_stored']} chunks.")
            except Exception as e:
                logger.error(f"Failed to auto-ingest sample doc '{txt_file.name}': {e}", exc_info=True)

    except Exception as e:
        logger.error(f"Error during auto_ingest_sample_docs: {e}", exc_info=True)

    return ingested


