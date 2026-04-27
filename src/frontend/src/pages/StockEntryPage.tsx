import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useProduct, useUpdateStock } from "@/hooks/useQueries";
import { ALL_SIZES, getProductActiveSizes, getProductSizeStock } from "@/types";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Package,
  Save,
} from "lucide-react";
import { useState } from "react";

interface SizeRowProps {
  size: string;
  currentStock: number;
  inVal: string;
  outVal: string;
  onInChange: (val: string) => void;
  onOutChange: (val: string) => void;
  index: number;
}

function SizeRow({
  size,
  currentStock,
  inVal,
  outVal,
  onInChange,
  onOutChange,
  index,
}: SizeRowProps) {
  return (
    <div
      className="grid grid-cols-[56px_1fr_1fr_72px] sm:grid-cols-[60px_1fr_1fr_80px] items-center gap-2 sm:gap-3 py-3 border-b border-border last:border-0"
      data-ocid={`stock_entry.size_row.item.${index + 1}`}
    >
      <div className="font-mono font-bold text-foreground text-sm">{size}</div>

      {/* IN input — wider on mobile (min-w-[80px]) for better touch usability */}
      <Input
        type="number"
        min="0"
        value={inVal}
        onChange={(e) => onInChange(e.target.value)}
        placeholder="IN"
        className="bg-background border-border text-center font-mono h-11 text-base min-w-[80px] sm:min-w-[60px] sm:h-9 sm:text-sm"
        data-ocid={`stock_entry.in_${size.toLowerCase()}_input`}
      />

      {/* OUT input — wider on mobile */}
      <Input
        type="number"
        min="0"
        value={outVal}
        onChange={(e) => onOutChange(e.target.value)}
        placeholder="OUT"
        className="bg-background border-border text-center font-mono h-11 text-base min-w-[80px] sm:min-w-[60px] sm:h-9 sm:text-sm"
        data-ocid={`stock_entry.out_${size.toLowerCase()}_input`}
      />

      <div className="text-right font-mono text-sm text-muted-foreground tabular-nums">
        {currentStock}
      </div>
    </div>
  );
}

