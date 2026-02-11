
-- Create question_bank table for pre-generated static questions
CREATE TABLE public.question_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  episode_title TEXT NOT NULL,
  interview_type TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  question JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read questions
CREATE POLICY "Authenticated users can read question bank"
ON public.question_bank
FOR SELECT
TO authenticated
USING (true);

-- Only service_role can write (via edge functions)
CREATE POLICY "Service role can insert questions"
ON public.question_bank
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can delete questions"
ON public.question_bank
FOR DELETE
TO service_role
USING (true);

CREATE POLICY "Service role can update questions"
ON public.question_bank
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Index for efficient querying
CREATE INDEX idx_question_bank_company ON public.question_bank(company_name);
CREATE INDEX idx_question_bank_type ON public.question_bank(interview_type);
CREATE INDEX idx_question_bank_difficulty ON public.question_bank(difficulty);
CREATE INDEX idx_question_bank_episode ON public.question_bank(episode_id);
