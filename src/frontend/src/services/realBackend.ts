// Real backend service — wires to the canister actor via useActor / createActor
// All type conversions between frontend types (number) and backend types (bigint) happen here.

import { type ExternalBlob, UserRole, createActor } from "@/backend";
import type {
  Log as BackendLog,
  Product as BackendProduct,
  SessionInfo as BackendSession,
  SizeChange as BackendSizeChange,
  UserPublic as BackendUserPublic,
} from "@/backend";
import type {
  Log,
  LoginResult,
  Product,
  SessionInfo,
  SizeChange,
  UserPublic,
} from "@/types";

/** Internal-only color shape retained for cache compatibility. */
type ProductColor = { name: string; imageUrl: string };

// ---- Type converters ----

function toFrontendProduct(p: BackendProduct): Product {
  // Convert tuple stock array from bigint values to number
  const stock: [string, number][] = (p.stock ?? []).map(([label, qty]) => [
    label,
    Number(qty),
  ]);
  // Build a legacy-compat SizeMap from stock tuples (fallback zeros for missing keys)
  const sizesLegacy = {
    s: stock.find(([l]) => l === "S")?.[1] ?? 0,
    m: stock.find(([l]) => l === "M")?.[1] ?? 0,
    l: stock.find(([l]) => l === "L")?.[1] ?? 0,
    xl: stock.find(([l]) => l === "XL")?.[1] ?? 0,
    xxl: stock.find(([l]) => l === "XXL")?.[1] ?? 0,
    xxxl: stock.find(([l]) => l === "XXXL")?.[1] ?? 0,
  };
  return {
    id: Number(p.id),
    name: p.name,
    imageUrl: p.image.getDirectURL(),
    sizes: sizesLegacy,
    availableSizes: p.availableSizes ?? [],
    stock,
  };
}

function toFrontendLog(l: BackendLog): Log {
  return {
    id: Number(l.id),
    productId: Number(l.productId),
    productName: l.productName,
    size: l.size as string as Log["size"],
    logType: l.logType as string as Log["logType"],
    qty: Number(l.qty),
    remark: l.remark,
    userName: l.userName,
    userId: l.userId,
    timestamp: Number(l.timestamp),
    hasBeenEdited: l.hasBeenEdited,
    editedBy: l.editedBy ?? null,
  };
}

function toFrontendSession(s: BackendSession): SessionInfo {
  return {
    userId: s.userId,
    userName: s.userName,
    role: s.role === UserRole.admin ? "admin" : "user",
  };
}

function toFrontendUserPublic(u: BackendUserPublic): UserPublic {
  return {
    userId: u.userId,
    userName: u.userName,
    role: u.role === UserRole.admin ? "admin" : "user",
  };
}

function toBackendSizeChange(c: SizeChange): BackendSizeChange {
  return {
    size: c.size,
    inQty: BigInt(Math.max(0, c.inQty)),
    outQty: BigInt(Math.max(0, c.outQty)),
  };
}

// ---- Actor factory (passed to useActor) ----
export { createActor };

// ---- Service functions that take the actor directly ----