export default function StockEntryPage() {
  const { productId } = useParams({ from: "/stock-entry/$productId" });
  const navigate = useNavigate();
  const { session } = useAuth();
  const productIdNum = Number(productId);

  const { data: product, isLoading } = useProduct(productIdNum);
  const updateMutation = useUpdateStock();

  // Dynamic size list: product.availableSizes / productSizes if present, else fallback to ALL_SIZES
  const activeSizes: string[] = product
    ? getProductActiveSizes(product, ALL_SIZES)
    : ALL_SIZES;

  const [inValues, setInValues] = useState<Record<string, string>>({});
  const [outValues, setOutValues] = useState<Record<string, string>>({});
  const [remark, setRemark] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInChange = (size: string, val: string) => {
    setInValues((prev) => ({ ...prev, [size]: val }));
    if (val) setOutValues((prev) => ({ ...prev, [size]: "" }));
    setSubmitError("");
  };

  const handleOutChange = (size: string, val: string) => {
    setOutValues((prev) => ({ ...prev, [size]: val }));
    if (val) setInValues((prev) => ({ ...prev, [size]: "" }));
    setSubmitError("");
  };

  /** Get current stock for any size label from the product. */
  const getStockForSize = (size: string): number => {
    if (!product) return 0;
    return getProductSizeStock(product, size);
  };

  const handleSave = async () => {
    setSubmitError("");
    setSubmitSuccess(false);

    const changes = activeSizes.reduce<
      { size: string; inQty: number; outQty: number }[]
    >((acc, size) => {
      const inQty = Number(inValues[size]) || 0;
      const outQty = Number(outValues[size]) || 0;
      if (inQty > 0 || outQty > 0) {
        acc.push({ size, inQty, outQty });
      }
      return acc;
    }, []);

    if (changes.length === 0) {
      setSubmitError("Enter at least one stock change");
      return;
    }

    // Negative stock validation
    for (const change of changes) {
      if (change.outQty > 0) {
        const current = getStockForSize(change.size);
        if (change.outQty > current) {
          setSubmitError(
            `Cannot remove ${change.outQty} of size ${change.size} — only ${current} in stock`,
          );
          return;
        }
      }
    }

    const result = await updateMutation.mutateAsync({
      productId: productIdNum,
      changes,
      remark,
      userName: session?.userName ?? "Unknown",
      userId: session?.userId ?? "",
    });

    if (result.success) {
      setSubmitSuccess(true);
      setTimeout(() => navigate({ to: "/manage-stock" }), 1200);
    } else {
      setSubmitError(result.error ?? "Failed to save");
    }
  };

  return (
    <Layout bgOverride={product?.imageUrl || undefined}>
      <div className="relative min-h-[calc(100vh-4rem)]">
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-lg">
          {/* Back button */}
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => navigate({ to: "/manage-stock" })}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-sm hover:bg-muted"
              aria-label="Go back"
              data-ocid="stock_entry.back_button"
            >
              <ArrowLeft size={18} />
            </button>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Stock Entry
            </p>
          </div>

          {isLoading && (
            <div
              className="flex items-center justify-center py-12 text-muted-foreground"
              data-ocid="stock_entry.loading_state"
            >
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">Loading product…</span>
            </div>
          )}

          {!isLoading && product && (
            <>
              {/* Product photo header — full width, ~200-250px height */}
              <div
                className="w-full rounded-sm overflow-hidden mb-3 border border-border shadow-sm bg-muted/40"
                style={{ height: "220px" }}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Package
                      size={40}
                      className="text-muted-foreground opacity-40"
                    />
                  </div>
                )}
              </div>

              {/* Product name centered below photo */}
              <h1 className="font-display font-bold text-xl text-foreground tracking-tight text-center mb-5">
                {product.name}
              </h1>

              {/* Stock entry form */}
              <div
                className="bg-card/90 backdrop-blur-sm border border-border rounded-sm"
                data-ocid="stock_entry.form"
              >
                {/* Table header */}
                <div className="grid grid-cols-[56px_1fr_1fr_72px] sm:grid-cols-[60px_1fr_1fr_80px] gap-2 sm:gap-3 px-4 py-2 bg-muted border-b border-border">
                  <span className="text-xs font-mono text-muted-foreground uppercase">
                    Size
                  </span>
                  <span className="text-xs font-mono text-muted-foreground uppercase text-center">
                    IN
                  </span>
                  <span className="text-xs font-mono text-muted-foreground uppercase text-center">
                    OUT
                  </span>
                  <span className="text-xs font-mono text-muted-foreground uppercase text-right">
                    Stock
                  </span>
                </div>

                <div className="px-4">
                  {activeSizes.map((size, i) => (
                    <SizeRow
                      key={size}
                      size={size}
                      currentStock={getStockForSize(size)}
                      inVal={inValues[size] ?? ""}
                      outVal={outValues[size] ?? ""}
                      onInChange={(val) => handleInChange(size, val)}
                      onOutChange={(val) => handleOutChange(size, val)}
                      index={i}
                    />
                  ))}
                </div>

                {/* Remark */}
                <div className="px-4 pb-4 pt-3 border-t border-border">
                  <label
                    htmlFor="remark"
                    className="block text-xs font-mono text-muted-foreground uppercase mb-1.5"
                  >
                    Remark (optional)
                  </label>
                  <Input
                    id="remark"
                    type="text"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="e.g. New shipment, store transfer"
                    className="bg-background border-border"
                    data-ocid="stock_entry.remark_input"
                  />
                </div>

                {/* Status messages */}
                {submitError && (
                  <div
                    className="mx-4 mb-3 flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-sm px-3 py-2"
                    data-ocid="stock_entry.error_state"
                  >
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {submitSuccess && (
                  <div
                    className="mx-4 mb-3 flex items-center gap-2 text-sm text-primary bg-primary/10 border border-primary/20 rounded-sm px-3 py-2"
                    data-ocid="stock_entry.success_state"
                  >
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>Stock updated successfully!</span>
                  </div>
                )}

                {/* Save button */}
                <div className="px-4 pb-4">
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending || submitSuccess}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                    data-ocid="stock_entry.save_button"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
