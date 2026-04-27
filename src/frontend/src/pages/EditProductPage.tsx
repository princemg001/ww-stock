import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useProduct, useUpdateProduct } from "@/hooks/useQueries";
import { ALL_SIZES } from "@/types";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  Camera,
  CheckSquare,
  Loader2,
  Package,
  Plus,
  Save,
  Square,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ---- helpers ----

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---- Sub-components ----

interface SizeSelectorProps {
  selected: string[];
  onChange: (sizes: string[]) => void;
}

function SizeSelector({ selected, onChange }: SizeSelectorProps) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (size: string) => {
    if (selected.includes(size)) {
      onChange(selected.filter((s) => s !== size));
    } else {
      onChange([...selected, size]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim().toUpperCase();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustomInput("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ALL_SIZES.map((size) => {
          const active = selected.includes(size);
          return (
            <button
              key={size}
              type="button"
              onClick={() => toggle(size)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-sm border transition-colors ${
                active
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {active ? <CheckSquare size={13} /> : <Square size={13} />}
              {size}
            </button>
          );
        })}
      </div>
      {/* Custom size input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add custom size (e.g. 44, 2XL)"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          className="bg-background border-input text-sm h-8 max-w-[200px]"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustom}
          className="h-8 gap-1"
        >
          <Plus size={12} />
          Add
        </Button>
      </div>
      {/* Selected custom sizes not in ALL_SIZES */}
      {selected.filter((s) => !ALL_SIZES.includes(s as never)).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selected
            .filter((s) => !ALL_SIZES.includes(s as never))
            .map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-sm bg-primary/10 border border-primary text-primary"
              >
                {s}
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  aria-label={`Remove ${s}`}
                  className="ml-0.5 opacity-70 hover:opacity-100"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

// ---- Main page ----

export default function EditProductPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const params = useParams({ from: "/edit-product/$productId" });
  const productId = Number(params.productId);

  const { data: product, isLoading } = useProduct(productId);
  const updateProduct = useUpdateProduct();

  // Form state
  const [name, setName] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [sizes, setSizes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      setName(product.name);
      setImagePreview(product.imageUrl);
      setSizes(
        product.availableSizes && product.availableSizes.length > 0
          ? product.availableSizes
          : ALL_SIZES,
      );
    }
  }, [product]);

  const handleMainImagePick = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataURL(file);
    setImagePreview(url);
    setNewImageUrl(url);
  };

  const handleSave = async () => {
    if (!session) return;
    if (!name.trim()) {
      setError("Product name is required");
      return;
    }
    if (sizes.length === 0) {
      setError("At least one size must be selected");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const productResult = await updateProduct.mutateAsync({
        adminUserId: session.userId,
        productId,
        newName: name.trim(),
        newImageUrl: newImageUrl ?? null,
        newAvailableSizes: sizes,
      });

      if (!productResult.success) {
        setError(productResult.error ?? "Failed to update product");
        setSaving(false);
        return;
      }

      toast.success("Product updated successfully");
      navigate({ to: "/manage-stock" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 size={24} className="animate-spin mr-2" />
          <span>Loading product…</span>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-2xl text-center text-muted-foreground">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p>Product not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/manage-stock" })}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-sm hover:bg-muted"
            aria-label="Go back"
            data-ocid="edit_product.back_button"
          >
            <X size={18} />
          </button>
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
              Admin · Edit
            </p>
            <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">
              Edit Product
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Product name + image */}
          <div className="bg-card border border-border rounded-sm p-5 space-y-4">
            <h2 className="font-semibold text-foreground text-sm">
              Basic Information
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="product-name" className="text-sm font-medium">
                Product Name
              </Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
                className="bg-background border-input"
                data-ocid="edit_product.name_input"
              />
            </div>

            {/* Main image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Product Image</Label>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-sm overflow-hidden border border-border bg-muted shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package size={24} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    className="gap-2"
                    data-ocid="edit_product.image_upload_button"
                  >
                    <Camera size={14} />
                    Change Image
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Leave unchanged to keep existing
                  </p>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMainImagePick}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div className="bg-card border border-border rounded-sm p-5 space-y-3">
            <h2 className="font-semibold text-foreground text-sm">
              Available Sizes
            </h2>
            <p className="text-xs text-muted-foreground">
              Only selected sizes will be shown for this product
            </p>
            <SizeSelector selected={sizes} onChange={setSizes} />
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-sm px-3 py-2"
              data-ocid="edit_product.error_state"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Save */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/manage-stock" })}
              data-ocid="edit_product.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              data-ocid="edit_product.save_button"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
