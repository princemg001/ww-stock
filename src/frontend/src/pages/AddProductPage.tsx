import { ExternalBlob } from "@/backend";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useAddProduct } from "@/hooks/useQueries";
import { SIZE_KEYS, type SizeMap } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

const EMPTY_SIZES: SizeMap = { s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0 };
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export default function AddProductPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const addMutation = useAddProduct();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Dynamic sizes: admin-managed list (default: XS, S, M, L, XL, XXL, XXXL)
  const [availableSizes, setAvailableSizes] = useState<string[]>(DEFAULT_SIZES);
  const [sizeInput, setSizeInput] = useState("");
  // Per-size initial stock keyed by size label
  const [sizeStockInputs, setSizeStockInputs] = useState<
    Record<string, string>
  >(() => Object.fromEntries(DEFAULT_SIZES.map((s) => [s, "0"])));

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- Size management ----
  const addSize = (label: string) => {
    const trimmed = label.trim().toUpperCase();
    if (!trimmed) return;
    if (availableSizes.includes(trimmed)) return;
    setAvailableSizes((prev) => [...prev, trimmed]);
    setSizeStockInputs((prev) => ({ ...prev, [trimmed]: "0" }));
    setSizeInput("");
  };

  const removeSize = (label: string) => {
    setAvailableSizes((prev) => prev.filter((s) => s !== label));
    setSizeStockInputs((prev) => {
      const next = { ...prev };
      delete next[label];
      return next;
    });
  };

  const handleSizeStockChange = (size: string, val: string) => {
    setSizeStockInputs((prev) => ({ ...prev, [size]: val }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!selectedFile) {
      setError("Please select a product image");
      return;
    }
    if (!session?.userId) {
      setError("You must be logged in as admin to add products");
      return;
    }
    if (availableSizes.length === 0) {
      setError("Add at least one size");
      return;
    }

    // Validate and build initialStock as Array<[string, number]> tuples
    const initialStock: Array<[string, number]> = [];
    for (const size of availableSizes) {
      const val = Number(sizeStockInputs[size]) || 0;
      if (val < 0) {
        setError(`Stock for size ${size} cannot be negative`);
        return;
      }
      initialStock.push([size, val]);
    }

    // Also build legacy SizeMap for backend compatibility (maps known size keys)
    const sizes: SizeMap = { ...EMPTY_SIZES };
    for (const [sizeLabel, qty] of initialStock) {
      const key = SIZE_KEYS[sizeLabel] as keyof SizeMap | undefined;
      if (key && key in sizes) {
        sizes[key] = qty;
      }
    }

    const arrayBuffer = await selectedFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
      setUploadProgress(pct);
    });

    const result = await addMutation.mutateAsync({
      adminUserId: session.userId,
      name,
      image: blob,
      availableSizes,
      initialStock,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate({ to: "/manage-stock" }), 1200);
    } else {
      setError(result.error ?? "Failed to add product");
      setUploadProgress(0);
    }
  };

  const isUploading = addMutation.isPending;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/home" })}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-sm hover:bg-muted"
            aria-label="Go back"
            data-ocid="add_product.back_button"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Admin
            </p>
            <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
              Add Product
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
          data-ocid="add_product.form"
        >
          {/* Product info */}
          <div className="bg-card border border-border rounded-sm p-4 space-y-4">
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              Product Info
            </h2>
            <div className="space-y-1.5">
              <Label
                htmlFor="productName"
                className="text-sm font-medium text-foreground"
              >
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="productName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Classic Tee"
                className="bg-background border-border"
                data-ocid="add_product.name_input"
              />
            </div>

            {/* File picker */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Product Image <span className="text-destructive">*</span>
              </Label>
              {!selectedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-sm px-4 py-6 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer bg-background"
                  data-ocid="add_product.image_dropzone"
                >
                  <Upload size={20} />
                  <span className="text-sm">Click to select an image</span>
                  <span className="text-xs opacity-60">
                    JPG, PNG, WEBP up to 10 MB
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-3 border border-border rounded-sm p-3 bg-background">
                  <div className="w-14 h-14 rounded-sm overflow-hidden border border-border shrink-0">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon
                          size={16}
                          className="text-muted-foreground"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    {isUploading && uploadProgress > 0 && (
                      <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    aria-label="Remove image"
                    data-ocid="add_product.remove_image_button"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                data-ocid="add_product.image_upload_button"
              />
            </div>
          </div>

          {/* Sizes — admin-managed list */}
          <div className="bg-card border border-border rounded-sm p-4 space-y-3">
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              Sizes
            </h2>
            <p className="text-xs text-muted-foreground">
              Add or remove sizes for this product. Set initial stock for each.
            </p>

            {/* Add size input */}
            <div className="flex gap-2">
              <Input
                type="text"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSize(sizeInput);
                  }
                }}
                placeholder="Type size label (e.g. 2XL, 4XL)"
                className="bg-background border-border flex-1 text-sm"
                data-ocid="add_product.size_input"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addSize(sizeInput)}
                className="shrink-0"
                data-ocid="add_product.size_add_button"
              >
                <Plus size={14} />
                Add
              </Button>
            </div>

            {/* Size grid with stock inputs */}
            {availableSizes.length > 0 && (
              <div
                className="space-y-2 pt-1"
                data-ocid="add_product.sizes_list"
              >
                <div className="grid grid-cols-[1fr_80px_28px] gap-2 px-1">
                  <span className="text-xs font-mono text-muted-foreground uppercase">
                    Size
                  </span>
                  <span className="text-xs font-mono text-muted-foreground uppercase text-center">
                    Stock
                  </span>
                  <span />
                </div>
                {availableSizes.map((size, i) => (
                  <div
                    key={size}
                    className="grid grid-cols-[1fr_80px_28px] items-center gap-2 p-2 bg-background border border-border rounded-sm"
                    data-ocid={`add_product.size_row.item.${i + 1}`}
                  >
                    <span className="font-mono font-bold text-sm text-foreground">
                      {size}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      value={sizeStockInputs[size] ?? "0"}
                      onChange={(e) =>
                        handleSizeStockChange(size, e.target.value)
                      }
                      className="bg-muted border-border text-center font-mono h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      data-ocid={`add_product.size_stock_${size.toLowerCase()}_input`}
                    />
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                      aria-label={`Remove size ${size}`}
                      data-ocid={`add_product.size_remove.${i + 1}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {availableSizes.length === 0 && (
              <p
                className="text-xs text-muted-foreground italic"
                data-ocid="add_product.sizes_empty_state"
              >
                No sizes added — add at least one size
              </p>
            )}
          </div>

          {/* Status */}
          {error && (
            <div
              className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-sm px-3 py-2"
              data-ocid="add_product.error_state"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              className="flex items-center gap-2 text-sm text-primary bg-primary/10 border border-primary/20 rounded-sm px-3 py-2"
              data-ocid="add_product.success_state"
            >
              <CheckCircle2 size={14} className="shrink-0" />
              <span>Product added successfully!</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isUploading || success}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
            data-ocid="add_product.submit_button"
          >
            {isUploading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {uploadProgress > 0
                  ? `Uploading ${uploadProgress}%…`
                  : "Adding…"}
              </>
            ) : (
              <>
                <Plus size={15} />
                Add Product
              </>
            )}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