export async function loginUser(
  actor: Awaited<ReturnType<typeof createActor>>,
  userId: string,
  pin: string,
): Promise<LoginResult> {
  // login() auto-seeds users on first call — no need for separate seedUsers()
  // Calling seedUsers separately can trigger Debug.todo() in some authorization mixins
  try {
    const result: BackendSession | null = await actor.login(userId, pin);
    if (!result) {
      return { success: false, error: "Invalid User ID or PIN" };
    }
    return { success: true, session: toFrontendSession(result) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Try to seed and retry once if we get an error
    if (msg.includes("todo") || msg.includes("not found")) {
      try {
        await actor.seedUsers();
      } catch {
        // ignore seed errors
      }
      try {
        const result: BackendSession | null = await actor.login(userId, pin);
        if (!result) {
          return { success: false, error: "Invalid User ID or PIN" };
        }
        return { success: true, session: toFrontendSession(result) };
      } catch (retryErr: unknown) {
        const retryMsg =
          retryErr instanceof Error ? retryErr.message : String(retryErr);
        return { success: false, error: retryMsg };
      }
    }
    return { success: false, error: msg };
  }
}

export async function fetchProducts(
  actor: Awaited<ReturnType<typeof createActor>>,
): Promise<Product[]> {
  const products: BackendProduct[] = await actor.getProducts();
  return products.map(toFrontendProduct);
}

export async function fetchProduct(
  actor: Awaited<ReturnType<typeof createActor>>,
  id: number,
): Promise<Product | null> {
  const p: BackendProduct | null = await actor.getProduct(BigInt(id));
  return p ? toFrontendProduct(p) : null;
}

export async function fetchTotalProducts(
  actor: Awaited<ReturnType<typeof createActor>>,
): Promise<number> {
  const total: bigint = await actor.getTotalProducts();
  return Number(total);
}

export async function fetchTotalStock(
  actor: Awaited<ReturnType<typeof createActor>>,
): Promise<number> {
  const total: bigint = await actor.getTotalStock();
  return Number(total);
}

export async function fetchLogs(
  actor: Awaited<ReturnType<typeof createActor>>,
): Promise<Log[]> {
  const logs: BackendLog[] = await actor.getLogs();
  return logs.map(toFrontendLog).sort((a, b) => b.timestamp - a.timestamp);
}

export async function updateStock(
  actor: Awaited<ReturnType<typeof createActor>>,
  productId: number,
  changes: SizeChange[],
  remark: string,
  userId: string,
  userName: string,
): Promise<{ success: boolean; error?: string }> {
  const backendChanges = changes.map(toBackendSizeChange);
  const result = await actor.updateStock(
    BigInt(productId),
    backendChanges,
    remark,
    userId,
    userName,
  );
  if (result.__kind__ === "ok") {
    return { success: true };
  }
  return { success: false, error: result.err };
}

/**
 * Add a new product. Backend signature:
 *   addProduct(adminUserId, name, image, availableSizes, initialStock)
 */
export async function addProduct(
  actor: Awaited<ReturnType<typeof createActor>>,
  adminUserId: string,
  name: string,
  image: ExternalBlob,
  availableSizes: string[],
  initialStock: Array<[string, number]>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const backendStock: Array<[string, bigint]> = initialStock.map(
      ([label, qty]) => [label, BigInt(Math.max(0, qty))],
    );
    const result = await actor.addProduct(
      adminUserId,
      name,
      image,
      availableSizes,
      backendStock,
    );
    if (result.__kind__ === "ok") {
      return { success: true };
    }
    return { success: false, error: result.err };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

export async function createUser(
  actor: Awaited<ReturnType<typeof createActor>>,
  adminUserId: string,
  newUserId: string,
  pin: string,
  name: string,
  role: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await actor.createNewUser(
      adminUserId,
      newUserId,
      pin,
      name,
      role,
    );
    if (result.__kind__ === "ok") {
      return { success: true };
    }
    return { success: false, error: result.err };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

export async function removeUser(
  actor: Awaited<ReturnType<typeof createActor>>,
  adminUserId: string,
  targetUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await actor.removeUser(adminUserId, targetUserId);
    if (result.__kind__ === "ok") return { success: true };
    return { success: false, error: result.err };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

export async function listUsers(
  actor: Awaited<ReturnType<typeof createActor>>,
  adminUserId: string,
): Promise<{ success: boolean; users?: UserPublic[]; error?: string }> {
  try {
    const result = await actor.listAllUsers(adminUserId);
    if (result.__kind__ === "ok") {
      return { success: true, users: result.ok.map(toFrontendUserPublic) };
    }
    return { success: false, error: result.err };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

export async function updateLog(
  actor: Awaited<ReturnType<typeof createActor>>,
  logId: number,
  newRemark: string,
  callerUserId: string,
): Promise<{ success: boolean; log?: Log; error?: string }> {
  try {
    const result = await actor.updateLog(
      BigInt(logId),
      newRemark,
      callerUserId,
    );
    if (result.__kind__ === "ok") {
      return { success: true, log: toFrontendLog(result.ok) };
    }
    return { success: false, error: result.err };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

export async function deleteLog(
  actor: Awaited<ReturnType<typeof createActor>>,
  adminUserId: string,
  logId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await actor.deleteLog(adminUserId, BigInt(logId));
    if (result.__kind__ === "ok") {
      return { success: true };
    }
    return { success: false, error: result.err };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

// ---- Color image management ----
// updateColorImage: stores per-color imageUrl in local session cache
// (backend Color record support pending backend upgrade)
const colorImageCache: Map<string, string> = new Map();

export function colorImageCacheKey(
  productId: number,
  colorName: string,
): string {
  return `${productId}::${colorName}`;
}

export async function updateColorImage(
  _actor: Awaited<ReturnType<typeof createActor>>,
  productId: number,
  colorName: string,
  imageUrl: string,
): Promise<void> {
  const key = colorImageCacheKey(productId, colorName);
  colorImageCache.set(key, imageUrl);
  // Persist to localStorage for cross-session use
  try {
    const stored = JSON.parse(
      localStorage.getItem("ww_color_images") ?? "{}",
    ) as Record<string, string>;
    stored[key] = imageUrl;
    localStorage.setItem("ww_color_images", JSON.stringify(stored));
  } catch {
    // ignore
  }
}

export async function getProductColors(
  _actor: Awaited<ReturnType<typeof createActor>>,
  productId: number,
  baseColors: ProductColor[],
): Promise<ProductColor[]> {
  // Merge base colors with any cached imageUrls
  let stored: Record<string, string> = {};
  try {
    stored = JSON.parse(
      localStorage.getItem("ww_color_images") ?? "{}",
    ) as Record<string, string>;
  } catch {
    // ignore
  }
  return baseColors.map((c) => {
    const key = colorImageCacheKey(productId, c.name);
    const cachedUrl = colorImageCache.get(key) ?? stored[key] ?? "";
    return { ...c, imageUrl: c.imageUrl || cachedUrl };
  });
}

// ---- Product update service functions ----

export async function updateProduct(
  actor: Awaited<ReturnType<typeof createActor>>,
  adminUserId: string,
  productId: number,
  newName: string | null,
  newImageUrl: string | null,
  newAvailableSizes: string[] | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const newImage = newImageUrl
      ? (await import("@/backend")).ExternalBlob.fromURL(newImageUrl)
      : null;
    const result = await actor.updateProduct(
      adminUserId,
      BigInt(productId),
      newName,
      newImage,
      newAvailableSizes,
    );
    if (result.__kind__ === "ok") return { success: true };
    return { success: false, error: result.err };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

export async function updateProductColor(
  _actor: Awaited<ReturnType<typeof createActor>>,
  _adminUserId: string,
  productId: number,
  colorName: string,
  newName: string | null,
  newImage: string | null,
): Promise<{ success: boolean; error?: string }> {
  // Color editing is handled via localStorage cache only (no backend method).
  if (newImage !== null) {
    await updateColorImage(_actor, productId, colorName, newImage);
  }
  if (newName !== null && newName !== colorName) {
    // Rename: update cache key
    const oldKey = colorImageCacheKey(productId, colorName);
    const newKey = colorImageCacheKey(productId, newName);
    const url = colorImageCache.get(oldKey) ?? "";
    if (url) {
      colorImageCache.set(newKey, url);
      colorImageCache.delete(oldKey);
    }
  }
  return { success: true };
}
