import io
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import init_db, get_conn
from ingest import ingest_document
from query import answer
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Loan Policy RAG API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/config")
def get_config():
    """Returns active LLM provider info — useful for frontend display."""
    provider = os.getenv("LLM_PROVIDER", "groq").lower()
    if provider == "openrouter":
        model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
    else:
        model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    return {"provider": provider, "model": model}


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    loan_category: str = Form(...),
):
    allowed = {"pdf", "txt", "md"}
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: {allowed}")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(400, "Empty file.")

    try:
        result = ingest_document(io.BytesIO(file_bytes), file.filename, loan_category)
    except ValueError as e:
        raise HTTPException(422, str(e))

    return {"status": "processed", **result}


# ---------------------------------------------------------------------------
# Query
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    question: str
    loan_category: Optional[str] = None
    top_k: int = 8


@app.post("/query")
def query_knowledge_base(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(400, "Question cannot be empty.")
    return answer(req.question, loan_category=req.loan_category, top_k=req.top_k)


# ---------------------------------------------------------------------------
# Documents list
# ---------------------------------------------------------------------------

@app.get("/documents")
def list_documents():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT d.id, d.name, d.loan_category, d.uploaded_at,
                       COUNT(c.id) AS chunk_count
                FROM rag.documents d
                LEFT JOIN rag.chunks c ON c.doc_id = d.id
                GROUP BY d.id
                ORDER BY d.uploaded_at DESC;
            """)
            return cur.fetchall()


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM rag.documents WHERE id = %s RETURNING id;", (doc_id,))
            if not cur.fetchone():
                raise HTTPException(404, "Document not found.")
        conn.commit()
    return {"status": "deleted", "doc_id": doc_id}
