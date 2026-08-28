# Pod 3: Database, ML Math & pgvector RAG Pipeline

**Team Mandate:** Supabase schema design, pgvector policy retrieval, deterministic rule-based matching engine, and hallucination guardrails.
**Members:** Ishita, Amruta

---

## Directory Structure
```text
database/
├── database.py              # Supabase connection & RAG query functions
├── schemas.py               # Frozen Pydantic v2 data models for the team
├── scoring_engine.py        # Rule-based scoring & deterministic EMI math
├── guardrails.py            # Hallucination detection & citation verification
├── seed_policy_embeddings.py# Python script to populate pgvector embeddings
├── test_full_pipeline.py    # Local integration verification test
├── schema.sql               # PostgreSQL tables, HNSW index & stored procedure
└── seed_data.sql            # 20 loan products, 15 profiles, 15 scored leads