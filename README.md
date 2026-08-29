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

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/nishtha911/Invictus-Hackathon.git
cd Invictus-Hackathon
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend` directory with your API keys:
```env
OPENAI_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```
Run the backend:
```bash
python run.py
```

### 3. Frontend Setup (Next.js)
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Run the frontend:
```bash
npm run dev
```

---

<div align="center">
  <i>Built with ❤️ by the Invictus Hackathon Team</i>
</div>
