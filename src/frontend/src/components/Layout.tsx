import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  Plus,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/home", icon: <BarChart3 size={16} /> },
  {
    label: "Manage Stock",
    to: "/manage-stock",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Grid</title>
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </svg>
    ),
  },
  {
    label: "Available Stock",
    to: "/available-stock",
    icon: <ShoppingBag size={16} />,
  },
  {
    label: "Add Product",
    to: "/add-product",
    icon: <Plus size={16} />,
    adminOnly: true,
  },
  {
    label: "Users",
    to: "/create-user",
    icon: <Users size={16} />,
    adminOnly: true,
  },
  {
    label: "Logs",
    to: "/logs",
    icon: <FileText size={16} />,
  },
];

// Paths where back button should NOT appear
const NO_BACK_PATHS = ["/", "/home"];

// Indian ethnic wear background images — gown, sharara, kurtis
const ETHNIC_BG_IMAGES = [
  "/assets/generated/bg-gown.dim_1600x1200.jpg",
  "/assets/generated/bg-sharara.dim_1600x1200.jpg",
  "/assets/generated/bg-kurtis.dim_1600x1200.jpg",
];

function getImageForPath(path: string): string {
  // Deterministic image selection based on path
  const idx =
    Math.abs(path.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) %
    ETHNIC_BG_IMAGES.length;
  return ETHNIC_BG_IMAGES[idx];
}

export function Layout({
  children,
  bgOverride,
}: {
  children: React.ReactNode;
  bgOverride?: string;
}) {
  const { session, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPath = routerState.location.pathname;
  const showBackButton = session && !NO_BACK_PATHS.includes(currentPath);
  const ethnicBgImage = bgOverride ? null : getImageForPath(currentPath);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const handleBack = () => {
    window.history.back();
  };

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Background: product photo (bgOverride) OR ethnic wear — never both */}
      {bgOverride ? (
        <img
          src={bgOverride}
          alt="product background"
          aria-hidden="true"
          className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
          style={{ opacity: 0.4 }}
        />
      ) : (
        ethnicBgImage && (
          <img
            src={ethnicBgImage}
            alt="ethnic wear background"
            aria-hidden="true"
            className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
            style={{ opacity: 0.22 }}
          />
        )
      )}

      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Back button — all pages except login and home */}
            {showBackButton && (
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Go back"
                data-ocid="nav.back_button"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            {session && (
              <button
                type="button"
                className="md:hidden p-1.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
                data-ocid="nav.menu_toggle"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}

            <Link
              to={session ? "/home" : "/"}
              className="flex items-center gap-2"
              data-ocid="nav.logo_link"
            >
              <img
                src="/assets/logo.webp"
                alt="WW Stock logo"
                className="h-8 w-8 rounded-sm object-contain bg-white"
              />
              <span className="font-display font-bold text-lg tracking-tight text-foreground">
                WW Stock
              </span>
            </Link>
          </div>

          {session && (
            <div className="flex items-center gap-3">
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1">
                {visibleItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors"
                    activeProps={{ className: "text-primary bg-primary/10" }}
                    data-ocid={`nav.${item.label.toLowerCase().replace(/\s+/g, "_")}_link`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border">
                <span className="text-sm text-muted-foreground font-mono">
                  {session.userName}
                </span>
                {isAdmin && (
                  <Badge
                    variant="outline"
                    className="text-xs border-primary text-primary py-0"
                  >
                    ADMIN
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive"
                data-ocid="nav.logout_button"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Nav Drawer */}
        {session && mobileOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center gap-2 py-2 mb-2 border-b border-border">
                <span className="text-sm text-muted-foreground font-mono">
                  {session.userName}
                </span>
                {isAdmin && (
                  <Badge
                    variant="outline"
                    className="text-xs border-primary text-primary py-0"
                  >
                    ADMIN
                  </Badge>
                )}
              </div>
              <nav className="flex flex-col gap-1">
                {visibleItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors"
                    activeProps={{ className: "text-primary bg-primary/10" }}
                    onClick={() => setMobileOpen(false)}
                    data-ocid={`mobile_nav.${item.label.toLowerCase().replace(/\s+/g, "_")}_link`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 relative z-10">{children}</main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto relative z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <span>© {new Date().getFullYear()} WW Stock</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>
              Crafted by{" "}
              <span className="text-foreground font-medium">Mitul Gopani</span>
              {" & "}
              <span className="text-foreground font-medium">
                Krenil Vaghasiya
              </span>
            </span>
          </div>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
