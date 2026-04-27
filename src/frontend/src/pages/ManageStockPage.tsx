import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useQueries";
import type { Product } from "@/types";
import { stockTuplesToFlex, totalFlexStock, totalStock } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Package, Pencil, Search } from "lucide-react";
import { useState } from "react";

interface ProductGridCardProps {
  product: Product;
  index: number;
  isAdmin: boolean;
  onSelect: (id: number) => void;
  onEdit: (id: number) => void;
}

function ProductGridCard({
  product,
  index,
  isAdmin,
  onSelect,
  onEdit,
}: ProductGridCardProps) {
  const [imgError, setImgError] = useState(false);
  const qty =
    product.stock && product.stock.length > 0
      ? totalFlexStock(stockTuplesToFlex(product.stock))
      : totalStock(product.sizes);

  return (
    <div
      className="flex flex-col bg-card border border-border rounded-sm hover:border-primary/40 transition-smooth text-left group overflow-hidden relative"
      data-ocid={`manage_stock.product.item.${index + 1}`}
    >
      {/* Admin edit button */}
      {isAdmin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(product.id);
          }}
          aria-label={`Edit ${product.name}`}
          className="absolute top-2 right-2 z-10 w-7 h-7 bg-card/90 border border-border rounded-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors shadow-sm"
          data-ocid={`manage_stock.edit_button.${index + 1}`}
        >
          <Pencil size={13} />
        </button>
      )}

      <button
        type="button"
        onClick={() => onSelect(product.id)}
        className="flex flex-col flex-1 text-left"
      >
        <div className="w-full aspect-square bg-muted overflow-hidden shrink-0 border-b border-border">
          {!imgError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package size={28} />
            </div>
          )}
        </div>

        <div className="p-3 flex-1 min-w-0 w-full">
          <div className="font-semibold text-foreground text-sm truncate leading-snug">
            {product.name}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">
            <span className="text-foreground font-semibold">{qty}</span> units
          </div>
        </div>
      </button>
    </div>
  );
}

export default function ManageStockPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: products, isLoading, error } = useProducts();
  const [search, setSearch] = useState("");

  const filtered = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (id: number) => {
    navigate({
      to: "/stock-entry/$productId",
      params: { productId: String(id) },
    });
  };

  const handleEdit = (id: number) => {
    navigate({
      to: "/edit-product/$productId",
      params: { productId: String(id) },
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Stock Management
          </p>
          <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">
            Select Product
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a product to record stock changes
          </p>
        </div>

        <div className="relative mb-6">
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
            data-ocid="manage_stock.search_input"
          />
        </div>

        {isLoading && (
          <div
            className="flex items-center justify-center py-12 text-muted-foreground"
            data-ocid="manage_stock.loading_state"
          >
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-sm">Loading products…</span>
          </div>
        )}

        {error && (
          <div
            className="text-center py-12 text-destructive text-sm"
            data-ocid="manage_stock.error_state"
          >
            Failed to load products. Please try again.
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div
            className="text-center py-12"
            data-ocid="manage_stock.empty_state"
          >
            <Package
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

        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((product, i) => (
              <ProductGridCard
                key={product.id}
                product={product}
                index={i}
                isAdmin={isAdmin}
                onSelect={handleSelect}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/add-product" })}
              className="gap-2 text-primary border-primary/40 hover:bg-primary/10"
              data-ocid="manage_stock.add_product_button"
            >
              <Package size={14} />
              Add New Product
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
