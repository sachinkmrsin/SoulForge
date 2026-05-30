import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useLogin, useRegister } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLogin();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginMutation.mutateAsync({ data: { username, password } });
      login(res.token, res.user);
      setLocation('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative">
      <div className="bg-texture" />
      <div className="w-full max-w-md bg-card/80 backdrop-blur-md p-8 rounded-none border border-border relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-serif text-foreground tracking-wider uppercase">Enter the Forge</h1>
          <p className="text-muted-foreground mt-2 font-serif italic">Your journey continues</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-muted-foreground uppercase tracking-widest text-xs">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-black/50 border-muted focus:border-primary transition-colors rounded-none font-serif text-lg"
                placeholder="Enter your name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground uppercase tracking-widest text-xs">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-black/50 border-muted focus:border-primary transition-colors rounded-none font-serif text-lg"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {loginMutation.error && (
            <div className="text-destructive text-sm text-center bg-destructive/10 p-2 border border-destructive/20">
              Invalid credentials. The fire fades...
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-serif tracking-wider uppercase h-12 rounded-none transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,100,0,0.4)]"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Igniting...' : 'Light the Bonfire'}
            {!loginMutation.isPending && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            A new soul?{' '}
            <Link href="/register" className="text-primary hover:text-primary/80 uppercase tracking-wider text-sm border-b border-primary/30 hover:border-primary transition-colors">
              Begin your journey
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const registerMutation = useRegister();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await registerMutation.mutateAsync({ data: { username, password } });
      login(res.token, res.user);
      setLocation('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative">
      <div className="bg-texture" />
      <div className="w-full max-w-md bg-card/80 backdrop-blur-md p-8 rounded-none border border-border relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-serif text-foreground tracking-wider uppercase">Forge Your Soul</h1>
          <p className="text-muted-foreground mt-2 font-serif italic">Your legacy begins here</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-muted-foreground uppercase tracking-widest text-xs">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 bg-black/50 border-muted focus:border-primary transition-colors rounded-none font-serif text-lg"
                placeholder="Choose your name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground uppercase tracking-widest text-xs">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-black/50 border-muted focus:border-primary transition-colors rounded-none font-serif text-lg"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {registerMutation.error && (
            <div className="text-destructive text-sm text-center bg-destructive/10 p-2 border border-destructive/20">
              Registration failed. The soul was rejected.
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-serif tracking-wider uppercase h-12 rounded-none transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,100,0,0.4)]"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? 'Forging...' : 'Claim Your Destiny'}
            {!registerMutation.isPending && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Already forged?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 uppercase tracking-wider text-sm border-b border-primary/30 hover:border-primary transition-colors">
              Return to the fire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
