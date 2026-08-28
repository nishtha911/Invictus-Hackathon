# LoanSense AI — Frontend (Pod 4)
**Cognizant Invictus Hackathon — AI-Powered Bank Loan Advisory Platform**

A production-grade, policy-grounded Next.js web application delivering conversational financial intake, deterministic EMI matching, and AI-scored sales intelligence.

---

## 🏛️ System Architecture

```text
BANK WEBSITE (/)
       │
       ▼
 USER TYPE?
       │
       ├──────────────────────────────┐
       │                              │
       ▼                              ▼
NEW CUSTOMER / GUEST           EXISTING CUSTOMER
Conversational Intake          Mock Login (Prefilled Context)
       │                              │
       └──────────────┬───────────────┘
                      ▼
            GENAI EXTRACTION LAYER
            Intent / Income / Amount
                      │
                      ▼
          DETERMINISTIC MATCHING ENGINE
            Rule-based FOIR & Loan DB
                      │
                      ▼
          POLICY-GROUNDED REASONING
                      │
                      ▼
         PERSONALIZED LOAN CARDS (/recommendations)
                      │
                      ▼
                 INTERESTED?
                   /       \
                 YES        NO
                 │           │
                 ▼           ▼
         LEAD CAPTURE  SESSION COMPLETE
         (/lead-capture)
                 │
                 ▼
       SCORED QUALIFIED LEAD
                 │
                 ▼
       BANK SALES DASHBOARD (/dashboard)
```

---

## 🚀 Quick Start

### 1. Installation
Inside the `frontend/` directory:
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## ⚙️ Environment Configuration

Configuration is managed via `frontend/.env.local`:

```env
# Mock Switch: Set to true for mock simulation, false to connect to FastAPI backend
NEXT_PUBLIC_USE_MOCK_API=true

# FastAPI Backend Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 🗺️ Application Routes

| Route | View | Description |
| :--- | :--- | :--- |
| `/` | **Bank Website Entry** | Hero section with live product preview, loan solutions, system architecture breakdown, and User Type intake modal. |
| `/advisor` | **Hybrid Chat & Intake** | 8-step conversational intake with MCQ cards, smart currency/tenure sliders, and live profile extraction panel. |
| `/recommendations` | **Loan Recommendations** | Hero best match card, verified calculations, policy citations (RAG), comparison drawer, and Interest Yes/No decision. |
| `/lead-capture` | **Lead Capture & Qualification** | Zod-validated priority application form and instant GenAI lead scoring output. |
| `/dashboard` | **Bank Sales Intelligence** | Operational command center with KPIs, Recharts volume trends, leads queue table, and AI Underwriting Briefing drawer. |

---

## 🔌 Backend Contracts & Integration (Pod 2 / Pod 1 Handoff)

Centralized in `src/lib/api/`:
- `POST /api/v1/extract-profile`: Takes `ProfileIntake` (user_type, income, loan_amount, intent)
- `POST /api/v1/recommend-loans`: Returns recommended loans with calculated EMIs and policy citations
- `POST /api/v1/leads`: Captures and scores inbound lead with AI briefing

---

## 🎨 Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4) with custom FinTech dark tokens
- **Motion**: `motion/react`
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **State**: Zustand (with hydration-safe persistence)
- **Charts**: Recharts
- **Toasts**: Sonner
