-- Add priority column to events table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium';

-- Update existing events to have a default priority
UPDATE public.events 
SET priority = 'medium' 
WHERE priority IS NULL;

