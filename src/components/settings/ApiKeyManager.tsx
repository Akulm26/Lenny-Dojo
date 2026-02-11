import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Eye, EyeOff, Check, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const PROVIDERS = [
  {
    id: 'openai' as const,
    name: 'OpenAI',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    description: 'Used for GPT models',
  },
  {
    id: 'google_gemini' as const,
    name: 'Google Gemini',
    placeholder: 'AIza...',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Used for Gemini models',
  },
  {
    id: 'anthropic' as const,
    name: 'Anthropic (Claude)',
    placeholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Used for Claude models',
  },
];

type Provider = 'openai' | 'google_gemini' | 'anthropic';

interface StoredKey {
  provider: Provider;
  hasKey: boolean;
  updatedAt: string | null;
}

export function ApiKeyManager() {
  const { user } = useAuth();
  const [storedKeys, setStoredKeys] = useState<StoredKey[]>([]);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadKeys();
  }, [user]);

  const loadKeys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('provider, updated_at')
      .eq('user_id', user!.id);

    if (error) {
      console.error('Failed to load API keys:', error);
      setLoading(false);
      return;
    }

    const keys: StoredKey[] = PROVIDERS.map(p => {
      const found = data?.find((d: any) => d.provider === p.id);
      return {
        provider: p.id,
        hasKey: !!found,
        updatedAt: found?.updated_at || null,
      };
    });
    setStoredKeys(keys);
    setLoading(false);
  };

  const handleSave = async (provider: Provider) => {
    if (!keyInput.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setSaving(true);
    const existing = storedKeys.find(k => k.provider === provider);

    let error;
    if (existing?.hasKey) {
      const result = await supabase
        .from('user_api_keys')
        .update({ api_key: keyInput.trim() })
        .eq('user_id', user!.id)
        .eq('provider', provider);
      error = result.error;
    } else {
      const result = await supabase
        .from('user_api_keys')
        .insert({ user_id: user!.id, provider, api_key: keyInput.trim() });
      error = result.error;
    }

    if (error) {
      toast.error('Failed to save API key: ' + error.message);
    } else {
      toast.success(`${PROVIDERS.find(p => p.id === provider)?.name} key saved`);
      setEditingProvider(null);
      setKeyInput('');
      setShowKey(false);
      await loadKeys();
    }
    setSaving(false);
  };

  const handleDelete = async (provider: Provider) => {
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', user!.id)
      .eq('provider', provider);

    if (error) {
      toast.error('Failed to remove key: ' + error.message);
    } else {
      toast.success('API key removed. Default key will be used.');
      await loadKeys();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading API keys...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Provide your own API keys so AI requests are billed to your account.
        Keys are stored securely and only accessible by you.
        If no key is set, the default shared key is used.
      </p>

      {PROVIDERS.map(provider => {
        const stored = storedKeys.find(k => k.provider === provider.id);
        const isEditing = editingProvider === provider.id;

        return (
          <div key={provider.id} className="p-4 rounded-lg border border-border bg-background space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{provider.name}</h3>
                <p className="text-xs text-muted-foreground">{provider.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {stored?.hasKey && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <Check className="h-3 w-3" /> Configured
                  </span>
                )}
                <a
                  href={provider.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  Get key <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      placeholder={provider.placeholder}
                      value={keyInput}
                      onChange={e => setKeyInput(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSave(provider.id)} disabled={saving}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingProvider(null);
                      setKeyInput('');
                      setShowKey(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingProvider(provider.id);
                    setKeyInput('');
                    setShowKey(false);
                  }}
                >
                  {stored?.hasKey ? 'Update Key' : 'Add Key'}
                </Button>
                {stored?.hasKey && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(provider.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
