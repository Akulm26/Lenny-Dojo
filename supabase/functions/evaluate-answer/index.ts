import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvaluateRequest {
  question: string;
  situationBrief: string;
  userAnswer: string;
  modelAnswer: {
    what_happened: string;
    key_reasoning: string;
    key_quote: string;
    frameworks_mentioned: string[];
    full_answer: string;
  };
  interviewType: string;
  guestName: string;
  episodeTitle: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body: EvaluateRequest = await req.json();

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
        max_tokens: 2000,
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
