import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProducts,
  useTotalProducts,
  useTotalStock,
} from "@/hooks/useQueries";
import type { Product } from "@/types";
import {
  getProductActiveSizes,
  getProductGrandTotal,
  getProductSizeStock,
} from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { Layers, Loader2, Package, Search, TrendingUp } from "lucide-react";
import { useState } from "react";

// ---- Summary stat card ----
interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value?: number;
  isLoading: boolean;
  ocid: string;
}

function StatPill({ icon, label, value, isLoading, ocid }: StatPillProps) {
  return (
    <div
      className="flex items-center gap-3 bg-card border border-border rounded-sm px-4 py-3"
      data-ocid={ocid}
    >
      <div className="w-9 h-9 bg-primary/10 rounded-sm flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className="h-7 w-16 mt-0.5" />
        ) : (
          <p className="font-display font-bold text-2xl text-foreground tabular-nums leading-tight">
            {value?.toLocaleString() ?? "—"}
          </p>
        )}
      </div>
    </div>
  );
}

// ---- Product row card ----
interface ProductRowCardProps {
  product: Product;
  index: number;
  onSelect: (id: number) => void;
}

function ProductRowCard({ product, index, onSelect }: ProductRowCardProps) {
  const [imgError, setImgError] = useState(false);

  const activeSizes = getProductActiveSizes(product, [
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "XXXL",
  ]);
  const grandTotal = getProductGrandTotal(product);

  return (
    <button
      type="button"
      onClick={() => onSelect(product.id)}
      className="w-full bg-card border border-border rounded-sm hover:border-primary/40 hover:bg-muted/50 transition-smooth text-left group overflow-hidden"
      data-ocid={`available_stock.product.item.${index + 1}`}
    >
      <div className="flex items-stretch">
        {/* LEFT — product photo */}
        <div className="w-[88px] sm:w-[100px] shrink-0 bg-muted border-r border-border overflow-hidden">
          {!imgError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 min-h-[88px]"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full min-h-[88px] flex items-center justify-center text-muted-foreground">
              <Package size={28} />
            </div>
          )}
        </div>

        {/* RIGHT — product info and size breakdown */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between gap-2">
          {/* Product name */}
          <p className="font-semibold text-foreground text-sm leading-snug truncate">
            {product.name}
          </p>

          {/* Size breakdown — wrap on small screens */}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {activeSizes.map((size) => {
              const qty = getProductSizeStock(product, size);
              return (
                <span
                  key={size}
                  className={`text-xs font-mono ${
                    qty === 0 ? "text-muted-foreground/50" : "text-foreground"
                  }`}
                >
                  <span className="text-muted-foreground">{size}:</span>{" "}
                  <span className="font-semibold tabular-nums">{qty}</span>
                </span>
              );
            })}
          </div>

          {/* Grand total */}
          <div className="flex items-center justify-between pt-1 border-t border-border/60">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Grand Total
            </span>
            <span className="font-display font-bold text-base text-primary tabular-nums">
              {grandTotal}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                pcs
              </span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ---- Page ----

export default function AvailableStockPage() {
  const navigate = useNavigate();
  const { data: products, isLoading, error } = useProducts();
  const { data: totalProducts, isLoading: loadingTotalProducts } =
    useTotalProducts();
  const { data: totalStock, isLoading: loadingTotalStock } = useTotalStock();
  const [search, setSearch] = useState("");

  const filtered = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (id: number) => {
    navigate({
      to: "/stock-view/$productId",
      params: { productId: String(id) },
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Page header */}
        <div className="mb-6">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Inventory
          </p>
          <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">
            Available Stock
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View current stock levels for all products
          </p>
        </div>

        {/* Summary stats */}
        <div
          className="grid grid-cols-2 gap-3 mb-6"
          data-ocid="available_stock.stats_section"
        >
          <StatPill
            icon={<Package size={16} />}
            label="Total Products"
            value={totalProducts}
            isLoading={loadingTotalProducts}
            ocid="available_stock.total_products_card"
          />
          <StatPill
            icon={<TrendingUp size={16} />}
            label="Total Stock"
            value={totalStock}
            isLoading={loadingTotalStock}
            ocid="available_stock.total_stock_card"
          />
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
            data-ocid="available_stock.search_input"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div
            className="flex items-center justify-center py-12 text-muted-foreground"
            data-ocid="available_stock.loading_state"
          >
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-sm">Loading products…</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="text-center py-12 text-destructive text-sm"
            data-ocid="available_stock.error_state"
          >
            Failed to load products. Please try again.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filtered.length === 0 && (
          <div
            className="text-center py-12"
            data-ocid="available_stock.empty_state"
          >
            <Layers
              size={40}
              className="mx-auto mb-3 text-muted-foreground opacity-40"
            />
            <p className="text-muted-foreground text-sm">No products found</p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-primary text-sm mt-2 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Product list */}
        {!isLoading && !error && filtered.length > 0 && (
          <div
            className="flex flex-col gap-3"
            data-ocid="available_stock.product_list"
          >
            {filtered.map((product, i) => (
              <ProductRowCard
                key={product.id}
                product={product}
                index={i}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
