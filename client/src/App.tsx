import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";

// Pages
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Portfolio from "@/pages/portfolio";
import Live from "@/pages/live";
import Admin from "@/pages/admin";
import KYCOnboarding from "@/pages/KYCOnboarding";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Show navigation only for authenticated users */}
      {isAuthenticated && <Navigation />}
      
      <Switch>
        {isLoading ? (
          <Route>
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </Route>
        ) : !isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/landing" component={Landing} />
            <Route component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/kyc" component={KYCOnboarding} />
            <Route path="/projects" component={Projects} />
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/live" component={Live} />
            <Route path="/admin" component={Admin} />
            <Route component={NotFound} />
          </>
        )}
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
