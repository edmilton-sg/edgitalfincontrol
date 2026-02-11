import {
  LayoutDashboard, ArrowRightLeft, TrendingUp, TrendingDown,
  CreditCard, FileBarChart, Receipt, Users, Briefcase,
  ClipboardList, Settings, FileText, ChevronLeft, ChevronRight,
  UserPlus, ShieldCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import logo from "@/assets/fc.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  isMobile?: boolean;
  onNavClick?: () => void;
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

export function AppSidebar({ collapsed, onToggle, mobileOpen, isMobile, onNavClick }: AppSidebarProps) {
  const { t } = useLanguage();
  const { role } = useAuth();

  // Role-specific nav items
  const roleItems: { key: TranslationKey; icon: React.ElementType; path: string }[] = [];
  if (role === "company_owner") {
    roleItems.push({ key: "accessRequests", icon: ShieldCheck, path: "/access-requests" });
  }

  const isVisible = isMobile ? mobileOpen : true;
  const sidebarWidth = collapsed ? "w-16" : "w-60";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        sidebarWidth,
        isMobile && !mobileOpen && "-translate-x-full",
        isMobile && mobileOpen && "translate-x-0 w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed ? (
          <img src={logo} alt="FinControl" className="h-8 object-contain" />
        ) : (
          <img src={logo} alt="FinControl" className="h-7 w-7 object-cover object-left" />
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
            onClick={onNavClick}
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span>{t(item.key)}</span>}
          </NavLink>
        ))}

        {roleItems.length > 0 && (
          <>
            <div className="my-2 border-t border-sidebar-border" />
            {roleItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                onClick={onNavClick}
              >
                <item.icon size={20} className="shrink-0" />
                {!collapsed && <span>{t(item.key)}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
