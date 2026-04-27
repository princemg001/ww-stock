// Mock backend service - replaces real backend calls while backend is being built
// When backend is ready, replace these with actual actor calls via useActor

import type {
  Log,
  LoginResult,
  Product,
  SessionInfo,
  SizeChange,
  SizeMap,
} from "@/types";

// ---- In-memory mock store ----
let mockProducts: Product[] = [
  {
    id: 1,
    name: "Classic Tee",
    imageUrl: "/assets/generated/product-classic-tee.dim_400x300.jpg",
    sizes: { s: 45, m: 60, l: 55, xl: 30, xxl: 20, xxxl: 10 },
  },
  {
    id: 2,
    name: "Cargo Pants",
    imageUrl: "/assets/generated/product-cargo-pants.dim_400x300.jpg",
    sizes: { s: 20, m: 35, l: 40, xl: 25, xxl: 15, xxxl: 5 },
  },
  {
    id: 3,
    name: "Hoodie Pro",
    imageUrl: "/assets/generated/product-hoodie.dim_400x300.jpg",
    sizes: { s: 30, m: 50, l: 45, xl: 35, xxl: 20, xxxl: 8 },
  },
  {
    id: 4,
    name: "Work Jacket",
    imageUrl: "/assets/generated/product-jacket.dim_400x300.jpg",
    sizes: { s: 15, m: 28, l: 32, xl: 22, xxl: 12, xxxl: 4 },
  },
];

let mockLogs: Log[] = [
  {
    id: 1,
    productId: 1,
    productName: "Classic Tee",
    size: "M",
    logType: "IN",
    qty: 20,
    remark: "New shipment",
    userName: "Admin User",
    userId: "admin",
    timestamp: Date.now() - 3600000,
    hasBeenEdited: false,
    editedBy: null,
  },
  {
    id: 2,
    productId: 2,
    productName: "Cargo Pants",
    size: "L",
    logType: "OUT",
    qty: 5,
    remark: "Store transfer",
    userName: "John Doe",
    userId: "user1",
    timestamp: Date.now() - 7200000,
    hasBeenEdited: false,
    editedBy: null,
  },
  {
    id: 3,
    productId: 3,
    productName: "Hoodie Pro",
    size: "XL",
    logType: "IN",
    qty: 15,
    remark: "",
    userName: "Admin User",
    userId: "admin",
    timestamp: Date.now() - 10800000,
    hasBeenEdited: false,
    editedBy: null,
  },
];

let nextProductId = 5;
let nextLogId = 4;

const mockUsers: Array<{
  userId: string;
  password: string;
  name: string;
  role: "admin" | "user";
}> = [
  { userId: "admin", password: "admin123", name: "Admin User", role: "admin" },
  { userId: "user1", password: "user123", name: "John Doe", role: "user" },
  { userId: "user2", password: "user456", name: "Jane Smith", role: "user" },
];

// ---- Service functions ----

export async function loginUser(
  userId: string,
  password: string,
): Promise<LoginResult> {
  await delay(500);
  const user = mockUsers.find(
    (u) => u.userId === userId && u.password === password,
  );
  if (!user) {
    return { success: false, error: "Invalid User ID or password" };
  }
  const session: SessionInfo = {
    userId: user.userId,
    userName: user.name,
    role: user.role,
  };
  return { success: true, session };
}

export async function fetchProducts(): Promise<Product[]> {
  await delay(300);
  return [...mockProducts];
}

export async function fetchProduct(id: number): Promise<Product | null> {
  await delay(200);
  return mockProducts.find((p) => p.id === id) ?? null;
}

export async function fetchTotalProducts(): Promise<number> {
  await delay(100);
  return mockProducts.length;
}

export async function fetchTotalStock(): Promise<number> {
  await delay(100);
  return mockProducts.reduce((acc, p) => {
    return (
      acc +
      p.sizes.s +
      p.sizes.m +
      p.sizes.l +
      p.sizes.xl +
      p.sizes.xxl +
      p.sizes.xxxl
    );
  }, 0);
}

export async function fetchLogs(): Promise<Log[]> {
  await delay(300);
  return [...mockLogs].sort((a, b) => b.timestamp - a.timestamp);
}

export async function updateStock(
  productId: number,
  changes: SizeChange[],
  remark: string,
  userName: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  await delay(600);

  const product = mockProducts.find((p) => p.id === productId);
  if (!product) return { success: false, error: "Product not found" };

  const sizeKeyMap: Record<string, keyof SizeMap> = {
    S: "s",
    M: "m",
    L: "l",
    XL: "xl",
    XXL: "xxl",
    XXXL: "xxxl",
  };

  for (const change of changes) {
    const key = sizeKeyMap[change.size];
    if (!key) continue;

    if (change.inQty > 0 && change.outQty > 0) {
      return {
        success: false,
        error: `Only IN or OUT allowed for size ${change.size}`,
      };
    }

    if (change.outQty > 0 && product.sizes[key] < change.outQty) {
      return {
        success: false,
        error: `Insufficient stock for size ${change.size}`,
      };
    }
  }

  for (const change of changes) {
    const key = sizeKeyMap[change.size];
    if (!key) continue;

    if (change.inQty > 0) {
      product.sizes[key] += change.inQty;
      mockLogs.push({
        id: nextLogId++,
        productId,
        productName: product.name,
        size: change.size,
        logType: "IN",
        qty: change.inQty,
        remark,
        userName,
        userId,
        timestamp: Date.now(),
        hasBeenEdited: false,
        editedBy: null,
      });
    }

    if (change.outQty > 0) {
      product.sizes[key] -= change.outQty;
      mockLogs.push({
        id: nextLogId++,
        productId,
        productName: product.name,
        size: change.size,
        logType: "OUT",
        qty: change.outQty,
        remark,
        userName,
        userId,
        timestamp: Date.now(),
        hasBeenEdited: false,
        editedBy: null,
      });
    }
  }

  return { success: true };
}

export async function addProduct(
  name: string,
  imageUrl: string,
  sizes: SizeMap,
): Promise<{ success: boolean; error?: string }> {
  await delay(700);

  if (!name.trim())
    return { success: false, error: "Product name is required" };

  mockProducts.push({
    id: nextProductId++,
    name: name.trim(),
    imageUrl: imageUrl || "/assets/generated/product-classic-tee.jpg",
    sizes,
  });

  return { success: true };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
