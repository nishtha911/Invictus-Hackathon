<div align="center">
  <img src="images/logo.png" alt="DhanSetu Logo" width="120" />
  <h1>🌉 DhanSetu</h1>
  <p><strong>Intelligent AI-Powered Loan Advisory & Customer Onboarding Platform</strong></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#installation">Installation</a>
  </p>
</div>

---

## 🌟 Overview

**DhanSetu** (translating to "Bridge to Wealth") is a next-generation conversational AI loan advisor. Built during the Invictus Hackathon, it seamlessly bridges the gap between potential borrowers and complex financial products. By leveraging Advanced Generative AI and RAG (Retrieval-Augmented Generation), DhanSetu interacts with customers to understand their needs, analyze their profiles, and provide personalized, highly accurate loan product recommendations.

## ✨ Key Features

- 💬 **Conversational AI Intake**: Dynamic, adaptive chat interface that collects user requirements through conversation.
- 🎯 **Smart Recommendations**: Algorithmic scoring matches users to the absolute best loan products based on their profile.
- 📚 **RAG-Powered Knowledge Base**: Instant answers strictly grounded in actual banking policies and product brochures using `pgvector`.
- 📊 **Banker Dashboard**: Dedicated portal for bank agents to track leads, monitor completeness, and review the AI's data extraction.
- ⚡ **Real-time Extraction**: Instantly parses conversational context into structured JSON profiles.

## 🏗 Architecture

The platform uses a robust, separated architecture:

- **Frontend**: A highly responsive, glassmorphic UI built with Next.js 13+ (App Router) and Tailwind CSS.
- **Backend Orchestrator**: FastAPI powering the API layer.
- **AI Engine**: LangGraph state machine handling conversational states, prompt routing, and entity extraction.
- **Database / RAG**: Supabase (PostgreSQL) powering both relational data (leads/users) and vector embeddings (`pgvector`) for the document knowledge base.

## 💻 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js, React, TailwindCSS, Motion, Lucide Icons |
| **Backend** | Python, FastAPI, Uvicorn |
| **AI & LLM** | LangGraph, LangChain, Google Gemini |
| **Database** | PostgreSQL, pgvector (Supabase) |

## 🚀 Installation & Running Instructions

### Prerequisites
- **Node.js**: v18+ or v20+
- **Python**: 3.10+ or 3.11+
- **Supabase Account**: (with `public` and `rag` schemas, or use fallback static catalogue)

---

### Step 1: Clone the Repository & Checkout Branch
```bash
git clone https://github.com/nishtha911/Invictus-Hackathon.git
cd Invictus-Hackathon
git checkout paras-siddhi-rag-integration
```

---

### Step 2: Backend Setup & Execution (FastAPI - Port 8080)

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Create or edit `backend/.env`:
   ```env
   # LLM Configuration
   LLM_PROVIDER=groq
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile

   # Supabase Database & Vector RAG Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_anon_or_service_key
   SUPABASE_DB_URL=postgresql://postgres.your-ref:your-password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

   # Application settings
   ENVIRONMENT=development
   LOG_LEVEL=INFO
   ```

5. Run the backend server:
   ```bash
   python run.py
   ```
   > ℹ️ The backend will start on **http://localhost:8080** and will automatically initialize the `rag` schema and sample policy document embeddings.

---

### Step 3: Frontend Setup & Execution (Next.js - Port 3000)

1. In a new terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment variables:
   Create or edit `frontend/.env.local`:
   ```env
   # Set to false to connect directly to live FastAPI backend
   NEXT_PUBLIC_USE_MOCK_API=false

   # FastAPI Backend Base URL
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 🧭 Application Workflows & Routes

| Route | Feature | Description |
| :--- | :--- | :--- |
| **`/`** | **Home Page** | Loan category discovery, overview, and access to Floating AI Assistant. |
| **`/advisor`** | **Loan Advisory Intake** | Paras's structured intake: asks personalized questions (Income, Loan Amount, Tenure, Existing EMIs, Employment, Credit Score). |
| **`/chat`** | **Conversational Advisor** | LangGraph dynamic conversational advisor profiling state. |
| **`/recommendations`** | **Product Recommendations** | Deterministic FOIR match, interest calculations, and bank policy grounding. |
| **`/rag/query`** | **Policy Knowledge Base** | Siddhi's RAG chatbot: asks bank policy questions using extracted user advisory answers and pgvector search. |
| **`/rag/upload`** | **Document Ingestion** | Upload bank policy PDFs / brochures into `rag.documents` and `rag.chunks`. |
| **`/dashboard`** | **Bank Sales Intelligence** | Real-time underwriter pipeline and lead scoring intelligence. |

---

<div align="center">
  <i>Built with ❤️ by the Invictus Hackathon Team</i>
</div>
