// Generate Question Bank Edge Function
// Pre-generates static questions from cached intelligence and stores them in question_bank
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INTERVIEW_TYPES = ['behavioral', 'product_sense', 'product_design', 'rca', 'strategy', 'metrics'];
const DIFFICULTIES = ['medium', 'hard'];

const INTERVIEW_TYPE_PROMPTS: Record<string, string> = {
  behavioral: 'Generate a behavioral interview question ("Tell me about a time...") based on a real situation this company/PM faced according to the podcast.',
  product_sense: 'Generate a product sense question about identifying opportunities or user needs, based on what the guest discussed.',
  product_design: 'Generate a product design question asking to design a feature or product, using constraints and context mentioned in the podcast.',
  rca: 'Generate a root cause analysis question about debugging a metric or problem, based on challenges the guest described.',
  strategy: 'Generate a product strategy question about competitive positioning or long-term decisions, based on strategic discussions in the podcast.',
  metrics: 'Generate a metrics/goal-setting question about defining success metrics, based on how the guest discussed measuring outcomes.',
};

// Service role OR authenticated user
async function authenticateRequest(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.replace('Bearer ', '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  // Service role
  if (serviceRoleKey && token === serviceRoleKey) return true;
  
  // Authenticated user (any logged-in user can trigger population)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data, error } = await supabase.auth.getUser(token);
  return !error && !!data?.user;
}

async function callLovableAI(messages: Array<{role: string; content: string}>, maxTokens: number): Promise<string> {
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) throw new Error('RATE_LIMITED');
    if (response.status === 402) throw new Error('PAYMENT_REQUIRED');
    throw new Error(`Lovable AI error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function cleanJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) text = codeBlockMatch[1];
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return text;
  let json = jsonMatch[0];
  json = json.replace(/,(\s*[\]\}])/g, '$1');
  return json;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!(await authenticateRequest(req))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const episodeIds: string[] = body.episodeIds || [];
    const maxQuestions: number = body.maxQuestions || 999;
    const typesFilter: string[] = body.types || INTERVIEW_TYPES;
    const diffsFilter: string[] = body.difficulties || DIFFICULTIES;

    // Fetch intelligence for specified episodes (or all)
    let query = supabase.from('episode_intelligence_cache').select('*');
    if (episodeIds.length > 0) {
      query = query.in('episode_id', episodeIds);
    }
    const { data: episodes, error: fetchError } = await query;

    if (fetchError || !episodes?.length) {
      return new Response(JSON.stringify({ error: 'No intelligence data found', details: fetchError?.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check existing questions to avoid duplicates
    const existingQuery = supabase.from('question_bank').select('episode_id, interview_type, difficulty');
    if (episodeIds.length > 0) {
      existingQuery.in('episode_id', episodeIds);
    }
    const { data: existing } = await existingQuery;
    const existingSet = new Set((existing || []).map(e => `${e.episode_id}:${e.interview_type}:${e.difficulty}`));

    let generated = 0;
    const errors: string[] = [];

    for (const episode of episodes) {
      const intel = episode.intelligence as any;
      if (!intel?.companies?.length) continue;

      // Find companies with enough context
      const richCompanies = intel.companies.filter((c: any) =>
        (c.decisions?.length > 0 || c.opinions?.length > 0)
      );

      if (richCompanies.length === 0) continue;

      // Pick the richest company for this episode
      const company = richCompanies.sort((a: any, b: any) =>
        ((b.decisions?.length || 0) + (b.opinions?.length || 0)) -
        ((a.decisions?.length || 0) + (a.opinions?.length || 0))
      )[0];

      const decisions = (company.decisions || []).map((d: any) =>
        `${d.what}${d.why ? ` (Why: ${d.why})` : ''}${d.outcome ? ` → ${d.outcome}` : ''}`
      ).slice(0, 5);

      const quotes = (company.decisions || [])
        .filter((d: any) => d.quote)
        .map((d: any) => d.quote)
        .concat((company.opinions || []).filter((o: any) => o.quote).map((o: any) => o.quote))
        .slice(0, 5);

      // Generate questions for each type/difficulty combo
      for (const type of typesFilter) {
        for (const diff of diffsFilter) {
          if (generated >= maxQuestions) break;
          const key = `${episode.episode_id}:${type}:${diff}`;
          if (existingSet.has(key)) continue;

          try {
            const systemPrompt = `You are an expert PM interview coach. Generate a realistic interview question based ONLY on the podcast transcript context provided. Return ONLY valid JSON.`;

            const userPrompt = `${INTERVIEW_TYPE_PROMPTS[type]}

COMPANY: ${company.name}
CONTEXT: ${company.mention_context || company.name}
DECISIONS: ${decisions.map((d: string, i: number) => `${i + 1}. ${d}`).join('\n')}
QUOTES: ${quotes.map((q: string, i: number) => `${i + 1}. "${q}"`).join('\n')}
SOURCE: "${episode.episode_title}" with ${episode.guest_name}
DIFFICULTY: ${diff.toUpperCase()}

Return ONLY this JSON:
{
  "id": "${episode.episode_id}-${type}-${diff}",
  "type": "${type}",
  "company": "${company.name}",
  "difficulty": "${diff}",
  "suggested_time_minutes": ${diff === 'hard' ? 30 : 20},
  "situation_brief": "<2-3 sentences>",
  "question": "<the interview question>",
  "follow_ups": ["<follow up 1>", "<follow up 2>", "<follow up 3>"],
  "model_answer": {
    "what_happened": "According to ${episode.guest_name}, <what happened>",
    "key_reasoning": "<reasoning>",
    "key_quote": "<direct quote>",
    "frameworks_mentioned": [],
    "full_answer": "<comprehensive model answer>"
  },
  "source": {
    "episode_title": "${episode.episode_title}",
    "guest_name": "${episode.guest_name}"
  }
}`;

            const content = await callLovableAI([
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ], 3000);

            let questionData;
            try {
              questionData = JSON.parse(content);
            } catch {
              const cleaned = cleanJson(content);
              questionData = JSON.parse(cleaned);
            }

            // Store in question_bank
            const { error: insertError } = await supabase.from('question_bank').insert({
              episode_id: episode.episode_id,
              company_name: company.name,
              guest_name: episode.guest_name,
              episode_title: episode.episode_title,
              interview_type: type,
              difficulty: diff,
              question: questionData,
            });

            if (insertError) {
              errors.push(`${key}: ${insertError.message}`);
            } else {
              generated++;
              console.log(`✓ Generated: ${key}`);
            }

            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 500));

          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg === 'RATE_LIMITED' || msg === 'PAYMENT_REQUIRED') {
              console.log(`Stopping: ${msg}`);
              return new Response(JSON.stringify({
                message: `Stopped due to ${msg}. Generated ${generated} questions so far.`,
                generated,
                errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
              }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            errors.push(`${key}: ${msg}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      message: `Generated ${generated} questions`,
      generated,
      episodes: episodes.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Generate question bank error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
