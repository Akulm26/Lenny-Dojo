import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Authentication - accepts service role OR authenticated user JWT
async function authenticateRequest(req: Request): Promise<{ authenticated: boolean; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Option 1: Service role key (for internal calls)
  if (token === SUPABASE_SERVICE_ROLE_KEY) {
    return { authenticated: true };
  }

  // Option 2: Validate user JWT token
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return { authenticated: false, error: 'Invalid or expired token' };
    }
    
    return { authenticated: true };
  } catch {
    return { authenticated: false, error: 'Token validation failed' };
  }
}

// Validation constants
const MAX_EPISODES = 500;
const MAX_STRING_LENGTH = 500;

interface EpisodeInput {
  id: string;
  guest: string;
  title: string;
}

// Validate and sanitize string input
function validateString(value: unknown, fieldName: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length > maxLength) {
    return value.substring(0, maxLength);
  }
  // Basic sanitization - remove control characters
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Validate episode object
function validateEpisode(value: unknown, index: number): EpisodeInput {
  if (!value || typeof value !== 'object') {
    throw new Error(`episodes[${index}] must be an object`);
  }

  const obj = value as Record<string, unknown>;

  return {
    id: validateString(obj.id, `episodes[${index}].id`, MAX_STRING_LENGTH),
    guest: validateString(obj.guest, `episodes[${index}].guest`, MAX_STRING_LENGTH),
    title: validateString(obj.title, `episodes[${index}].title`, MAX_STRING_LENGTH),
  };
}

// Validate request body
function validateRequest(body: unknown): EpisodeInput[] {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a valid JSON object');
  }

  const obj = body as Record<string, unknown>;
  const episodes = obj.episodes;

  if (!Array.isArray(episodes)) {
    throw new Error('episodes must be an array');
  }

  if (episodes.length === 0) {
    throw new Error('episodes array cannot be empty');
  }

  if (episodes.length > MAX_EPISODES) {
    throw new Error(`episodes array exceeds maximum length of ${MAX_EPISODES}`);
  }

  return episodes.map((ep, i) => validateEpisode(ep, i));
}

