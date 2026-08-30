# DhanSetu Backend & AI Advisory Services

FastAPI-powered banking advisory engine combining conversational profiling with vector-grounded RAG over bank lending policies.

---

## 🏗 Key Components

1. **Advisory Engine (`app/graph/`, `app/main.py`)**:
   - Paras's LangGraph state machine & intake profiling.
   - Dynamic extraction of applicant facts (Income, Loan Amount, Tenure, Existing Obligations, Credit Band, Urgency, Employment Type).
   - Real-time profile completeness tracking and storage into `public.customer_profiles`.

2. **RAG Engine (`db.py`, `ingest.py`, `query.py`)**:
   - Siddhi's vector knowledge base in Supabase `rag` schema (`rag.documents` and `rag.chunks`).
   - 384-dimensional `all-MiniLM-L6-v2` embeddings with cosine similarity search.
   - LLM generation grounded in retrieved policy excerpts and personalized with the user's Verified Advisory Intake Answers.

3. **Deterministic Scoring Engine (`app/services/scoring_engine.py`)**:
   - FOIR calculation, debt-to-income threshold checks, and policy matching against active loan products.

4. **Underwriter Sales Scorer (`app/services/lead_scorer.py`)**:
   - Real-time lead scoring (Hot/Warm/Nurture) and AI briefings for bank loan officers.

---

## 🚀 Setup & Running

### 1. Environment Setup
```powershell
# In Windows PowerShell:
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Configure `.env`
Create `backend/.env`:
```env
# LLM Provider
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Supabase (Both public and rag schemas)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key
SUPABASE_DB_URL=postgresql://postgres.your-ref:password@aws-0-region.pooler.supabase.com:5432/postgres

# App settings
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### 3. Start Backend Server
```powershell
python run.py
```
API runs on: **`http://localhost:8080`**  
Swagger Docs: **`http://localhost:8080/docs`**

---

## 📡 Key API Endpoints

- `POST /api/chat/start` — Initialize new advisory session
- `POST /api/chat/message` — Send user answer and advance profiling state
- `GET /api/chat/{session_id}` — Get active session state & extracted profile
- `POST /query` — Query policy RAG knowledge base with active advisory session context
- `POST /upload` — Ingest policy documents (PDF, TXT, MD) into `rag.chunks`
- `GET /documents` — List indexed documents in `rag.documents`
- `POST /api/v1/recommend-loans` — Run rule-based scoring & policy evaluation
- `POST /api/v1/leads` — Capture lead & compute underwriter AI score
- `GET /api/v1/dashboard` — Bank sales intelligence KPIs and leads table
