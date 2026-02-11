// Manage API Keys Edge Function - handles encrypted CRUD for user API keys
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---- AES-GCM Encryption Helpers ----

const ENCRYPTION_KEY_ENV = 'API_KEY_ENCRYPTION_KEY';

async function getEncryptionKey(): Promise<CryptoKey> {
  const raw = Deno.env.get(ENCRYPTION_KEY_ENV);
  if (!raw) throw new Error('Encryption key not configured');

  // Derive a 256-bit key from the secret using SHA-256
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
  
  return crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptApiKey(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine IV + ciphertext and base64 encode
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Base64 encode
  return btoa(String.fromCharCode(...combined));
}

export async function decryptApiKey(ciphertext: string): Promise<string> {
  const key = await getEncryptionKey();
  
  // Base64 decode
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  
  // Split IV and ciphertext
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

// ---- Auth Helper ----

async function authenticateRequest(req: Request): Promise<{ userId?: string; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing authorization' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) return { error: 'Invalid token' };
  return { userId: data.user.id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticateRequest(req);
    if (!auth.userId) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action, provider, apiKey } = body;

    if (action === 'list') {
      // Return which providers have keys (without the actual keys)
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('provider, updated_at')
        .eq('user_id', auth.userId);

      if (error) throw error;

      return new Response(JSON.stringify({ keys: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'save') {
      if (!provider || !apiKey) {
        return new Response(JSON.stringify({ error: 'provider and apiKey required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate provider
      const validProviders = ['openai', 'google_gemini', 'anthropic', 'deepseek'];
      if (!validProviders.includes(provider)) {
        return new Response(JSON.stringify({ error: 'Invalid provider' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate key length
      if (apiKey.length < 10 || apiKey.length > 500) {
        return new Response(JSON.stringify({ error: 'Invalid API key length' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Encrypt the API key
      const encryptedKey = await encryptApiKey(apiKey.trim());

      // Upsert (check if exists first)
      const { data: existing } = await supabase
        .from('user_api_keys')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('provider', provider)
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from('user_api_keys')
          .update({ api_key: encryptedKey })
          .eq('user_id', auth.userId)
          .eq('provider', provider);
        error = result.error;
      } else {
        const result = await supabase
          .from('user_api_keys')
          .insert({ user_id: auth.userId, provider, api_key: encryptedKey });
        error = result.error;
      }

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (!provider) {
        return new Response(JSON.stringify({ error: 'provider required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', auth.userId)
        .eq('provider', provider);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: list, save, delete' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Manage API keys error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
