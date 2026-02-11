import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Friendly error messages for invalid API keys
function friendlyApiError(provider: string, status: number, _rawError: string): string {
  const name = provider === 'google_gemini' ? 'Google Gemini' : provider === 'openai' ? 'OpenAI' : provider === 'deepseek' ? 'DeepSeek' : 'Anthropic';
  if (status === 401 || status === 403) return `Your ${name} API key is invalid or has been revoked. Please update it in Settings → API Keys.`;
  if (status === 429) return `Your ${name} API key has hit its rate limit. Please wait a moment or check your plan's usage limits.`;
  if (status === 402 || status === 400) return `Your ${name} API key request was rejected (${status}). Please check your billing and API key permissions.`;
  return `${name} returned an error (${status}). Please verify your API key in Settings → API Keys.`;
}

const PROVIDER_CONFIG: Record<string, { url: string; defaultModel: string; authHeader: (key: string) => Record<string, string> }> = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
  },
  google_gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-2.5-flash',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-20250514',
    authHeader: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }),
  },
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
  },
};

// Authentication helper
async function authenticateRequest(req: Request): Promise<{ authenticated: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    return { authenticated: false, error: 'Invalid or expired token' };
  }

  return { authenticated: true, userId: data.user.id };
}

async function getUserApiKey(userId: string): Promise<{ provider: string; apiKey: string } | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('provider, api_key')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return { provider: data.provider, apiKey: data.api_key };
}

