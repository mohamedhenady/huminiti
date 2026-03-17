import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";
import { Pill } from "lucide-react";

// Pages
import Login from "@/pages/login";
import Batches from "@/pages/batches";
import BatchDetails from "@/pages/batch-details";
import PersonDetails from "@/pages/person-details";
import Drugs from "@/pages/drugs";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <Pill className="w-12 h-12 animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Redirect to="/batches" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <Pill className="w-12 h-12 animate-pulse" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        <Redirect to={isAuthenticated ? "/batches" : "/login"} />
      </Route>
      
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/batches" /> : <Login />}
      </Route>
      
      <Route path="/batches" component={() => <ProtectedRoute component={Batches} />} />
      <Route path="/batches/:id" component={() => <ProtectedRoute component={BatchDetails} />} />
      <Route path="/persons/:id" component={() => <ProtectedRoute component={PersonDetails} />} />
      <Route path="/drugs" component={() => <ProtectedRoute component={Drugs} allowedRoles={['pharmacy']} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster position="bottom-right" dir="rtl" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
