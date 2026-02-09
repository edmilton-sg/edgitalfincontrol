import {
  LayoutDashboard, ArrowRightLeft, TrendingUp, TrendingDown,
  CreditCard, FileBarChart, Receipt, Users, Briefcase,
  ClipboardList, Settings, FileText, ChevronLeft, ChevronRight,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems: { key: TranslationKey; icon: React.ElementType; path: string }[] = [
  { key: "dashboard", icon: LayoutDashboard, path: "/" },
  { key: "cashFlow", icon: ArrowRightLeft, path: "/cash-flow" },
  { key: "revenues", icon: TrendingUp, path: "/revenues" },
  { key: "expenses", icon: TrendingDown, path: "/expenses" },
  { key: "cards", icon: CreditCard, path: "/cards" },
  { key: "dre", icon: FileBarChart, path: "/dre" },
  { key: "taxes", icon: Receipt, path: "/taxes" },
  { key: "employees", icon: Users, path: "/employees" },
  { key: "proLabore", icon: Briefcase, path: "/pro-labore" },
  { key: "documents", icon: FileText, path: "/documents" },
  { key: "reports", icon: ClipboardList, path: "/reports" },
  { key: "settings", icon: Settings, path: "/settings" },
];

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { t } = useLanguage();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight text-sidebar-primary">
            FinControl
          </span>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span>{t(item.key)}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
