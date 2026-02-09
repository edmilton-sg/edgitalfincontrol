import { useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
      setMobileOpen(false);
    }
  }, [isMobile]);

  const handleToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleNavClick = () => {
    if (isMobile) setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AppSidebar
        collapsed={isMobile ? false : collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        isMobile={isMobile}
        onNavClick={handleNavClick}
      />

      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          isMobile ? "ml-0" : collapsed ? "ml-16" : "ml-60"
        )}
      >
        <AppHeader onMenuClick={isMobile ? handleToggle : undefined} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
