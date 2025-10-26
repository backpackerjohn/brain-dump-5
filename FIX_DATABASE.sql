-- ================================================
-- FIX: Add is_completed column to Supabase Database
-- ================================================
-- Run this SQL in your Supabase SQL Editor:
-- https://app.supabase.com/project/kogvkrtdnwgnifazttgd/sql

-- Add is_completed column to thoughts table
ALTER TABLE public.thoughts 
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT false;

-- Index for filtering completed thoughts
CREATE INDEX IF NOT EXISTS idx_thoughts_is_completed ON public.thoughts(is_completed);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'thoughts' AND column_name = 'is_completed';

-- Expected result: Should show is_completed | boolean | NO | false
