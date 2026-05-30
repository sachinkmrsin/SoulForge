import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

import { Home } from "@/pages/home";
import { Login, Register } from "@/pages/auth";
import { Dashboard } from "@/pages/dashboard";
import { Goals } from "@/pages/goals";
import { Habits } from "@/pages/habits";
import { Boss } from "@/pages/boss";
import { Challenges } from "@/pages/challenges";
import { Inventory } from "@/pages/inventory";
import { Skills } from "@/pages/skills";
import { Calendar } from "@/pages/calendar";
import { Profile } from "@/pages/profile";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { token, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary font-serif uppercase tracking-widest">Loading...</div>;
  }
  
  if (!token) {
    window.location.href = '/login';
    return null;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/goals"><ProtectedRoute component={Goals} /></Route>
      <Route path="/habits"><ProtectedRoute component={Habits} /></Route>
      <Route path="/boss"><ProtectedRoute component={Boss} /></Route>
      <Route path="/challenges"><ProtectedRoute component={Challenges} /></Route>
      <Route path="/inventory"><ProtectedRoute component={Inventory} /></Route>
      <Route path="/skills"><ProtectedRoute component={Skills} /></Route>
      <Route path="/calendar"><ProtectedRoute component={Calendar} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
