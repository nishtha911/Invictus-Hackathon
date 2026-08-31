import os
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")


def get_conn():
    """
    Connect to Supabase PostgreSQL using the connection string from env.
    SUPABASE_DB_URL must be the direct PostgreSQL connection string, e.g.:
        postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
    """
    url = os.environ.get("SUPABASE_DB_URL")
    if not url:
        raise RuntimeError(
            "SUPABASE_DB_URL environment variable is not configured. "
            "Please set SUPABASE_DB_URL in backend/.env with your Supabase PostgreSQL connection string."
        )
    try:
        return psycopg2.connect(url, cursor_factory=RealDictCursor)
    except psycopg2.OperationalError as exc:
        raise RuntimeError(
            f"Failed to connect to Supabase PostgreSQL at SUPABASE_DB_URL: {exc}"
        ) from exc


def init_db():
    """
    Create the `rag` schema and its tables if they don't already exist.

    Notes:
    - The vector extension is already enabled in Supabase — we do NOT attempt
      to install it here.
    - All RAG tables live under the `rag` schema, completely isolated from the
      existing application tables in `public`.
    - The ivfflat index is created only after at least one row exists; we use
      CREATE INDEX IF NOT EXISTS so re-runs are safe.
    """
    with get_conn() as conn:
        with conn.cursor() as cur:

            # Isolated schema for all RAG data
            cur.execute("CREATE SCHEMA IF NOT EXISTS rag;")

            cur.execute("""
                CREATE TABLE IF NOT EXISTS rag.documents (
                    id            SERIAL PRIMARY KEY,
                    name          TEXT NOT NULL,
                    loan_category TEXT,
                    uploaded_at   TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS rag.chunks (
                    id            TEXT PRIMARY KEY,   -- stable: doc{id}-chunk{index}
                    doc_id        INTEGER REFERENCES rag.documents(id) ON DELETE CASCADE,
                    doc_name      TEXT,
                    loan_category TEXT,
                    section       TEXT,
                    page_number   INTEGER,
                    content       TEXT NOT NULL,
                    embedding     vector(384),        -- all-MiniLM-L6-v2 output dim
                    created_at    TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # NOTE: ivfflat index creation is intentionally left out here.
            # Sequential scan is accurate and performant at our data scale.
            # Create the index manually if needed once sufficient rows exist:
            # CREATE INDEX rag_chunks_embedding_idx ON rag.chunks
            #   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

        conn.commit()
