import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useLogout } from '@workspace/api-client-react';
import { 
  Flame, Shield, Swords, CheckSquare, Target, 
  Trophy, Skull, Backpack, Sparkles, Calendar, 
  User, LogOut, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { logout: clearAuth } = useAuth();
  const logoutMutation = useLogout();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      clearAuth();
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Bonfire', icon: Flame },
    { href: '/goals', label: 'Quests', icon: Target },
    { href: '/habits', label: 'Rituals', icon: CheckSquare },
    { href: '/boss', label: 'Boss Fights', icon: Skull },
    { href: '/challenges', label: 'Trials', icon: Swords },
    { href: '/inventory', label: 'Inventory', icon: Backpack },
    { href: '/skills', label: 'Skills', icon: Sparkles },
    { href: '/leaderboard', label: 'Hall of Champions', icon: Trophy },
    { href: '/calendar', label: 'Chronicles', icon: Calendar },
    { href: '/profile', label: 'Character', icon: User },
  ];

  const NavLinks = () => (
    <>
      <div className="mb-8 px-4">
        <h2 className="text-xl font-serif text-primary flex items-center gap-2">
          <Shield className="w-6 h-6" />
          SoulForge
        </h2>
      </div>
      <nav className="space-y-2 px-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-none transition-colors ${isActive ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
              <Icon className="w-5 h-5" />
              <span className="font-serif">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 mt-auto">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-3" />
          Abandon Run
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="bg-texture" />
      
      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <h2 className="text-xl font-serif text-primary flex items-center gap-2">
          <Shield className="w-6 h-6" />
          SoulForge
        </h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-card border-r-border p-0 flex flex-col">
            <NavLinks />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-card/80 border-r border-border backdrop-blur-md pt-8 shrink-0 h-screen sticky top-0 overflow-y-auto">
        <NavLinks />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
