# COGNIS BANK — Frontend (Pod 4)
**Cognizant Invictus Hackathon — Smart Lending, Simplified.**

A production-grade, policy-grounded Next.js banking web application delivering conversational financial intake, deterministic EMI calculations, transparent loan recommendations, and underwriting sales intelligence.

---

## System Architecture

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
Loan Intent / Advisor          Login (/login)
       │                              │
       └──────────────┬───────────────┘
                      ▼
           STRUCTURED PROFILE INTAKE
           Intent / Income / Amount / Tenure
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

## Quick Start

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

## Environment Configuration

Configuration is managed via `frontend/.env.local`:

```env
# Mock Switch: Set to false to connect directly to FastAPI backend
NEXT_PUBLIC_USE_MOCK_API=false

# FastAPI Backend Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

---

## Application Routes

| Route | View | Description |
| :--- | :--- | :--- |
| `/` | **Cognis Bank Homepage** | Clean hero with family lifestyle photography, comprehensive loan solutions catalogue, 4-step process, and trust matrix. |
| `/login` | **Existing Customer Login** | Fast sign-in for registered borrowers using Full Name and 10-digit mobile number with quick demo fill. |
| `/advisor` | **Intelligent Loan Advisor** | 8-step conversational intake with options, smart sliders, live profile summary, and category pre-selection. |
| `/recommendations` | **Loan Recommendations** | Recommended product card, verified calculations, policy citations, comparison drawer, and interest decisions. |
| `/lead-capture` | **Lead Capture & Qualification** | Zod-validated priority application form and instant lead scoring output. |
| `/dashboard` | **Bank Sales Intelligence** | Operational command center with KPIs, Recharts volume trends, leads queue table, and Underwriting Briefing drawer. |

---

## Backend Contracts & Integration

Centralized in `src/lib/api/`:
- `POST /api/v1/extract-profile`: Takes `ProfileIntake` (user_type, income, loan_amount, intent)
- `POST /api/v1/recommend-loans`: Returns recommended loans with calculated EMIs and policy citations
- `POST /api/v1/leads`: Captures and scores inbound lead with underwriter briefing

---

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4) with master banking tokens (Soft White, Navy `#081C2D`, Emerald `#1F7A63`, Cool Gray `#9AA3A8`)
- **Motion**: `motion/react`
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **State**: Zustand (with hydration-safe persistence)
- **Charts**: Recharts
- **Toasts**: Sonner
