-- ============================================================================
-- Migration 001 — Lead source attribution + Guarantor / Co-applicant capture
-- Target: Supabase / PostgreSQL  ·  schema: public
-- Safe to re-run (all statements are IF [NOT] EXISTS guarded).
-- ============================================================================

-- 1. lead_source ------------------------------------------------------------
--    Where the qualified lead originated:
--      'genai'                → captured by the GenAI advisory / voice agent
--      'manual_employee_call' → logged by a bank employee after a phone call
ALTER TABLE IF EXISTS public.qualified_leads
    ADD COLUMN IF NOT EXISTS lead_source TEXT NOT NULL DEFAULT 'genai';

-- Constrain to the known set of sources (dropped first so re-runs don't fail).
ALTER TABLE IF EXISTS public.qualified_leads
    DROP CONSTRAINT IF EXISTS qualified_leads_lead_source_check;
ALTER TABLE IF EXISTS public.qualified_leads
    ADD CONSTRAINT qualified_leads_lead_source_check
    CHECK (lead_source IN ('genai', 'manual_employee_call'));

-- Back-fill any pre-existing rows (defensive; DEFAULT already covers new rows).
UPDATE public.qualified_leads SET lead_source = 'genai' WHERE lead_source IS NULL;

CREATE INDEX IF NOT EXISTS qualified_leads_lead_source_idx
    ON public.qualified_leads (lead_source);

-- 2. Guarantor / Co-applicant (both optional) ------------------------------
--    Stored as JSONB: { "name": text, "relation": text, "monthly_salary": numeric }
--    Business rule (enforced in the API layer): a declared guarantor must have
--    a minimum monthly salary of ₹25,000 to be considered eligible.
ALTER TABLE IF EXISTS public.qualified_leads
    ADD COLUMN IF NOT EXISTS guarantor    JSONB,
    ADD COLUMN IF NOT EXISTS co_applicant JSONB;

-- 3. Refresh PostgREST schema cache so the Supabase REST client sees the columns
NOTIFY pgrst, 'reload schema';