async function callAI(userId: string, messages: Array<{role: string; content: string}>, maxTokens: number) {
  const userKey = await getUserApiKey(userId);

  if (userKey && PROVIDER_CONFIG[userKey.provider]) {
    const config = PROVIDER_CONFIG[userKey.provider];

    if (userKey.provider === 'anthropic') {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...config.authHeader(userKey.apiKey) },
        body: JSON.stringify({
          model: config.defaultModel,
          max_tokens: maxTokens,
          system: messages.find(m => m.role === 'system')?.content || '',
          messages: messages.filter(m => m.role !== 'system'),
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(friendlyApiError('Anthropic', response.status, errText));
      }
      const data = await response.json();
      return data.content?.[0]?.text ?? '';
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...config.authHeader(userKey.apiKey) },
      body: JSON.stringify({ model: config.defaultModel, messages, max_tokens: maxTokens }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(friendlyApiError(userKey.provider, response.status, errText));
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  // No fallback — user must configure their own API key
  throw new Error('No API key configured. Please add your own API key in Settings → API Keys before using this feature.');
}

// Validation constants
const MAX_STRING_LENGTH = 2000;
const MAX_ANSWER_LENGTH = 15000;
const MAX_ARRAY_LENGTH = 20;

interface ModelAnswer {
  what_happened: string;
  key_reasoning: string;
  key_quote: string;
  frameworks_mentioned: string[];
  full_answer: string;
}

interface EvaluateRequest {
  question: string;
  situationBrief: string;
  userAnswer: string;
  modelAnswer: ModelAnswer;
  interviewType: string;
  guestName: string;
  episodeTitle: string;
}

// Validate and sanitize string input
function validateString(value: unknown, fieldName: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  }
  // Basic sanitization - remove control characters except newlines/tabs
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Validate string array
function validateStringArray(value: unknown, fieldName: string, maxLength: number, maxItemLength: number): string[] {
  if (!Array.isArray(value)) {
    return []; // Allow missing arrays
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} items`);
  }
  return value.map((item, i) => {
    if (typeof item !== 'string') {
      return '';
    }
    if (item.length > maxItemLength) {
      return item.substring(0, maxItemLength);
    }
    return item.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }).filter(Boolean);
}

// Validate model answer object
function validateModelAnswer(value: unknown): ModelAnswer {
  if (!value || typeof value !== 'object') {
    throw new Error('modelAnswer must be an object');
  }

  const obj = value as Record<string, unknown>;

  return {
    what_happened: validateString(obj.what_happened || '', 'modelAnswer.what_happened', MAX_STRING_LENGTH),
    key_reasoning: validateString(obj.key_reasoning || '', 'modelAnswer.key_reasoning', MAX_STRING_LENGTH),
    key_quote: validateString(obj.key_quote || '', 'modelAnswer.key_quote', MAX_STRING_LENGTH),
    frameworks_mentioned: validateStringArray(obj.frameworks_mentioned, 'modelAnswer.frameworks_mentioned', MAX_ARRAY_LENGTH, 200),
    full_answer: validateString(obj.full_answer || '', 'modelAnswer.full_answer', MAX_ANSWER_LENGTH),
  };
}

// Validate request body
function validateRequest(body: unknown): EvaluateRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a valid JSON object');
  }

  const obj = body as Record<string, unknown>;

  return {
    question: validateString(obj.question, 'question', MAX_STRING_LENGTH),
    situationBrief: validateString(obj.situationBrief, 'situationBrief', MAX_STRING_LENGTH),
    userAnswer: validateString(obj.userAnswer, 'userAnswer', MAX_ANSWER_LENGTH),
    modelAnswer: validateModelAnswer(obj.modelAnswer),
    interviewType: validateString(obj.interviewType, 'interviewType', 50),
    guestName: validateString(obj.guestName, 'guestName', 200),
    episodeTitle: validateString(obj.episodeTitle, 'episodeTitle', 500),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate request
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return new Response(
        JSON.stringify({ error: auth.error || 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: EvaluateRequest;
    try {
      body = validateRequest(rawBody);
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : 'Validation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a supportive but honest PM interview coach at Lenny's Dojo.

Your job is to evaluate the user's answer by comparing it to insights from ${body.guestName}'s appearance on Lenny's Podcast.

TONE GUIDELINES:
- Be encouraging and constructive
- Highlight what they did well first
- Give specific, actionable improvement suggestions
- Reference the podcast guest's insights naturally
- Help them see patterns they can apply in real interviews`;

    const userPrompt = `INTERVIEW TYPE: ${body.interviewType}

SITUATION BRIEF:
${body.situationBrief}

QUESTION:
${body.question}

WHAT ${body.guestName.toUpperCase()} SAID (from "${body.episodeTitle}"):
- What happened: ${body.modelAnswer.what_happened}
- Their reasoning: ${body.modelAnswer.key_reasoning}
- Key quote: "${body.modelAnswer.key_quote}"
- Frameworks they mentioned: ${body.modelAnswer.frameworks_mentioned.join(', ') || 'None specifically named'}

USER'S ANSWER:
${body.userAnswer}

---

Evaluate the answer. Return ONLY this JSON:
{
  "overall_score": <number 1-10, be fair but encouraging>,
  "dimension_scores": {
    "structure": {
      "score": <1-10>,
      "feedback": "<1 sentence on their answer structure>"
    },
    "insight": {
      "score": <1-10>,
      "feedback": "<1 sentence on depth of thinking>"
    },
    "framework_usage": {
      "score": <1-10>,
      "feedback": "<1 sentence on framework application>"
    },
    "communication": {
      "score": <1-10>,
      "feedback": "<1 sentence on clarity>"
    },
    "outcome_orientation": {
      "score": <1-10>,
      "feedback": "<1 sentence on focus on results/impact>"
    }
  },
  "strengths": [
    "<specific thing they did well with example from their answer>",
    "<another strength>"
  ],
  "improvements": [
    "<specific improvement with actionable suggestion>",
    "<another improvement with concrete advice>"
  ],
  "missed_from_podcast": [
    "<key insight from ${body.guestName} they could have used>",
    "<another point from the podcast that would strengthen their answer>"
  ],
  "quote_to_remember": {
    "text": "${body.modelAnswer.key_quote}",
    "why_it_matters": "<how this quote applies to PM interviews>"
  },
  "encouragement": "<1-2 sentences of genuine encouragement>"
}`;

    const content = await callAI(auth.userId!, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 2000);

    let evaluationData;
    try {
      evaluationData = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse evaluation response');
      }
    }

    return new Response(JSON.stringify(evaluationData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Evaluate answer error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