// Generate realistic demo intelligence for an episode based on its metadata
function generateDemoIntelligence(episodeId: string, guestName: string, episodeTitle: string) {
  // Parse guest name to create more realistic data
  const nameParts = guestName.split(' ');
  const firstName = nameParts[0] || 'Guest';
  
  // Generate different companies based on episode characteristics
  const commonCompanies = [
    { name: 'Airbnb', context: 'growth and marketplace dynamics' },
    { name: 'Stripe', context: 'developer experience and product-led growth' },
    { name: 'Slack', context: 'enterprise adoption and viral growth' },
    { name: 'Notion', context: 'product design and user engagement' },
    { name: 'Figma', context: 'collaborative design and community' },
    { name: 'Linear', context: 'product velocity and engineering culture' },
    { name: 'Superhuman', context: 'premium products and speed' },
    { name: 'Amplitude', context: 'product analytics and data-driven decisions' },
    { name: 'Loom', context: 'async communication and adoption' },
    { name: 'Calendly', context: 'product-led growth and simplicity' },
  ];
  
  // Select 2-4 random companies for this episode
  const shuffled = [...commonCompanies].sort(() => Math.random() - 0.5);
  const selectedCompanies = shuffled.slice(0, 2 + Math.floor(Math.random() * 3));
  
  // Add a "guest company" based on the episode
  const guestCompanyName = episodeTitle.includes('at ') 
    ? episodeTitle.split('at ')[1]?.split(/[,|\-]/)[0]?.trim() || `${firstName}'s Company`
    : `${firstName}'s Company`;

  const frameworks = [
    {
      name: 'Jobs to Be Done',
      creator: 'Clayton Christensen',
      category: 'Customer Research',
      explanation: 'Focus on the underlying job customers are trying to accomplish, not the product features.',
      when_to_use: 'When doing customer research or defining product strategy',
      example: `${guestName} used JTBD to understand why users really adopted their product.`,
      quote: 'Customers hire products to do jobs for them.',
    },
    {
      name: 'The RICE Framework',
      creator: 'Intercom',
      category: 'Prioritization',
      explanation: 'Score features by Reach, Impact, Confidence, and Effort to prioritize effectively.',
      when_to_use: 'When prioritizing a backlog of features or initiatives',
      example: 'The team used RICE to cut through opinion-based debates about what to build next.',
      quote: 'Data-driven prioritization beats HiPPO (Highest Paid Person\'s Opinion).',
    },
    {
      name: 'North Star Metric',
      creator: 'Sean Ellis',
      category: 'Metrics',
      explanation: 'A single metric that best captures the core value your product delivers to customers.',
      when_to_use: 'When aligning teams around what matters most for growth',
      example: 'Focusing on weekly active users helped the team make better product decisions.',
      quote: 'The North Star Metric aligns the entire company around delivering customer value.',
    },
    {
      name: 'Opportunity Solution Tree',
      creator: 'Teresa Torres',
      category: 'Discovery',
      explanation: 'Visual framework connecting outcomes to opportunities to solutions through continuous discovery.',
      when_to_use: 'During product discovery to explore the problem space',
      example: `${guestName} shared how they map customer opportunities before jumping to solutions.`,
      quote: 'Good product teams fall in love with the problem, not the solution.',
    },
  ];
  
  // Select 1-2 frameworks
  const selectedFrameworks = [...frameworks]
    .sort(() => Math.random() - 0.5)
    .slice(0, 1 + Math.floor(Math.random() * 2));

  const companies = [
    // Guest's company (if identifiable)
    {
      name: guestCompanyName,
      is_guest_company: true,
      mention_context: `${guestName}'s experience building and scaling the product`,
      decisions: [
        {
          what: 'Focused on a single use case before expanding',
          when: 'Early stage',
          why: 'Needed to nail the core value prop before adding complexity',
          outcome: 'Achieved strong product-market fit with initial users',
          quote: `We had to resist the urge to build everything at once.`,
        },
        {
          what: 'Invested heavily in user research',
          when: 'Growth phase',
          why: 'Wanted to understand the why behind user behavior',
          outcome: 'Uncovered unexpected use cases that drove expansion',
          quote: `The best insights came from watching users, not asking them.`,
        },
      ],
      opinions: [
        {
          opinion: 'Speed of iteration matters more than perfection',
          quote: `Ship fast, learn fast. Perfect is the enemy of shipped.`,
        },
      ],
      metrics_mentioned: ['Weekly Active Users', 'Retention Rate', 'NPS'],
    },
    // Add referenced companies
    ...selectedCompanies.map((c, i) => ({
      name: c.name,
      is_guest_company: false,
      mention_context: `Referenced as an example of ${c.context}`,
      decisions: i === 0 ? [
        {
          what: `Built for a specific user persona first`,
          when: 'Early days',
          why: 'Needed to prove value before expanding',
          outcome: 'Created a strong foundation for growth',
          quote: `${c.name} understood their core user deeply.`,
        },
      ] : [],
      opinions: i < 2 ? [
        {
          opinion: `${c.name}'s approach to ${c.context} is worth studying`,
          quote: `They really got ${c.context} right.`,
        },
      ] : [],
      metrics_mentioned: i === 0 ? ['Growth Rate', 'User Engagement'] : [],
    })),
  ];

  const question_seeds = [
    {
      type: 'product_strategy',
      company: guestCompanyName,
      situation: `A PM at a B2B SaaS company similar to ${guestCompanyName} is facing a strategic decision.`,
      what_happened: 'The team needs to decide whether to go deeper on existing use cases or expand to adjacent ones.',
      usable_quotes: [
        `${guestName}: "The hardest part is saying no to good ideas."`,
        `${guestName}: "Focus is a superpower in product development."`,
      ],
    },
    {
      type: 'prioritization',
      company: guestCompanyName,
      situation: 'Engineering resources are limited and stakeholders have competing priorities.',
      what_happened: `${guestName} shared how they handled this exact situation.`,
      usable_quotes: [
        `"Use data to have better arguments, not to avoid arguments."`,
        `"Every yes is a no to something else."`,
      ],
    },
  ];

  const memorable_quotes = [
    {
      quote: `The best product managers are obsessed with understanding the customer's world.`,
      topic: 'Customer Empathy',
      context: `${guestName} on what separates good PMs from great ones.`,
    },
    {
      quote: `Shipping is a habit. If you're not shipping, you're not learning.`,
      topic: 'Velocity',
      context: 'On the importance of maintaining momentum.',
    },
    {
      quote: `Your roadmap is a hypothesis, not a promise.`,
      topic: 'Planning',
      context: 'On treating product plans with appropriate uncertainty.',
    },
  ];

  return {
    companies,
    frameworks: selectedFrameworks,
    question_seeds,
    memorable_quotes,
    _source: {
      episode_id: episodeId,
      guest_name: guestName,
      episode_title: episodeTitle,
      extracted_at: new Date().toISOString(),
    },
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate - accepts service role OR authenticated user JWT
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return new Response(
        JSON.stringify({ error: auth.error || 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse and validate request
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let episodes: EpisodeInput[];
    try {
      episodes = validateRequest(rawBody);
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : 'Validation failed' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which episodes are already cached
    const episodeIds = episodes.map(e => e.id);
    const { data: existingCache } = await supabase
      .from('episode_intelligence_cache')
      .select('episode_id')
      .in('episode_id', episodeIds);

    const cachedIds = new Set((existingCache || []).map(e => e.episode_id));
    const uncachedEpisodes = episodes.filter(e => !cachedIds.has(e.id));

    console.log(`Found ${cachedIds.size} cached, ${uncachedEpisodes.length} to seed`);

    if (uncachedEpisodes.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "All episodes already cached", 
          cached: cachedIds.size,
          seeded: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate and insert demo intelligence in batches
    const BATCH_SIZE = 50;
    let totalSeeded = 0;

    for (let i = 0; i < uncachedEpisodes.length; i += BATCH_SIZE) {
      const batch = uncachedEpisodes.slice(i, i + BATCH_SIZE);
      
      const records = batch.map(episode => ({
        episode_id: episode.id,
        guest_name: episode.guest,
        episode_title: episode.title,
        intelligence: generateDemoIntelligence(episode.id, episode.guest, episode.title),
        extracted_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('episode_intelligence_cache')
        .upsert(records, { onConflict: 'episode_id' });

      if (error) {
        console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error);
        throw error;
      }

      totalSeeded += batch.length;
      console.log(`Seeded batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} episodes`);
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully seeded ${totalSeeded} episodes`,
        cached: cachedIds.size,
        seeded: totalSeeded,
        total: episodes.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Seed intelligence cache error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
