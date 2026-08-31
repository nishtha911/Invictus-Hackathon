<div align="center">
  <img src="frontend/public/logo.png" alt="Cognis Bank Logo" width="120" />
  
  # 🌉 Cognis Bank
  
  **Next-Generation Generative AI Loan Advisory & Intelligent Lead Conversion Platform**
  
  [![Tech Stack](https://img.shields.io/badge/Tech_Stack-Next.js_16_|_FastAPI_|_Supabase-0D9488?style=for-the-badge)](https://github.com/nishtha911/Invictus-Hackathon)
  [![Build Status](https://img.shields.io/badge/Build-Passing-22C55E?style=for-the-badge)](https://github.com/nishtha911/Invictus-Hackathon)
  [![AI Engine](https://img.shields.io/badge/AI_Engine-RAG_+_Llama_3.3_--_Groq-6366F1?style=for-the-badge)](https://github.com/nishtha911/Invictus-Hackathon)

  <p>
    <a href="#-core-workflows">Core Workflows</a> •
    <a href="#%EF%B8%8F-architecture--data-flow">Architecture & Data Flow</a> •
    <a href="#-technical-stack">Technical Stack</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-api-endpoints">API Routes</a>
  </p>
</div>

---

## 🌟 Overview

**Cognis Bank**'s premium, conversational AI loan advisor. Built for the Invictus Hackathon, it bridges the gap between potential borrowers and complex bank policies. 

By integrating **Retrieval-Augmented Generation (RAG)** over bank policy brochures with real-time profile extraction, the platform captures structured customer requirements, recommends matches with strict underwriting checks, and converts interest into scored, actionable sales leads.

---

## ⚡ Core Workflows

```mermaid
graph TD
    A[Landing Page / Chatbot] -->|1. Intake Questionnaire| B(Advisor Journey)
    B -->|2. Build Session Profile| C{Generate Unique UUID}
    C -->|3. POST /recommend-loans| D[FastAPI Recommendation Engine]
    D -->|4. Retrieve vector chunks| E[(Supabase pgvector)]
    D -->|5. Groq Llama 3.3 LLM Match| F[Tailored Loan Schemes]
    F -->|6. I'm Interested Click| G[Lead Capture Form]
    G -->|7. POST /api/leads| H[Deterministic Underwriting Scorer]
    H -->|8. Save Scored Lead| I[(Supabase qualified_leads)]
    I -->|9. Sales Intelligence| J[Banker Sales Dashboard]
```

### 💬 1. Conversational AI Assistant & Intake
- **Dynamic Guided Intake**: Structured advisor steps adapt based on loan intent (Home, Vehicle, Business, Gold, Education, or Personal) and employment type.
- **Session Isolation**: Every user gets a unique, client-persisted UUID session token preventing profile collisions.

### 🔍 2. RAG Policy & Scheme Matching
- **Grounding with Citations**: Evaluates applicant attributes against policy documents ingested in `pgvector`. Recommendations show confidence scores and matching clauses.
- **Strict Number Verification**: Backend validation ensures financial rates presented to the customer exist in the source policies.

### 📊 3. Lead Conversion & Scoring
- **Deterministic Underwriting**: Automatically computes Debt-to-Income (DTI) / Fixed Obligation to Income Ratio (FOIR) and credit-band assessments.
- **Banker Dashboard**: Equips sales agents with lead priority rankings (HOT, WARM, NURTURE), automated AI briefing write-ups, and custom talking points.

---

## 🛠️ Architecture & Data Flow

```
                      +-----------------------------+
                      |     Next.js 16 Frontend     |
                      |   (Zustand, Tailwind, v4)   |
                      +--------------+--------------+
                                     |
             (JSON Profile Payload)  |  (UUID Session ID)
                                     v
                      +-----------------------------+
                      |     FastAPI Backend Core    |
                      +------|---------------+------+
                             |               |
       (Cosine Similarity)   |               |   (Prompt + Chunks + Context)
                             v               v
            +--------------------+       +--------------------+
            | Supabase pgvector  |       |   Groq LLM API     |
            |   (RAG Chunks)     |       | (Llama-3.3-70b)    |
            +--------------------+       +--------------------+
```

---

## 💻 Technical Stack

### Frontend
- **Framework**: `Next.js 16.3.3` (App Router)
- **Styling**: `Tailwind CSS v4` (Modern CSS-first engine)
- **Animations**: `Framer Motion` (Fluid, hardware-accelerated transitions)
- **State Management**: `Zustand` (Persisted client state)
- **Forms**: `React Hook Form` & `Zod` (Underwriting boundary checks)
- **Charts**: `Recharts` (Dashboard pipelines & distribution)
- **Toasts**: `Sonner` (Live warnings & API health banners)

### Backend
- **Framework**: `FastAPI` (Python 3.10+)
- **LLM Engine**: `Groq API` (`Llama-3.3-70b-versatile` or `OpenAI` compatible models)
- **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2` (Local vector embedding)
- **Database / Vector Search**: `Supabase` (PostgreSQL with `pgvector` extension)

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+`
- Python `3.10+`
- A Supabase project with `pgvector` enabled

---

### Step 1: Clone & Configure

```bash
git clone https://github.com/nishtha911/Invictus-Hackathon.git
cd Invictus-Hackathon
git checkout paras-siddhi-clean
```

---

### Step 2: Backend Setup (Port 8080)

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1   # Windows PowerShell
   # source venv/bin/activate    # Linux / macOS
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `backend/.env` file:
   ```env
   LLM_PROVIDER=groq
   GROQ_API_KEY=your-groq-api-key
   GROQ_MODEL=llama-3.3-70b-versatile
   
   SUPABASE_URL=https://your-supabase-url.supabase.co
   SUPABASE_KEY=your-supabase-service-key
   SUPABASE_DB_URL=postgresql://postgres:password@your-supabase-db-host:5432/postgres
   ```
5. Launch the backend:
   ```bash
   python run.py
   ```
   > 💡 On boot, the server automatically reads files in `sample_docs/` (including our new **Gold Loan** schemes) and indexes them into the `pgvector` store.

---

### Step 3: Frontend Setup (Port 3000)

1. In a new terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `frontend/.env.local` file:
   ```env
   NEXT_PUBLIC_USE_MOCK_API=false
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🧭 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/recommend-loans` | Matches profiles against policies using RAG + Groq. |
| `POST` | `/api/leads` | Persists scored, validated leads to the database. |
| `GET` | `/api/dashboard` | Fetches sales conversion pipelines and scoring analytics. |
| `POST` | `/query` | Directly queries the grounded policy RAG chatbot. |
| `POST` | `/api/v1/auth/employee-login` | Authenticates bank employees. |

---

<div align="center">
  <i>Crafted with ❤️ for the Invictus Hackathon Team</i>
</div>
