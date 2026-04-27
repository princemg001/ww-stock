import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import AddProductPage from "@/pages/AddProductPage";
import AvailableStockPage from "@/pages/AvailableStockPage";
import CreateUserPage from "@/pages/CreateUserPage";
import EditProductPage from "@/pages/EditProductPage";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import LogsPage from "@/pages/LogsPage";
import ManageStockPage from "@/pages/ManageStockPage";
import StockEntryPage from "@/pages/StockEntryPage";
import StockViewPage from "@/pages/StockViewPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 4000,
    },
  },
});

// Root route wrapper that provides auth
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}

// Auth guards as wrapper components
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" />;
  if (!isAdmin) return <Navigate to="/home" />;
  return <>{children}</>;
}

function RedirectIfAuthed() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/home" />;
  return <LoginPage />;
}

// Routes
const rootRoute = createRootRoute({ component: RootLayout });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: RedirectIfAuthed,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: () => (
    <RequireAuth>
      <HomePage />
    </RequireAuth>
  ),
});

const manageStockRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/manage-stock",
  component: () => (
    <RequireAuth>
      <ManageStockPage />
    </RequireAuth>
  ),
});

const stockEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stock-entry/$productId",
  component: () => (
    <RequireAuth>
      <StockEntryPage />
    </RequireAuth>
  ),
});

const availableStockRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/available-stock",
  component: () => (
    <RequireAuth>
      <AvailableStockPage />
    </RequireAuth>
  ),
});

const stockViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stock-view/$productId",
  component: () => (
    <RequireAuth>
      <StockViewPage />
    </RequireAuth>
  ),
});

const logsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/logs",
  component: () => (
    <RequireAuth>
      <LogsPage />
    </RequireAuth>
  ),
});

const addProductRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/add-product",
  component: () => (
    <RequireAdmin>
      <AddProductPage />
    </RequireAdmin>
  ),
});

const createUserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create-user",
  component: () => (
    <RequireAdmin>
      <CreateUserPage />
    </RequireAdmin>
  ),
});

const editProductRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/edit-product/$productId",
  component: () => (
    <RequireAdmin>
      <EditProductPage />
    </RequireAdmin>
  ),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  homeRoute,
  manageStockRoute,
  stockEntryRoute,
  availableStockRoute,
  stockViewRoute,
  logsRoute,
  addProductRoute,
  createUserRoute,
  editProductRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
