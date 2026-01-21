import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Authentication helper
async function authenticateRequest(req: Request): Promise<{ authenticated: boolean; error?: string }> {
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

  return { authenticated: true };
}

// Validation constants
const MAX_STRING_LENGTH = 5000;
const MAX_CONTEXT_LENGTH = 10000;
const MAX_ARRAY_LENGTH = 50;

const VALID_INTERVIEW_TYPES = ['behavioral', 'product_sense', 'product_design', 'rca', 'guesstimate', 'tech', 'ai_ml', 'strategy', 'metrics'];
const VALID_DIFFICULTIES = ['medium', 'hard', 'expert'];

interface GenerateRequest {
  interviewType: 'behavioral' | 'product_sense' | 'product_design' | 'rca' | 'guesstimate' | 'tech' | 'ai_ml' | 'strategy' | 'metrics';
  difficulty: 'medium' | 'hard' | 'expert';
  companyName: string;
  companyContext: string;
  decisions: string[];
  quotes: string[];
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
    throw new Error(`${fieldName} must be an array`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} items`);
  }
  return value.map((item, i) => {
    if (typeof item !== 'string') {
      throw new Error(`${fieldName}[${i}] must be a string`);
    }
    if (item.length > maxItemLength) {
      return item.substring(0, maxItemLength);
    }
    return item.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  });
}

// Validate request body
function validateRequest(body: unknown): GenerateRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a valid JSON object');
  }

  const obj = body as Record<string, unknown>;

  // Validate interview type
  if (!VALID_INTERVIEW_TYPES.includes(obj.interviewType as string)) {
    throw new Error(`interviewType must be one of: ${VALID_INTERVIEW_TYPES.join(', ')}`);
  }

  // Validate difficulty
  if (!VALID_DIFFICULTIES.includes(obj.difficulty as string)) {
    throw new Error(`difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  return {
    interviewType: obj.interviewType as GenerateRequest['interviewType'],
    difficulty: obj.difficulty as GenerateRequest['difficulty'],
    companyName: validateString(obj.companyName, 'companyName', MAX_STRING_LENGTH),
    companyContext: validateString(obj.companyContext, 'companyContext', MAX_CONTEXT_LENGTH),
    decisions: validateStringArray(obj.decisions, 'decisions', MAX_ARRAY_LENGTH, MAX_STRING_LENGTH),
    quotes: validateStringArray(obj.quotes, 'quotes', MAX_ARRAY_LENGTH, MAX_STRING_LENGTH),
    guestName: validateString(obj.guestName, 'guestName', MAX_STRING_LENGTH),
    episodeTitle: validateString(obj.episodeTitle, 'episodeTitle', MAX_STRING_LENGTH),
  };
}

const INTERVIEW_TYPE_PROMPTS: Record<string, string> = {
  behavioral: `Generate a behavioral interview question ("Tell me about a time...") based on a real situation this company/PM faced according to the podcast.`,
  
  product_sense: `Generate a product sense question about identifying opportunities or user needs, based on what the guest discussed about this company's situation.`,
  
  product_design: `Generate a product design question asking to design a feature or product, using constraints and context mentioned in the podcast.`,
  
  rca: `Generate a root cause analysis question about debugging a metric or problem, based on challenges the guest described.`,
  
  guesstimate: `Generate a market sizing or estimation question related to this company, using any numbers or context from the podcast.`,
  
  tech: `Generate a technical/architecture question at PM level, based on technical challenges or decisions discussed in the podcast.`,
  
  ai_ml: `Generate a question about AI/ML product decisions, based on any AI-related discussions from the podcast.`,
  
  strategy: `Generate a product strategy question about competitive positioning or long-term decisions, based on strategic discussions in the podcast.`,
  
  metrics: `Generate a metrics/goal-setting question about defining success metrics, based on how the guest discussed measuring outcomes.`
};

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

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    let body: GenerateRequest;
    try {
      body = validateRequest(rawBody);
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : 'Validation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { interviewType, difficulty, companyName, companyContext, decisions, quotes, guestName, episodeTitle } = body;

    const systemPrompt = `You are an expert PM interview coach for Lenny's Dojo.

CRITICAL RULES:
1. Use ONLY information from the provided podcast transcript context
2. DO NOT add any external facts, data, or information about the company
3. All scenarios, numbers, and outcomes must come from what the guest said
4. Frame all outcomes as "According to ${guestName}..." — never as absolute facts
5. Generate open-ended questions that require 15-45 minutes to answer
6. Questions must be realistic interview questions, NOT trivia about the podcast

You are creating a ${difficulty.toUpperCase()} difficulty question.`;

    const userPrompt = `${INTERVIEW_TYPE_PROMPTS[interviewType] || INTERVIEW_TYPE_PROMPTS.product_sense}

COMPANY: ${companyName}

TRANSCRIPT CONTEXT ABOUT THIS COMPANY:
${companyContext}

KEY DECISIONS DISCUSSED BY GUEST:
${decisions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

RELEVANT QUOTES FROM ${guestName.toUpperCase()}:
${quotes.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

SOURCE EPISODE: "${episodeTitle}" with ${guestName}

Generate a complete interview question. Return ONLY this JSON structure:
{
  "id": "<unique_id>",
  "type": "${interviewType}",
  "company": "${companyName}",
  "difficulty": "${difficulty}",
  "suggested_time_minutes": <15-45>,
  "situation_brief": "<2-3 sentences setting context from the podcast>",
  "question": "<the main interview question>",
  "follow_ups": ["<follow up 1>", "<follow up 2>", "<follow up 3>"],
  "model_answer": {
    "what_happened": "According to ${guestName}, <what actually happened>",
    "key_reasoning": "<the reasoning the guest explained>",
    "key_quote": "<most relevant direct quote>",
    "frameworks_mentioned": ["<framework 1>", "<framework 2>"],
    "full_answer": "<comprehensive model answer based on podcast content>"
  },
  "source": {
    "episode_title": "${episodeTitle}",
    "guest_name": "${guestName}"
  }
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'AI rate limited (429). Please try again shortly.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`Lovable AI error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Parse JSON from response
    let questionData;
    try {
      questionData = JSON.parse(content);
    } catch {
      // Extract JSON if wrapped in text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse question response');
      }
    }

    return new Response(JSON.stringify(questionData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Generate question error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
