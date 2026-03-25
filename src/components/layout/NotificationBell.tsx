import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface NewEpisode {
  id: string;
  episode_title: string;
  guest_name: string;
  created_at: string;
  is_new: boolean;
}

const COMING_SOON_EPISODES = [
  { episode_title: 'Building Product Teams That Scale', guest_name: 'Jessica Fain', expected: 'March 22, 2026' },
  { episode_title: 'Career Growth for Senior PMs', guest_name: 'Jacob Warwick', expected: 'March 15, 2026' },
];

export function NotificationBell() {
  const [newEpisodes, setNewEpisodes] = useState<NewEpisode[]>([]);
  const [notifiedTitles, setNotifiedTitles] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNewEpisodes();
    if (user) fetchNotifiedTitles();
  }, [user]);

  const fetchNewEpisodes = async () => {
    const { data } = await supabase
      .from('episode_intelligence_cache')
      .select('id, episode_title, guest_name, created_at, is_new')
      .eq('is_new', true)
      .order('created_at', { ascending: false })
      .limit(3);
    if (data) setNewEpisodes(data);
  };

  const fetchNotifiedTitles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications_queue')
      .select('episode_title')
      .eq('user_id', user.id);
    if (data) setNotifiedTitles(new Set(data.map(d => d.episode_title)));
  };

  const handleNotifyMe = async (episodeTitle: string, guestName: string) => {
    if (!user) {
      toast.error('Please sign in to get notified');
      return;
    }
    const { error } = await supabase.from('notifications_queue').insert({
      user_id: user.id,
      episode_title: episodeTitle,
      guest_name: guestName,
    });
    if (error) {
      if (error.code === '23505') {
        toast.info("You're already on the list!");
      } else {
        toast.error('Failed to subscribe');
      }
      return;
    }
    setNotifiedTitles(prev => new Set(prev).add(episodeTitle));
    toast.success("We'll notify you when it's ready!");
  };

  const handlePracticeNow = (guestName: string) => {
    setOpen(false);
    navigate(`/practice?company=${encodeURIComponent(guestName)}`);
  };

  const hasNew = newEpisodes.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {hasNew && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[360px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-lg">🥋</span>
            Latest from the Dojo
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* New Episodes */}
          {newEpisodes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                New Episodes
              </h3>
              {newEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {ep.guest_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {ep.episode_title}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    className="shrink-0 text-xs"
                    onClick={() => handlePracticeNow(ep.guest_name)}
                  >
                    Practice Now
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Coming Soon */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Coming Soon
            </h3>
            {COMING_SOON_EPISODES.map((ep) => (
              <div
                key={ep.guest_name}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground truncate">
                      {ep.guest_name}
                    </p>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      Soon
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Expected {ep.expected}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={notifiedTitles.has(ep.episode_title) ? 'secondary' : 'outline'}
                  className="shrink-0 text-xs"
                  disabled={notifiedTitles.has(ep.episode_title)}
                  onClick={() => handleNotifyMe(ep.episode_title, ep.guest_name)}
                >
                  {notifiedTitles.has(ep.episode_title) ? '✓ Subscribed' : 'Notify Me'}
                </Button>
              </div>
            ))}
          </div>

          {newEpisodes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No new episodes this week. Check back soon!
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
