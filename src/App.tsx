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
import ProLaborePage from "./pages/ProLaborePage";
import EmployeesPage from "./pages/EmployeesPage";
import DocumentsPage from "./pages/DocumentsPage";
import TaxesPage from "./pages/TaxesPage";
import DrePage from "./pages/DrePage";
import SettingsPage from "./pages/SettingsPage";
import SuppliersPage from "./pages/SuppliersPage";
import QuotationsPage from "./pages/QuotationsPage";
import PurchaseInvoicesPage from "./pages/PurchaseInvoicesPage";
import ProductsPage from "./pages/ProductsPage";
import StockMovementsPage from "./pages/StockMovementsPage";
import PricingPage from "./pages/PricingPage";
import IssuedInvoicesPage from "./pages/IssuedInvoicesPage";
import IntegrationPlaceholderPage from "./pages/IntegrationPlaceholderPage";
import BankingPage from "./pages/BankingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import CompanySetupPage from "./pages/CompanySetupPage";

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

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/cash-flow" element={<PlaceholderPage titleKey="cashFlow" />} />
        <Route path="/revenues" element={<RevenuesPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/dre" element={<DrePage />} />
        <Route path="/taxes" element={<TaxesPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/pro-labore" element={<ProLaborePage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/purchase-invoices" element={<PurchaseInvoicesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/stock-movements" element={<StockMovementsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/invoices/nfe" element={<IssuedInvoicesPage type="nfe" titleKey="nfe" />} />
        <Route path="/invoices/nfse" element={<IssuedInvoicesPage type="nfse" titleKey="nfse" />} />
        <Route path="/integrations/mercadolivre" element={<IntegrationPlaceholderPage titleKey="mercadoLivre" description="Conecte sua conta do Mercado Livre para sincronizar pedidos e produtos automaticamente." />} />
        <Route path="/integrations/shopee" element={<IntegrationPlaceholderPage titleKey="shopee" description="Conecte sua conta da Shopee para sincronizar pedidos e produtos automaticamente." />} />
        <Route path="/integrations/banking" element={<BankingPage />} />
        <Route path="/reports" element={<PlaceholderPage titleKey="reports" />} />
        <Route path="/settings" element={<SettingsPage />} />
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
