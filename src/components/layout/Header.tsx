import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, 
  Building2, 
  BookOpen, 
  BarChart3, 
  Settings,
  Menu,
  X,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { useState } from 'react';
import { SyncIndicator } from './SyncIndicator';
import { SpotlightSearch } from '@/components/SpotlightSearch';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
const navItems = [
  { href: '/practice', label: 'Practice', icon: Dumbbell },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/frameworks', label: 'Frameworks', icon: BookOpen },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2 font-bold text-xl hover:opacity-90 transition-opacity"
        >
          <span className="text-2xl">🥋</span>
          <span className="text-gradient">Lenny's Dojo</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
              location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'nav-link',
                  isActive && 'nav-link-active'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        {/* Right side */}
        <div className="flex items-center gap-3">
          <SpotlightSearch />
          
          <SyncIndicator />
          
          <Link to="/settings" className="hidden md:flex">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>

          {/* Auth buttons */}
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm text-muted-foreground truncate">
                      {user.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login" className="hidden md:flex">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Button>
                </Link>
              )}
            </>
          )}
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-up">
          <nav className="container py-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'nav-link py-3',
                    isActive && 'nav-link-active'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="nav-link py-3"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
            {!loading && (
              user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="nav-link py-3 text-left"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="nav-link py-3"
                >
                  <LogIn className="h-5 w-5" />
                  Sign in
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
