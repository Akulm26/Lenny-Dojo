
ALTER TABLE public.user_api_keys DROP CONSTRAINT user_api_keys_provider_check;
ALTER TABLE public.user_api_keys ADD CONSTRAINT user_api_keys_provider_check CHECK (provider IN ('openai', 'google_gemini', 'anthropic', 'deepseek'));
