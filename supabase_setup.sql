-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cntaedhrwpxhfvqikpwu/sql

-- 1. Create the table structure (if not existing)
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Truncate existing rows to clear unowned development records (preventing composite primary key null-value errors)
TRUNCATE TABLE app_state;

-- 2. Add tenant_id column mapping to Supabase Users table
ALTER TABLE app_state ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 3. Rebuild primary key constraints to be composite (tenant_id, key)
ALTER TABLE app_state DROP CONSTRAINT IF EXISTS app_state_pkey;
ALTER TABLE app_state ADD PRIMARY KEY (tenant_id, key);

-- 4. Enable Row Level Security
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- 5. Drop old insecure policies
DROP POLICY IF EXISTS "allow_all" ON app_state;
DROP POLICY IF EXISTS "allow_authenticated" ON app_state;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON app_state;

-- 6. Apply strict multi-tenant Row Level Security
CREATE POLICY "tenant_isolation_policy" ON app_state
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());
