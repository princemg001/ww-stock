import { Layout } from "@/components/Layout";
import { useProduct } from "@/hooks/useQueries";
import {
  getProductActiveSizes,
  getProductGrandTotal,
  getProductSizeStock,
} from "@/types";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Package, X } from "lucide-react";
import { useState } from "react";

function StockBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color =
    pct > 50 ? "bg-primary" : pct > 20 ? "bg-primary/60" : "bg-destructive/60";
  return (
    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SizeStockRow({
  size,
  stock,
  maxStock,
  index,
}: { size: string; stock: number; maxStock: number; index: number }) {
  return (
    <div
      className="flex items-center gap-4 py-3 border-b border-border last:border-0"
      data-ocid={`stock_view.size_row.item.${index + 1}`}
    >
      <span className="w-14 font-mono font-bold text-sm text-foreground">
        {size}
      </span>
      <StockBar value={stock} max={maxStock} />
      <span className="w-16 text-right font-mono font-semibold tabular-nums text-foreground">
        {stock}
        <span className="text-xs text-muted-foreground ml-1">pcs</span>
      </span>
    </div>
  );
}

export default function StockViewPage() {
  const { productId } = useParams({ from: "/stock-view/$productId" });
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const productIdNum = Number(productId);
  const { data: product, isLoading } = useProduct(productIdNum);

  // Active sizes: prefer admin-defined sizes
  const activeSizes: string[] = product
    ? getProductActiveSizes(product, ["S", "M", "L", "XL", "XXL", "XXXL"])
    : ["S", "M", "L", "XL", "XXL", "XXXL"];

  const getStock = (size: string): number =>
    product ? getProductSizeStock(product, size) : 0;

  const maxStock = activeSizes.reduce(
    (max, size) => Math.max(max, getStock(size)),
    1,
  );

  const grandTotal = product ? getProductGrandTotal(product) : 0;

  // Background image URL
  const backgroundUrl = !imgError && product?.imageUrl ? product.imageUrl : "";

  return (
    <Layout bgOverride={backgroundUrl || undefined}>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-lg">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/available-stock" })}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-sm hover:bg-muted"
            aria-label="Go back"
            data-ocid="stock_view.back_button"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Stock View
            </p>
            {!isLoading && (
              <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
                {product?.name ?? "Product not found"}
              </h1>
            )}
          </div>
        </div>

        {isLoading && (
          <div
            className="flex items-center justify-center py-12 text-muted-foreground"
            data-ocid="stock_view.loading_state"
          >
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-sm">Loading…</span>
          </div>
        )}

        {!isLoading && product && (
          <div className="space-y-4" data-ocid="stock_view.product_card">
            {/* Product image */}
            <div className="bg-card border border-border rounded-sm overflow-hidden h-48">
              {!imgError ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Package size={40} className="opacity-30" />
                  <span className="text-sm">{product.name}</span>
                </div>
              )}
            </div>

            {/* Grand total bar */}
            <div className="bg-card border border-border rounded-sm px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Grand Total
              </span>
              <span className="font-display font-bold text-2xl text-foreground tabular-nums">
                {grandTotal}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  units
                </span>
              </span>
            </div>

            {/* Size breakdown */}
            <div className="bg-card border border-border rounded-sm">
              <div className="px-4 py-2 bg-muted border-b border-border">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Stock by Size
                </span>
              </div>
              <div className="px-4">
                {activeSizes.map((size, i) => (
                  <SizeStockRow
                    key={size}
                    size={size}
                    stock={getStock(size)}
                    maxStock={maxStock}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {!isLoading && !product && (
          <div className="text-center py-16" data-ocid="stock_view.empty_state">
            <Package
              size={40}
              className="mx-auto mb-3 text-muted-foreground opacity-40"
            />
            <p className="text-muted-foreground text-sm">Product not found</p>
            <button
              type="button"
              onClick={() => navigate({ to: "/available-stock" })}
              className="text-primary text-sm mt-2 hover:underline flex items-center gap-1 mx-auto"
            >
              <X size={14} />
              Go back to stock
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
