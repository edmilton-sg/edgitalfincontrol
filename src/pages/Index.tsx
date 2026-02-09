import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { BalanceChart } from "@/components/dashboard/BalanceChart";
import { CashFlowCard } from "@/components/dashboard/CashFlowCard";
import { TaxCard } from "@/components/dashboard/TaxCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { useLanguage } from "@/i18n/LanguageContext";

const Index = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard")}</h1>

      <SummaryCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueExpenseChart />
        <BalanceChart />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CashFlowCard />
        <TaxCard />
      </div>

      <RecentTransactions />
    </div>
  );
};

export default Index;
