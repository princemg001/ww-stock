import { Layout } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronRight,
  ClipboardList,
  Layers,
  Package,
  Plus,
  Users,
} from "lucide-react";

interface QuickActionProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  ocid: string;
  accent?: boolean;
}

function QuickAction({
  to,
  icon,
  label,
  description,
  ocid,
  accent,
}: QuickActionProps) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-4 p-4 rounded-sm border transition-smooth hover:shadow-md group ${
        accent
          ? "bg-primary/10 border-primary/30 hover:bg-primary/15"
          : "bg-card border-border hover:border-primary/40 hover:bg-muted"
      }`}
      data-ocid={ocid}
    >
      <div
        className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 ${
          accent
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`font-semibold text-sm ${accent ? "text-primary" : "text-foreground"}`}
        >
          {label}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {description}
        </div>
      </div>
      <ChevronRight
        size={16}
        className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${accent ? "text-primary" : "text-muted-foreground"}`}
      />
    </Link>
  );
}

export default function HomePage() {
  const { session, isAdmin } = useAuth();
  const _isLoading = false; // kept for future loading skeleton use

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1 className="font-display font-bold text-3xl text-foreground tracking-tight">
            {session?.userName ?? (
              <Skeleton className="h-9 w-40 inline-block" />
            )}
          </h1>
          {isAdmin && (
            <span className="inline-block mt-2 text-xs font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm">
              ADMINISTRATOR
            </span>
          )}
        </div>

        {/* Access level card */}
        <div className="mb-8">
          <div
            className="bg-card border border-border rounded-sm p-5 flex items-center gap-4"
            data-ocid="home.role_card"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center text-primary shrink-0">
              <BarChart3 size={18} />
            </div>
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Access Level
              </p>
              <p className="font-display font-bold text-xl text-foreground">
                {isAdmin ? "Admin" : "Staff"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Full system access" : "Standard access"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions — 2-column grid */}
        <div>
          <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
            Quick Actions
          </h2>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            data-ocid="home.actions_section"
          >
            <QuickAction
              to="/manage-stock"
              icon={<Package size={18} />}
              label="Manage Stock"
              description="Record incoming and outgoing stock"
              ocid="home.manage_stock_button"
              accent
            />
            <QuickAction
              to="/available-stock"
              icon={<Layers size={18} />}
              label="Available Stock"
              description="View current stock levels per product"
              ocid="home.available_stock_button"
            />
            <QuickAction
              to="/logs"
              icon={<ClipboardList size={18} />}
              label="Activity Logs"
              description="View all stock activity history"
              ocid="home.logs_button"
            />
            {isAdmin && (
              <>
                <QuickAction
                  to="/add-product"
                  icon={<Plus size={18} />}
                  label="Add Product"
                  description="Add a new product to inventory"
                  ocid="home.add_product_button"
                />
                <QuickAction
                  to="/create-user"
                  icon={<Users size={18} />}
                  label="Manage Users"
                  description="Create accounts and manage user access"
                  ocid="home.manage_users_button"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
