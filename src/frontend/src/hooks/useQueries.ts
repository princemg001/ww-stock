import type { ExternalBlob } from "@/backend";
import {
  addProduct,
  createActor,
  createUser,
  deleteLog,
  fetchLogs,
  fetchProduct,
  fetchProducts,
  fetchTotalProducts,
  fetchTotalStock,
  listUsers,
  loginUser,
  removeUser,
  updateLog,
  updateProduct,
  updateStock,
} from "@/services/realBackend";
import type { LoginResult, SizeChange, SizeMap } from "@/types";
// SizeMap kept for legacy compat; new addProduct no longer sends it to the backend
type _SizeMapCompat = SizeMap; // suppress unused import warning
void (undefined as unknown as _SizeMapCompat);
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const REFETCH_INTERVAL = 8000;

// ---- Auth ----
export function useLogin() {
  const { actor, isFetching } = useActor(createActor);
  return useMutation({
    mutationFn: async ({
      userId,
      pin,
    }: {
      userId: string;
      pin: string;
    }): Promise<LoginResult> => {
      // If actor isn't ready yet, return an error result instead of throwing
      if (!actor || isFetching) {
        return {
          success: false,
          error: "Connecting to server... Please wait a moment and try again.",
        };
      }
      return loginUser(actor, userId, pin);
    },
  });
}

// ---- Products ----
export function useProducts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["products"],
    queryFn: () => {
      if (!actor) return [];
      return fetchProducts(actor);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useProduct(id: number) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => {
      if (!actor) return null;
      return fetchProduct(actor, id);
    },
    enabled: !!actor && !isFetching && id > 0,
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useTotalProducts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["totalProducts"],
    queryFn: () => {
      if (!actor) return 0;
      return fetchTotalProducts(actor);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: REFETCH_INTERVAL,
  });
}

export function useTotalStock() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["totalStock"],
    queryFn: () => {
      if (!actor) return 0;
      return fetchTotalStock(actor);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: REFETCH_INTERVAL,
  });
}

// ---- Logs ----
export function useLogs() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["logs"],
    queryFn: () => {
      if (!actor) return [];
      return fetchLogs(actor);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: REFETCH_INTERVAL,
  });
}

// ---- Stock mutations ----
export function useUpdateStock() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      changes,
      remark,
      userName,
      userId,
    }: {
      productId: number;
      changes: SizeChange[];
      remark: string;
      userName: string;
      userId: string;
    }) => {
      if (!actor || isFetching) throw new Error("Actor not ready");
      return updateStock(actor, productId, changes, remark, userId, userName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["totalStock"] });
    },
  });
}

export function useAddProduct() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adminUserId,
      name,
      image,
      availableSizes: _availableSizes,
      initialStock: _initialStock,
    }: {
      adminUserId: string;
      name: string;
      image: ExternalBlob;
      /** Admin-defined sizes for this product. */
      availableSizes?: string[];
      /** Per-size initial stock as tuples [(sizeLabel, qty)]. */
      initialStock?: Array<[string, number]>;
    }) => {
      if (!actor || isFetching) throw new Error("Actor not ready");
      return addProduct(
        actor,
        adminUserId,
        name,
        image,
        _availableSizes ?? [],
        _initialStock ?? [],
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["totalProducts"] });
      queryClient.invalidateQueries({ queryKey: ["totalStock"] });
    },
  });
}

// ---- User management ----
export function useCreateUser() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adminUserId,
      newUserId,
      pin,
      name,
      role,
    }: {
      adminUserId: string;
      newUserId: string;
      pin: string;
      name: string;
      role: string;
    }) => {
      if (!actor || isFetching) throw new Error("Actor not ready");
      return createUser(actor, adminUserId, newUserId, pin, name, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useRemoveUser() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adminUserId,
      targetUserId,
    }: {
      adminUserId: string;
      targetUserId: string;
    }) => {
      if (!actor || isFetching) throw new Error("Actor not ready");
      return removeUser(actor, adminUserId, targetUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useListUsers(adminUserId: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["users", adminUserId],
    queryFn: async () => {
      if (!actor) return [];
      const result = await listUsers(actor, adminUserId);
      return result.users ?? [];
    },
    enabled: !!actor && !isFetching && !!adminUserId,
    refetchInterval: REFETCH_INTERVAL,
  });
}

// ---- Log mutations ----
export function useUpdateLog() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      logId,
      newRemark,
      callerUserId,
    }: {
      logId: number;
      newRemark: string;
      callerUserId: string;
    }) => {
      if (!actor || isFetching) throw new Error("Actor not ready");
      return updateLog(actor, logId, newRemark, callerUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}

export function useDeleteLog() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adminUserId,
      logId,
    }: {
      adminUserId: string;
      logId: number;
    }) => {
      if (!actor || isFetching) throw new Error("Actor not ready");
      return deleteLog(actor, adminUserId, logId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}

// ---- Product update mutations ----
export function useUpdateProduct() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adminUserId,
      productId,
      newName,
      newImageUrl,
      newAvailableSizes,
    }: {
      adminUserId: string;
      productId: number;
      newName: string | null;
      newImageUrl: string | null;
      newAvailableSizes: string[] | null;
    }) => {
      if (!actor || isFetching) throw new Error("Actor not ready");
      return updateProduct(
        actor,
        adminUserId,
        productId,
        newName,
        newImageUrl,
        newAvailableSizes,
      );
    },
    onSuccess: (_data, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
  });
}
