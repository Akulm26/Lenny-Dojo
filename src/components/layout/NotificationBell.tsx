import { useState, useEffect, useRef, useCallback } from 'react';
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

interface ComingSoonEpisode {
  episode_title: string;
  guest_name: string;
  expected: string;
}

interface FulfilledNotification {
  episode_title: string;
  guest_name: string;
  episode_id: string;
}

// Static list of episodes not yet indexed
const COMING_SOON_EPISODES: ComingSoonEpisode[] = [
  { episode_title: 'Building Product Teams That Scale', guest_name: 'Jessica Fain', expected: 'March 22, 2026' },
  { episode_title: 'Career Growth for Senior PMs', guest_name: 'Jacob Warwick', expected: 'March 15, 2026' },
];

const TOAST_SHOWN_KEY = 'dojo_notification_toasts_shown';

export function NotificationBell() {
  const [newEpisodes, setNewEpisodes] = useState<NewEpisode[]>([]);
  const [notifiedTitles, setNotifiedTitles] = useState<Set<string>>(new Set());
  const [fulfilledNotifications, setFulfilledNotifications] = useState<FulfilledNotification[]>([]);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toastShownRef = useRef(false);

  const fetchNewEpisodes = useCallback(async () => {
    const { data } = await supabase
      .from('episode_intelligence_cache')
      .select('id, episode_title, guest_name, created_at, is_new')
      .eq('is_new', true)
      .order('created_at', { ascending: false })
      .limit(3);
    if (data) setNewEpisodes(data);
  }, []);

  const fetchNotifiedTitles = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications_queue')
      .select('episode_title')
      .eq('user_id', user.id);
    if (data) setNotifiedTitles(new Set(data.map(d => d.episode_title)));
  }, [user]);

  // Check if any subscribed coming-soon episodes have been indexed
  const checkFulfilledNotifications = useCallback(async () => {
    if (!user) return;

    // Get user's subscriptions
    const { data: subscriptions } = await supabase
      .from('notifications_queue')
      .select('episode_title, guest_name')
      .eq('user_id', user.id)
      .eq('notified', false);

    if (!subscriptions || subscriptions.length === 0) return;

    // Check which subscribed episodes now exist in the cache
    const guestNames = subscriptions.map(s => s.guest_name);
    const { data: indexedEpisodes } = await supabase
      .from('episode_intelligence_cache')
      .select('id, episode_title, guest_name')
      .in('guest_name', guestNames);

    if (!indexedEpisodes || indexedEpisodes.length === 0) return;

    // Find matches
    const fulfilled: FulfilledNotification[] = [];
    for (const sub of subscriptions) {
      const match = indexedEpisodes.find(ep => 
        ep.guest_name.toLowerCase() === sub.guest_name.toLowerCase()
      );
      if (match) {
        fulfilled.push({
          episode_title: sub.episode_title,
          guest_name: sub.guest_name,
          episode_id: match.id,
        });
      }
    }

    if (fulfilled.length > 0) {
      setFulfilledNotifications(fulfilled);

      // Show toast only once per session
      const shownKey = `${TOAST_SHOWN_KEY}_${user.id}`;
      const alreadyShown = sessionStorage.getItem(shownKey);
      
      if (!alreadyShown && !toastShownRef.current) {
        toastShownRef.current = true;
        sessionStorage.setItem(shownKey, 'true');
        
        for (const f of fulfilled) {
          toast.success(`🥋 New episode available!`, {
            description: `${f.guest_name}'s episode is now ready to practice.`,
            duration: 8000,
            action: {
              label: 'Practice Now',
              onClick: () => navigate(`/practice?company=${encodeURIComponent(f.guest_name)}`),
            },
          });
        }

        // Mark as notified in the database
        for (const f of fulfilled) {
          await supabase
            .from('notifications_queue')
            .update({ notified: true })
            .eq('user_id', user.id)
            .eq('episode_title', f.episode_title);
        }
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchNewEpisodes();
    if (user) {
      fetchNotifiedTitles();
      checkFulfilledNotifications();
    }
  }, [user, fetchNewEpisodes, fetchNotifiedTitles, checkFulfilledNotifications]);

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

  // Determine which coming-soon episodes are now fulfilled
  const fulfilledGuests = new Set(fulfilledNotifications.map(f => f.guest_name.toLowerCase()));
  const stillComingSoon = COMING_SOON_EPISODES.filter(
    ep => !fulfilledGuests.has(ep.guest_name.toLowerCase())
  );
  const nowAvailable = COMING_SOON_EPISODES.filter(
    ep => fulfilledGuests.has(ep.guest_name.toLowerCase())
  );

  // Combine new episodes with fulfilled notifications for the "New" section
  const allNewEpisodes = [
    ...newEpisodes,
    ...nowAvailable.map(ep => ({
      id: `fulfilled-${ep.guest_name}`,
      episode_title: ep.episode_title,
      guest_name: ep.guest_name,
      created_at: new Date().toISOString(),
      is_new: true as const,
    })),
  ];

  // Deduplicate by guest name
  const seen = new Set<string>();
  const uniqueNewEpisodes = allNewEpisodes.filter(ep => {
    const key = ep.guest_name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const hasNotifications = uniqueNewEpisodes.length > 0 || fulfilledNotifications.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
            </span>
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
          {/* New / Available Episodes */}
          {uniqueNewEpisodes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                New Episodes
                <Badge variant="default" className="text-[10px]">
                  {uniqueNewEpisodes.length}
                </Badge>
              </h3>
              {uniqueNewEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
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
          {stillComingSoon.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Coming Soon
              </h3>
              {stillComingSoon.map((ep) => (
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
          )}

          {uniqueNewEpisodes.length === 0 && stillComingSoon.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No new episodes this week. Check back soon!
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
