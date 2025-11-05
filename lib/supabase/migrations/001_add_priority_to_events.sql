-- Add priority column to events table if it doesn't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium';

