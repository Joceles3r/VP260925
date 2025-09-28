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
import ProjectsList from "@/pages/ProjectsList";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import Portfolio from "@/pages/Portfolio";
import Live from "@/pages/Live";
import Social from "@/pages/Social";
import Books from "@/pages/Books";
import PetitesAnnonces from "@/pages/PetitesAnnonces";
import Admin from "@/pages/Admin";
import KYCOnboarding from "@/pages/KYCOnboarding";
import NotFound from "@/pages/NotFound";
import CuriosityDock from "@/components/CuriosityDock";
import { useCuriosityDock } from "@/hooks/useCuriosityDock";
import { useEmojiSystem } from "@/hooks/useEmojiSystem";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { stats, actions } = useCuriosityDock();
  const emoji = useEmojiSystem();

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
            <Route path="/projects" component={ProjectsList} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/kyc" component={KYCOnboarding} />
            <Route path="/projects" component={Projects} />
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/live" component={Live} />
            <Route path="/social" component={Social} />
            <Route path="/books" component={Books} />
            <Route path="/petites-annonces" component={PetitesAnnonces} />
            {user?.isAdmin && <Route path="/admin" component={Admin} />}
            <Route component={NotFound} />
          </>
        )}
      </Switch>
      
      {/* Curiosity Dock - only show for authenticated users */}
      {isAuthenticated && (
        <CuriosityDock
          stats={stats}
          onGoLive={actions.goLive}
          onTop10={actions.showTop10}
          onNew={actions.showNew}
          onRandom={actions.showRandom}
          onQuest={actions.showQuest}
        />
      )}
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