// Shared types for WW Stock application

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";
export type LogType = "IN" | "OUT";
export type UserRole = "admin" | "user" | "owner";

/** All standard sizes including XS. Used as fallback when product has no custom sizes. */
export const ALL_SIZES: Size[] = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

/** Legacy size keys — kept for backwards compat with fixed SizeMap. XS not included in legacy map. */
export const SIZE_KEYS: Record<string, keyof SizeMap> = {
  S: "s",
  M: "m",
  L: "l",
  XL: "xl",
  XXL: "xxl",
  XXXL: "xxxl",
};

/** Fixed-key SizeMap as returned by backend (legacy). Does NOT include XS. */
export interface SizeMap {
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

/** Flexible size map — keys are size label strings (e.g. "S", "M", "XS"). */
export type FlexSizeMap = Record<string, number>;

/** Stock change entry — uses string size label for flexibility. */
export interface SizeChange {
  size: string;
  inQty: number;
  outQty: number;
}

export interface SessionInfo {
  userId: string;
  userName: string;
  role: UserRole;
}

export interface Product {
  id: number;
  name: string;
  imageUrl: string;
  /** Legacy fixed-key size map (backend v1). */
  sizes: SizeMap;
  /**
   * Admin-defined size labels for this product (backend v2 field: availableSizes).
   * When present, only these sizes are shown in stock entry / view.
   */
  availableSizes?: string[];
  /** Alias kept for backward compat with any existing code using productSizes. */
  productSizes?: string[];
  /**
   * Per-size stock as tuple array (backend v2 field: stock).
   * Each entry is [sizeLabel, qty]. Takes priority over legacy SizeMap.
   */
  stock?: [string, number][];
}

export interface Log {
  id: number;
  productId: number;
  productName: string;
  size: string;
  logType: LogType;
  qty: number;
  remark: string;
  userName: string;
  userId: string;
  timestamp: number;
  hasBeenEdited: boolean;
  editedBy: string | null;
}

export interface LoginCredentials {
  userId: string;
  pin: string;
}

export interface LoginResult {
  success: boolean;
  session?: SessionInfo;
  error?: string;
}

export interface UpdateStockArgs {
  productId: number;
  changes: SizeChange[];
  remark: string;
}

export interface AddProductArgs {
  name: string;
  imageUrl: string;
  sizes: SizeMap;
}

export interface CreateUserArgs {
  adminUserId: string;
  newUserId: string;
  pin: string;
  name: string;
  role: string;
}

export interface UserPublic {
  userId: string;
  userName: string;
  role: UserRole;
}

/** Get stock for a fixed-key SizeMap size label. Returns 0 for unknown keys. */
export function getSizeStock(sizes: SizeMap, size: string): number {
  const key = size.toLowerCase() as keyof SizeMap;
  if (key in sizes) return sizes[key];
  return 0;
}

/** Get stock from a FlexSizeMap. Returns 0 if size not present. */
export function getFlexSizeStock(sizes: FlexSizeMap, size: string): number {
  return sizes[size] ?? 0;
}

/** Sum all stock values in the fixed SizeMap. */
export function totalStock(sizes: SizeMap): number {
  return sizes.s + sizes.m + sizes.l + sizes.xl + sizes.xxl + sizes.xxxl;
}

/** Sum all stock values in a FlexSizeMap. */
export function totalFlexStock(sizes: FlexSizeMap): number {
  return Object.values(sizes).reduce((sum, v) => sum + v, 0);
}

/** Build a FlexSizeMap from a SizeMap so both can be rendered uniformly. */
export function sizeMapToFlex(sizes: SizeMap): FlexSizeMap {
  return {
    S: sizes.s,
    M: sizes.m,
    L: sizes.l,
    XL: sizes.xl,
    XXL: sizes.xxl,
    XXXL: sizes.xxxl,
  };
}

/**
 * Look up stock quantity for a given size in a tuple array.
 * Returns 0 if the size is not found.
 */
export function getStockForSize(
  stock: Array<[string, number]>,
  size: string,
): number {
  const entry = stock.find(([label]) => label === size);
  return entry ? entry[1] : 0;
}

/**
 * Build a FlexSizeMap from a stock tuple array [(sizeLabel, qty)].
 * Returns an empty object if the array is undefined/empty.
 */
export function stockTuplesToFlex(
  stock: [string, number][] | undefined,
): FlexSizeMap {
  if (!stock || stock.length === 0) return {};
  return stock.reduce<FlexSizeMap>((acc, [label, qty]) => {
    acc[label] = qty;
    return acc;
  }, {});
}

/**
 * Get stock for a given size from a Product, supporting both legacy SizeMap
 * and the new tuple-based stock field.
 */
export function getProductSizeStock(
  product: Pick<Product, "sizes" | "stock">,
  size: string,
): number {
  // New tuple-based stock takes priority
  if (product.stock && product.stock.length > 0) {
    const entry = product.stock.find(([label]) => label === size);
    return entry ? entry[1] : 0;
  }
  // Fall back to legacy SizeMap
  return getSizeStock(product.sizes, size);
}

/**
 * Get the active sizes for a product. Checks availableSizes, then productSizes
 * (legacy alias), then falls back to ALL_SIZES.
 */
export function getProductActiveSizes(
  product: Pick<Product, "availableSizes" | "productSizes">,
  fallback: string[] = ALL_SIZES,
): string[] {
  const custom = product.availableSizes ?? product.productSizes;
  if (custom && custom.length > 0) return custom;
  return fallback;
}

/** Get the grand total stock for a product across all sizes. */
export function getProductGrandTotal(product: Product): number {
  if (product.stock && product.stock.length > 0) {
    return totalFlexStock(stockTuplesToFlex(product.stock));
  }
  return totalStock(product.sizes);
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");
  return `${day}/${month} ${hours}:${mins}`;
}
