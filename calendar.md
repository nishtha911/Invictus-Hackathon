# POD WORK-SEQUENCING CALENDAR
## Cognizant Hackathon — AI-Powered Bank Loan Advisory Platform

**Why sequencing, not pure parallel:** Pod 1 (Nishtha, Paras, Siddhi) and Pod 2 (Harshika, Nishtha, Paras, Siddhi) share the same three people, so they can't build both at once — Pod 1 always goes first, then those three roll straight into Pod 2. Pod 3 (Ishita, Amruta) and Pod 4 (Nidhi, Sylvester) share no members with anyone, so they run full independent sessions the whole time.

**No fixed clock times:** Exact availability keeps shifting, so this uses relative “Hour 1, Hour 2…” blocks instead. Start whenever the pod is actually free that day — what matters is the order (Pod 1 before Pod 2) and roughly how many hours each task needs, not the clock.

**Vibe-coding buffer:** Since most of the code is being generated with Antigravity and errors are being resolved on the fly rather than hand-written from scratch, these hour estimates are on the generous side — treat them as an upper bound. If a pod finishes its task early, don't stall: pull forward the next day's task, or jump in and help whichever pod is still mid-block.

### Pod 1 — GenAI & Orchestration
*Nishtha, Paras, Siddhi — always works first in each session, then rolls into Pod 2.*

| Date | Hour Block | Task | Working With |
| :--- | :--- | :--- | :--- |
| Aug 25 (Tue) | Hour 1 | First LangGraph skeleton node (chat flow scaffold) | Nishtha, Paras, Siddhi |
| Aug 25 (Tue) | Hour 2 | Switch over to Pod 2 — help finish FastAPI scaffold + endpoints | Joins Harshika |
| Aug 26 (Wed) | Hour 1 | Chat question flow + extraction prompt design | Nishtha, Paras, Siddhi |
| Aug 26 (Wed) | Hour 2 – 3 | Switch to Pod 2 — build rule-based scoring logic (deterministic EMI/eligibility) | Joins Harshika |
| Aug 27 (Thu) | Hour 1 | Wire extraction output to the Extracted Profile schema (Sec. 3.1) | Nishtha, Paras, Siddhi |
| Aug 27 (Thu) | Hour 2 | Switch to Pod 2 — connect scoring engine to catalogue DB | Joins Harshika |
| Aug 28 (Fri) | One check-in only | 15-min async status note — protected holiday, no build work | Whole team, async |
| Aug 29 (Sat) | Hour 1 | Wire Chat UI → Extraction into the live pipeline | Nishtha, Paras, Siddhi |
| Aug 29 (Sat) | Hour 2 onward | Switch to Pod 2 — fix contract mismatches, first end-to-end run | Joins Harshika + Pod 3/4 |
| Aug 30 (Sun) | All hours | RAG hallucination-guardrail testing (Sec. 2.3), bug bash — no new features | Joint session with Pod 2 |
| Aug 31 (Mon) | After exam | Build slide deck (use Sec. 5 pitch/demo script) | Paras + Nishtha |
| Aug 31 (Mon) | After exam | Buffer / QA support | Siddhi |

### Pod 2 — Backend Core & Matching
*Harshika, Nishtha, Paras, Siddhi — Harshika starts solo while the other three are on Pod 1, then the full pod builds together.*

| Date | Hour Block | Task | Working With |
| :--- | :--- | :--- | :--- |
| Aug 25 (Tue) | Hour 1 | Start FastAPI scaffold + empty endpoints matching contracts — solo start while Pod 1 does its hour | Harshika (solo) |
| Aug 25 (Tue) | Hour 2 | Nishtha, Paras, Siddhi join — finish scaffold + endpoints together | Full Pod 2 |
| Aug 26 (Wed) | Hour 1 | Sketch scoring rules / EMI formulas solo, prep for the joint block | Harshika (solo) |
| Aug 26 (Wed) | Hour 2 – 3 | Full team builds rule-based scoring logic (deterministic EMI/eligibility) | Full Pod 2 |
| Aug 27 (Thu) | Hour 1 | Harshika preps catalogue query interface solo while Pod 1 finishes profile wiring | Harshika (solo) |
| Aug 27 (Thu) | Hour 2 | Full team connects scoring engine to Loan Catalogue DB | Full Pod 2 |
| Aug 28 (Fri) | One check-in only | 15-min async status note — protected holiday, no build work | Whole team, async |
| Aug 29 (Sat) | Hour 1 | Harshika reviews open PRs / preps integration checklist solo | Harshika (solo) |
| Aug 29 (Sat) | Hour 2 onward | Full team joins — fix contract mismatches, first end-to-end run | Full Pod 2 + Pod 3/4 |
| Aug 30 (Sun) | All hours | Bug bash, guardrail cross-checks, error-state handling — no new features | Joint session with Pod 1 |
| Aug 31 (Mon) | After exam | Deploy backend (FastAPI + Supabase env vars) | Harshika |
| Aug 31 (Mon) | After exam | Record demo video | Siddhi (with Nidhi/Sylvester) |

### Pod 3 — DB, ML & RAG
*Ishita, Amruta — independent full sessions, no overlap with any other pod.*

| Date | Hour Block | Task | Working With |
| :--- | :--- | :--- | :--- |
| Aug 25 (Tue) | Hour 1 – 3 | Loan catalogue table + seed data | Ishita, Amruta |
| Aug 26 (Wed) | Hour 1 – 3 | pgvector setup + embed sample policy docs | Ishita, Amruta |
| Aug 27 (Thu) | Hour 1 – 3 | RAG retrieval query + top-k chunk return | Ishita, Amruta |
| Aug 28 (Fri) | One check-in only | 15-min async status note — protected holiday, no build work | Whole team, async |
| Aug 29 (Sat) | All hours | Integration support — fix DB/RAG contract mismatches, first end-to-end run | Ishita, Amruta + Pod 2 |
| Aug 30 (Sun) | All hours | Bug bash, guardrail testing support, seed realistic demo data — no new features | Ishita, Amruta |
| Aug 31 (Mon) | After exam | Deploy Supabase / DB layer | Ishita |
| Aug 31 (Mon) | After exam | Buffer / QA support | Amruta |

### Pod 4 — Frontend UI/UX
*Nidhi, Sylvester — independent full sessions, no overlap with any other pod.*

| Date | Hour Block | Task | Working With |
| :--- | :--- | :--- | :--- |
| Aug 25 (Tue) | Hour 1 – 3 | React/Vite scaffold + Tailwind theme | Nidhi, Sylvester |
| Aug 26 (Wed) | Hour 1 – 3 | Hybrid Chat UI (MCQ / slider components) | Nidhi, Sylvester |
| Aug 27 (Thu) | Hour 1 – 3 | Loan Card component (static data first) | Nidhi, Sylvester |
| Aug 28 (Fri) | One check-in only | 15-min async status note — protected holiday, no build work | Whole team, async |
| Aug 29 (Sat) | All hours | Wire Loan Cards → Lead Form → Sales Dashboard into live pipeline | Nidhi, Sylvester |
| Aug 30 (Sun) | All hours | UI polish, error-state handling, seed realistic demo data — no new features | Nidhi, Sylvester |
| Aug 31 (Mon) | After exam | Record demo video | Nidhi (with Siddhi) |
| Aug 31 (Mon) | After exam | Buffer / QA support | Sylvester |