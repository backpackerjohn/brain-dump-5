-- ================================================
-- Create Connections and Connection Metadata Tables
-- Part of Connections Feature Phase 1 & 2.1 Implementation
-- Date: October 26, 2025
-- ================================================

-- Create connections table
-- Stores discovered connections between thoughts with AI-generated descriptions
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    thought1_id UUID NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
    thought2_id UUID NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
    title TEXT,  -- Reserved for Phase 3 (synthesis layer) - AI-generated insight title
    description TEXT NOT NULL,  -- AI explanation of the connection
    connection_type TEXT,  -- Reserved for Phase 3: 'problem_solution', 'goal_steps', 'cause_effect', etc.
    is_dismissed BOOLEAN NOT NULL DEFAULT false,  -- User can dismiss unhelpful connections
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create connection_metadata table
-- Tracks when analyses were run to enable smart caching (Phase 2.1)
CREATE TABLE IF NOT EXISTS public.connection_metadata (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_full_analysis_at TIMESTAMPTZ,  -- When last full AI analysis ran (even if 0 results)
    thoughts_analyzed_count INTEGER DEFAULT 0,  -- How many thoughts were analyzed
    last_incremental_at TIMESTAMPTZ,  -- Reserved for Phase 2.2 (incremental analysis)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- Performance Indexes
-- ================================================

-- Index for user-based queries (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_connections_user_id 
ON public.connections(user_id);

-- Indexes for thought-based lookups (when thought is deleted, find connections)
CREATE INDEX IF NOT EXISTS idx_connections_thought1_id 
ON public.connections(thought1_id);

CREATE INDEX IF NOT EXISTS idx_connections_thought2_id 
ON public.connections(thought2_id);

-- Index for time-based queries (finding recent connections)
CREATE INDEX IF NOT EXISTS idx_connections_created_at 
ON public.connections(created_at);

-- Composite partial index for active (non-dismissed) connections
-- Most efficient for "show me my active connections" queries
CREATE INDEX IF NOT EXISTS idx_connections_not_dismissed 
ON public.connections(user_id, is_dismissed) 
WHERE is_dismissed = false;

-- ================================================
-- Row Level Security (RLS)
-- ================================================

-- Enable RLS on both tables
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connections table
-- Users can only access their own connections

CREATE POLICY "Users can view own connections"
  ON public.connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON public.connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON public.connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON public.connections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for connection_metadata table
-- Users can only access their own metadata

CREATE POLICY "Users can view own connection metadata"
  ON public.connection_metadata FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connection metadata"
  ON public.connection_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connection metadata"
  ON public.connection_metadata FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connection metadata"
  ON public.connection_metadata FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================
-- Verification Queries (Optional - for testing)
-- ================================================

-- Verify tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('connections', 'connection_metadata');

-- Verify indexes were created
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('connections', 'connection_metadata');

-- Verify RLS policies were created
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('connections', 'connection_metadata');

-- ================================================
-- Expected Results:
-- - 2 tables created (connections, connection_metadata)
-- - 5 indexes created
-- - 8 RLS policies created (4 per table)
-- ================================================

