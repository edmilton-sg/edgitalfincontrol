import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CompanyProvider, useCompany } from "@/contexts/CompanyContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import RevenuesPage from "./pages/RevenuesPage";
import ExpensesPage from "./pages/ExpensesPage";
import CardsPage from "./pages/CardsPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import CompanySetupPage from "./pages/CompanySetupPage";
import RequestAccessPage from "./pages/RequestAccessPage";
import AccessRequestsPage from "./pages/AccessRequestsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading: authLoading, role } = useAuth();
  const { companies, loading: companyLoading } = useCompany();

  if (authLoading || companyLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Company owners with no company → setup
  if (role === "company_owner" && companies.length === 0) {
    return <Navigate to="/company-setup" replace />;
  }

  // Accountants with no companies → request access
  if (role === "accountant" && companies.length === 0) {
    return <Navigate to="/request-access" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/cash-flow" element={<PlaceholderPage titleKey="cashFlow" />} />
        <Route path="/revenues" element={<RevenuesPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/dre" element={<PlaceholderPage titleKey="dre" />} />
        <Route path="/taxes" element={<PlaceholderPage titleKey="taxes" />} />
        <Route path="/employees" element={<PlaceholderPage titleKey="employees" />} />
        <Route path="/pro-labore" element={<PlaceholderPage titleKey="proLabore" />} />
        <Route path="/documents" element={<PlaceholderPage titleKey="documents" />} />
        <Route path="/reports" element={<PlaceholderPage titleKey="reports" />} />
        <Route path="/settings" element={<PlaceholderPage titleKey="settings" />} />
        <Route path="/access-requests" element={<AccessRequestsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CompanyProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/company-setup" element={<CompanySetupPage />} />
                <Route path="/request-access" element={<RequestAccessPage />} />
                <Route path="/*" element={<ProtectedRoutes />} />
              </Routes>
            </CompanyProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
