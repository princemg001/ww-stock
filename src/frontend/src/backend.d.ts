import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ProductColor {
    name: string;
    imageUrl: string;
}
export type Timestamp = bigint;
export interface UserPublic {
    userName: string;
    userId: string;
    role: UserRole;
}
export type StockUpdateResult = {
    __kind__: "ok";
    ok: Product;
} | {
    __kind__: "err";
    err: string;
};
export interface SizeChange {
    outQty: bigint;
    size: string;
    inQty: bigint;
}
export type LogId = bigint;
export interface SessionInfo {
    userName: string;
    userId: string;
    role: UserRole;
}
export interface Log {
    id: LogId;
    qty: bigint;
    remark: string;
    userName: string;
    userId: string;
    size: string;
    productId: ProductId;
    productName: string;
    logType: LogType;
    timestamp: Timestamp;
    hasBeenEdited: boolean;
    editedBy?: string;
}
export type ProductId = bigint;
export interface Product {
    id: bigint;
    name: string;
    stock: Array<[string, bigint]>;
    availableSizes: Array<string>;
    image: ExternalBlob;
    colors: Array<ProductColor>;
}
export enum LogType {
    IN = "IN",
    OUT = "OUT"
}
export enum UserRole {
    admin = "admin",
    owner = "owner",
    user = "user"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(adminUserId: string, name: string, image: ExternalBlob, availableSizes: Array<string>, initialStock: Array<[string, bigint]>): Promise<{
        __kind__: "ok";
        ok: Product;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createNewUser(adminUserId: string, newUserId: string, newPin: string, newName: string, roleText: string): Promise<{
        __kind__: "ok";
        ok: SessionInfo;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteLog(adminUserId: string, logId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCallerUserRole(): Promise<UserRole__1>;
    getLogs(): Promise<Array<Log>>;
    getProduct(id: ProductId): Promise<Product | null>;
    getProducts(): Promise<Array<Product>>;
    getTotalProducts(): Promise<bigint>;
    getTotalStock(): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    listAllUsers(adminUserId: string): Promise<{
        __kind__: "ok";
        ok: Array<UserPublic>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    login(userId: string, pin: string): Promise<SessionInfo | null>;
    removeUser(adminUserId: string, targetUserId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    seedUsers(): Promise<void>;
    updateLog(logId: bigint, newRemark: string, callerUserId: string): Promise<{
        __kind__: "ok";
        ok: Log;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateProduct(adminUserId: string, productId: ProductId, newName: string | null, newImage: ExternalBlob | null, newAvailableSizes: Array<string> | null): Promise<{
        __kind__: "ok";
        ok: Product;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateStock(productId: ProductId, sizeChanges: Array<SizeChange>, remark: string, userId: string, userName: string): Promise<StockUpdateResult>;
}
