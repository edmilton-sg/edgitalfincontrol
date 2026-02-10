import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import RevenuesPage from "./pages/RevenuesPage";
import ExpensesPage from "./pages/ExpensesPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cash-flow" element={<PlaceholderPage titleKey="cashFlow" />} />
              <Route path="/revenues" element={<RevenuesPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/cards" element={<PlaceholderPage titleKey="cards" />} />
              <Route path="/dre" element={<PlaceholderPage titleKey="dre" />} />
              <Route path="/taxes" element={<PlaceholderPage titleKey="taxes" />} />
              <Route path="/employees" element={<PlaceholderPage titleKey="employees" />} />
              <Route path="/pro-labore" element={<PlaceholderPage titleKey="proLabore" />} />
              <Route path="/documents" element={<PlaceholderPage titleKey="documents" />} />
              <Route path="/reports" element={<PlaceholderPage titleKey="reports" />} />
              <Route path="/settings" element={<PlaceholderPage titleKey="settings" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
