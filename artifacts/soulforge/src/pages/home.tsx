import React from 'react';
import { Link } from 'wouter';
import { Shield, Target, Flame, Skull, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      <div className="bg-texture" />
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="w-6 h-6" />
            <span className="font-serif text-xl tracking-wider uppercase">SoulForge</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-serif uppercase tracking-widest hover:text-primary transition-colors">
              Log In
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-serif uppercase tracking-widest rounded-none">
                Start Journey
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-serif tracking-widest uppercase mb-6 leading-tight drop-shadow-lg">
            Where Willpower <br />
            <span className="text-primary">Becomes Power</span>
          </h1>
          <p className="text-xl text-muted-foreground font-serif italic mb-10 max-w-2xl mx-auto">
            A dark, gothic productivity forged for those who seek to conquer their goals. 
            Level up your character, slay epic bosses, and build habits that last.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-serif uppercase tracking-widest text-lg rounded-none shadow-[0_0_30px_rgba(255,100,0,0.3)] hover:shadow-[0_0_40px_rgba(255,100,0,0.5)] transition-all">
                Light the Bonfire
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-card/30 border-y border-border/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-black/50 border border-border flex items-center justify-center mb-6 shadow-lg shadow-black">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif uppercase tracking-widest">Epic Quests</h3>
              <p className="text-muted-foreground font-serif italic">Turn your mundane tasks into legendary quests. Earn XP, gain loot, and level up your character.</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-black/50 border border-border flex items-center justify-center mb-6 shadow-lg shadow-black">
                <Flame className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif uppercase tracking-widest">Daily Rituals</h3>
              <p className="text-muted-foreground font-serif italic">Forge unbreakable habits sorted by the time of day. Maintain streaks to earn massive bonuses.</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-black/50 border border-border flex items-center justify-center mb-6 shadow-lg shadow-black">
                <Skull className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-2xl font-serif uppercase tracking-widest text-destructive">Boss Battles</h3>
              <p className="text-muted-foreground font-serif italic">Use your daily productivity to deal damage to massive bosses. Defeat them for legendary loot.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section 1 */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-4xl font-serif uppercase tracking-widest text-primary">Your Character, Your Stats</h2>
              <p className="text-lg text-muted-foreground font-serif italic">
                Choose your class. Build your strength, endurance, dexterity, and faith by completing specific types of tasks. 
                Unlock skills and equip powerful artifacts to multiply your gains.
              </p>
              <ul className="space-y-4 pt-4 font-serif">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rotate-45" /> Class-based avatars
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rotate-45" /> Dynamic radar stat charts
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-primary rotate-45" /> Equipable skills tree
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full max-w-md mx-auto aspect-square bg-card border border-border relative">
              <div className="absolute inset-4 border border-border/50 border-dashed" />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <Shield className="w-24 h-24 text-primary/20" />
                <p className="font-serif uppercase tracking-widest text-muted-foreground mt-4 opacity-50">Profile Screen</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative text-center border-t border-border/50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
        <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-widest mb-6">The Realm Awaits</h2>
        <p className="text-xl text-muted-foreground font-serif italic mb-10 max-w-xl mx-auto">
          Do not let your potential fade into the dark. Rise, claim your power, and forge your destiny.
        </p>
        <Link href="/register">
          <Button className="h-16 px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-serif uppercase tracking-widest text-xl rounded-none shadow-[0_0_30px_rgba(255,100,0,0.3)] hover:shadow-[0_0_40px_rgba(255,100,0,0.5)] transition-all">
            Begin the Run <ChevronRight className="w-6 h-6 ml-2" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-border bg-card">
        <p className="font-serif uppercase tracking-widest text-sm text-muted-foreground">
          © {new Date().getFullYear()} SoulForge. No emojis harmed.
        </p>
      </footer>
    </div>
  );
}
