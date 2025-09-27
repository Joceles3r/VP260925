import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import LoadingScreen from "@/components/LoadingScreen";

// Pages
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import Portfolio from "@/pages/Portfolio";
import Live from "@/pages/Live";
import Social from "@/pages/Social";
import Admin from "@/pages/Admin";
import KYCOnboarding from "@/pages/KYCOnboarding";
import NotFound from "@/pages/NotFound";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Show navigation only for authenticated users */}
      {isAuthenticated && <Navigation />}
      
      <Switch>
        {!isAuthenticated ? (
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
            <Route path="/social" component={Social} />
            {user?.isAdmin && <Route path="/admin" component={Admin} />}
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
      <ThemeProvider defaultTheme="light" storageKey="visual-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;