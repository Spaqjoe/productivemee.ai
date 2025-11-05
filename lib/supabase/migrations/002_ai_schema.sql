-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- AI sessions
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text,
  created_at timestamptz DEFAULT now()
);

-- AI messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
  role text CHECK (role IN ('user','assistant','system')) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Search index with embeddings (1536 dims as example)
CREATE TABLE IF NOT EXISTS public.ai_search_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind text NOT NULL,
  ref_id text,
  text text NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- Example helper function (stub) used by actions.ts
CREATE OR REPLACE FUNCTION public.analyze_budget_month(p_month text)
RETURNS jsonb AS $$
  SELECT jsonb_build_object(
    'month', p_month,
    'income', 0,
    'expenses', 0,
    'cashflow', 0
  );
$$ LANGUAGE sql STABLE;


