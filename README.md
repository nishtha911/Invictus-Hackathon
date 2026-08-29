# Loan Policy RAG — Bank Knowledge Base

End-to-end RAG pipeline for bank loan policy documents.

```
Upload PDF/TXT → Extract → Clean → Chunk → Embed → pgvector → Retrieve → Grounded Answer
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL with pgvector extension

### Install pgvector (Windows)

1. Download the pgvector release matching your PostgreSQL version from  
   https://github.com/pgvector/pgvector/releases
2. Copy `vector.dll` → `PostgreSQL\lib\`  
   Copy `vector.control` + `vector--*.sql` → `PostgreSQL\share\extension\`

---

## 1. Database Setup

```sql
-- Run in psql as superuser
CREATE DATABASE loan_rag;
\c loan_rag
CREATE EXTENSION vector;
```

The tables (`documents`, `chunks`) are created automatically on first backend start.

---

## 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Edit `.env`:
```
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/loan_rag
GROQ_API_KEY=<your_groq_api_key>
```

Run:
```bash
# Load .env then start
set DATABASE_URL=postgresql://postgres:<password>@localhost:5432/loan_rag
set GROQ_API_KEY=<your_groq_api_key>
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

---

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## Usage

### Upload Documents
1. Go to **Upload Documents** tab
2. Drag & drop or browse for PDF/TXT policy files
3. Select the loan category for each file
4. Click **Process & Add to Knowledge Base**

### View Knowledge Base
- **Knowledge Base** tab shows all ingested documents with chunk counts

### Query
1. Go to **Query Policies** tab
2. Optionally filter by loan category
3. Ask any policy question, e.g.:
   - *What is the maximum education loan amount?*
   - *What are the eligibility criteria for a home loan?*
   - *What documents are required for a vehicle loan?*
4. The answer is grounded in retrieved chunks — sources and chunk IDs are shown
5. A **numbers verified** badge confirms all numeric values in the answer appear in the source text

---

## Architecture

```
backend/
  main.py        — FastAPI routes: /upload  /query  /documents
  ingest.py      — extract → clean → section-aware chunk → embed → store
  query.py       — vector search → grounded LLM answer → number verification
  db.py          — pgvector schema (documents + chunks tables)
  requirements.txt
  .env

frontend/
  src/
    App.jsx        — tab shell
    UploadPage.jsx — file upload with per-file category selection
    QueryPage.jsx  — question input, answer display, source citations
    DocsPage.jsx   — knowledge base document list
```

## Key Design Decisions

| Concern | Approach |
|---|---|
| Hallucination prevention | temperature=0, strict system prompt, answer only from retrieved context |
| Number verification | regex extracts numbers from answer, checks each against source chunks |
| Chunking | section-aware split on policy headings, secondary paragraph split for long sections |
| Chunk IDs | stable `doc{id}-chunk{index}` format for traceability (`grounded_on_chunk_ids`) |
| Isolation | completely separate local DB — no Supabase, no existing project data |
| Integration-ready | `grounded_on_chunk_ids` field in query response matches Nishtha's schema |

---

## Integration Notes (for Nishtha's recommendation layer)

The `/query` response includes:

```json
{
  "answer": "...",
  "grounded_on_chunk_ids": ["doc1-chunk0003", "doc1-chunk0007"],
  "numbers_verified": true,
  "sources": [
    {
      "chunk_id": "doc1-chunk0003",
      "doc_name": "Education Loan Policy.pdf",
      "loan_category": "Education Loan",
      "section": "Loan Amount",
      "page_number": 2,
      "similarity": 0.91
    }
  ]
}
```

These chunk IDs can be stored as `grounded_on_chunk_ids` in the recommendation records.
