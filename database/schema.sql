-- ============================================================================
-- Pod 3: Database & RAG Schema Definition
-- Supabase PostgreSQL + pgvector Extension
-- ============================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. LOAN CATALOGUE TABLE
CREATE TABLE IF NOT EXISTS loan_products (
    product_id VARCHAR(50) PRIMARY KEY,
    product_name TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    min_amount NUMERIC(15, 2) NOT NULL,
    max_amount NUMERIC(15, 2) NOT NULL,
    min_tenure_months INT NOT NULL,
    max_tenure_months INT NOT NULL,
    base_interest_rate NUMERIC(5, 2) NOT NULL,
    min_monthly_income NUMERIC(15, 2) NOT NULL,
    min_credit_score INT DEFAULT 650,
    allowed_employment_types TEXT[] DEFAULT '{"salaried", "self_employed", "business_owner"}',
    max_foir_pct NUMERIC(5, 2) DEFAULT 0.50,
    processing_fee_pct NUMERIC(5, 2) DEFAULT 1.0,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMER PROFILES & CHAT SESSIONS
CREATE TABLE IF NOT EXISTS customer_profiles (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type VARCHAR(20) DEFAULT 'guest',
    applicant_name VARCHAR(100),
    intent VARCHAR(50),
    age INT,
    monthly_income NUMERIC(15, 2),
    employment_type VARCHAR(50),
    employer_type VARCHAR(50),
    years_at_current_job INT,
    years_in_business INT,
    requested_loan_amount NUMERIC(15, 2),
    preferred_tenure_months INT,
    existing_emi_obligations NUMERIC(15, 2) DEFAULT 0.0,
    has_existing_loans BOOLEAN DEFAULT FALSE,
    credit_score_band VARCHAR(20),
    credit_score_numeric INT,
    urgency VARCHAR(30),
    has_co_applicant BOOLEAN DEFAULT FALSE,
    co_applicant_income NUMERIC(15, 2),
    has_collateral BOOLEAN DEFAULT FALSE,
    preferred_emi VARCHAR(50),
    interest_type VARCHAR(20),
    
    -- Category-specific details (JSONB)
    home_loan_details JSONB DEFAULT NULL,
    vehicle_loan_details JSONB DEFAULT NULL,
    education_loan_details JSONB DEFAULT NULL,
    business_loan_details JSONB DEFAULT NULL,
    personal_loan_details JSONB DEFAULT NULL,
    
    completeness_pct INT DEFAULT 0,
    turns_taken INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RAG POLICY CHUNKS TABLE (pgvector)
CREATE TABLE IF NOT EXISTS loan_policy_chunks (
    chunk_id VARCHAR(100) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES loan_products(product_id) ON DELETE CASCADE,
    document_title TEXT NOT NULL,
    clause_category VARCHAR(50),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(384),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW Vector Index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_policy_chunks_embedding 
ON loan_policy_chunks 
USING hnsw (embedding vector_cosine_ops);

-- 5. RAG RETRIEVAL RPC FUNCTION
CREATE OR REPLACE FUNCTION match_policy_chunks (
    query_embedding VECTOR(384),
    match_product_id VARCHAR(50),
    match_count INT DEFAULT 4,
    similarity_threshold FLOAT DEFAULT 0.20
)
RETURNS TABLE (
    chunk_id VARCHAR(100),
    product_id VARCHAR(50),
    document_title TEXT,
    clause_category VARCHAR(50),
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        lpc.chunk_id,
        lpc.product_id,
        lpc.document_title,
        lpc.clause_category,
        lpc.content,
        1 - (lpc.embedding <=> query_embedding) AS similarity
    FROM loan_policy_chunks lpc
    WHERE lpc.product_id = match_product_id
      AND 1 - (lpc.embedding <=> query_embedding) >= similarity_threshold
    ORDER BY lpc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 6. QUALIFIED LEADS TABLE (For Sales Dashboard)
CREATE TABLE IF NOT EXISTS qualified_leads (
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES customer_profiles(session_id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    preferred_contact_time TEXT,
    interested_product_id VARCHAR(50) REFERENCES loan_products(product_id),
    lead_score INT NOT NULL CHECK (lead_score >= 0 AND lead_score <= 100),
    lead_band VARCHAR(10) NOT NULL CHECK (lead_band IN ('hot', 'warm', 'cold')),
    score_factors JSONB DEFAULT '[]'::jsonb,
    chat_summary TEXT,
    key_objections_or_notes TEXT,
    recommended_talking_points JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'dropped')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE loan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_policy_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualified_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active loan products" ON loan_products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view policy chunks" ON loan_policy_chunks FOR SELECT USING (TRUE);
CREATE POLICY "Allow all operations for service and anon keys on profiles" ON customer_profiles FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Allow all operations for service and anon keys on leads" ON qualified_leads FOR ALL USING (TRUE) WITH CHECK (TRUE);