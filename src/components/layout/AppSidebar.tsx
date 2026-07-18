import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, ArrowRightLeft, TrendingUp, TrendingDown,
  CreditCard, FileBarChart, Receipt, Users, Briefcase,
  ClipboardList, Settings, FileText, ChevronLeft, ChevronRight,
  ShieldCheck, ShoppingCart, Package, FileSignature, Plug,
  Wallet, ChevronDown, Truck, ClipboardCheck, FileInput,
  Boxes, ArrowRightLeft as MoveIcon, Tag, Store,
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

type Item = { key: TranslationKey; icon: React.ElementType; path: string };
type Group = { key: TranslationKey; icon: React.ElementType; items: Item[] };

const singleTop: Item = { key: "dashboard", icon: LayoutDashboard, path: "/" };

const groups: Group[] = [
  {
    key: "purchases",
    icon: ShoppingCart,
    items: [
      { key: "suppliers", icon: Truck, path: "/suppliers" },
      { key: "quotations", icon: ClipboardCheck, path: "/quotations" },
      { key: "purchaseInvoices", icon: FileInput, path: "/purchase-invoices" },
    ],
  },
  {
    key: "stock",
    icon: Package,
    items: [
      { key: "products", icon: Boxes, path: "/products" },
      { key: "stockMovements", icon: MoveIcon, path: "/stock-movements" },
      { key: "pricing", icon: Tag, path: "/pricing" },
    ],
  },
  {
    key: "financial",
    icon: Wallet,
    items: [
      { key: "cashFlow", icon: ArrowRightLeft, path: "/cash-flow" },
      { key: "revenues", icon: TrendingUp, path: "/revenues" },
      { key: "expenses", icon: TrendingDown, path: "/expenses" },
      { key: "cards", icon: CreditCard, path: "/cards" },
      { key: "proLabore", icon: Briefcase, path: "/pro-labore" },
      { key: "employees", icon: Users, path: "/employees" },
      { key: "taxes", icon: Receipt, path: "/taxes" },
      { key: "dre", icon: FileBarChart, path: "/dre" },
    ],
  },
  {
    key: "invoicing",
    icon: FileSignature,
    items: [
      { key: "nfe", icon: FileText, path: "/invoices/nfe" },
      { key: "nfse", icon: FileText, path: "/invoices/nfse" },
    ],
  },
  {
    key: "integrations",
    icon: Plug,
    items: [
      { key: "mercadoLivre", icon: Store, path: "/integrations/mercadolivre" },
      { key: "shopee", icon: Store, path: "/integrations/shopee" },
      { key: "banking", icon: CreditCard, path: "/integrations/banking" },
    ],
  },
];

const bottomItems: Item[] = [
  { key: "reports", icon: ClipboardList, path: "/reports" },
  { key: "documents", icon: FileText, path: "/documents" },
  { key: "settings", icon: Settings, path: "/settings" },
];

const OPEN_STORAGE_KEY = "sidebar_open_groups_v1";

export function AppSidebar({ collapsed, onToggle, mobileOpen, isMobile, onNavClick }: AppSidebarProps) {
  const { t } = useLanguage();
  const { role } = useAuth();
  const { pathname } = useLocation();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(OPEN_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { financial: true };
  });

  // Auto-open group of active route
  useEffect(() => {
    const active = groups.find((g) => g.items.some((i) => i.path === pathname));
    if (active && !openGroups[active.key]) {
      setOpenGroups((prev) => ({ ...prev, [active.key]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    try { localStorage.setItem(OPEN_STORAGE_KEY, JSON.stringify(openGroups)); } catch {}
  }, [openGroups]);

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

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
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border",
        collapsed ? "justify-center px-2 gap-0" : "justify-between px-4"
      )}>
        {!collapsed && (
          <img src={logo} alt="FinControl" className="h-9 max-w-[140px] object-contain" />
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 hover:bg-sidebar-accent transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <NavLink
          to={singleTop.path}
          end
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          onClick={onNavClick}
        >
          <singleTop.icon size={20} className="shrink-0" />
          {!collapsed && <span>{t(singleTop.key)}</span>}
        </NavLink>

        {groups.map((group) => {
          const isOpen = collapsed ? true : !!openGroups[group.key];
          const hasActive = group.items.some((i) => i.path === pathname);
          return (
            <div key={group.key} className="pt-1">
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-sidebar-accent",
                    hasActive && "text-sidebar-primary"
                  )}
                >
                  <group.icon size={18} className="shrink-0" />
                  <span className="flex-1 text-left">{t(group.key)}</span>
                  <ChevronDown
                    size={14}
                    className={cn("transition-transform", !isOpen && "-rotate-90")}
                  />
                </button>
              )}
              {collapsed && (
                <div className="px-3 py-1 text-sidebar-foreground/60">
                  <group.icon size={20} />
                </div>
              )}
              {isOpen && (
                <div className={cn("mt-0.5 space-y-0.5", !collapsed && "ml-2 border-l border-sidebar-border/40 pl-2")}>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      onClick={onNavClick}
                    >
                      <item.icon size={18} className="shrink-0" />
                      {!collapsed && <span>{t(item.key)}</span>}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="my-2 border-t border-sidebar-border" />
        {bottomItems.map((item) => (
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
