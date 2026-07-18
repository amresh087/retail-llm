import api from "./api";

export interface InventoryStatus {
  productId: number;
  availableQty: number;
  reservedQty: number;
}

export interface ReservedItem {
  referenceId: string;
  quantity: number;
  reservedDate?: string;
  sku?: string;
  productName?: string;
  productId?: number;
  batchNo?: string;

    // Add these two missing fields:
  name?: string;
  nameHi?: string;
}

export interface BatchInfo {
  id?: number;
  batchNo: string;
  availableQty: number;
  reservedQty: number;
  expiryDate: string | Date;
  manufacturingDate?: string | Date;
  supplierName?: string;
  productId?: number;
}

// GET inventory by product ID
export const getInventory = (productId: number) =>
  api.get<InventoryStatus>(`/inventory/${productId}`);

// GET reserved items for a product
export const getReservedItems = (productId: number) =>
  api.get<ReservedItem[]>(`/inventory/${productId}/reserved-items`);

// GET all reserved items (for all products)
export const getAllReservedItems = () =>
  api.get<ReservedItem[]>(`/inventory/reserved-items-all`);

// GET available batches for a product
export const getBatches = (productId: number) =>
  api.get<BatchInfo[]>(`/inventory/batches?productId=${productId}`);

// Simple in-memory cache for batches to avoid repeated API calls from dropdowns.
const batchesCache: Map<string, { ts: number; data: BatchInfo[] }> = new Map();
const BATCHES_CACHE_TTL = 60 * 1000; // 60 seconds

export const getBatchesCached = async (productId: number, requiredQty?: number) => {
  const key = String(productId);
  const entry = batchesCache.get(key);
  if (entry && Date.now() - entry.ts < BATCHES_CACHE_TTL) {
    return { data: entry.data } as { data: BatchInfo[] };
  }

  const qs = requiredQty != null ? `?productId=${productId}&requiredQty=${requiredQty}` : `?productId=${productId}`;
  const res = await api.get<BatchInfo[]>(`/inventory/batches${qs}`);
  batchesCache.set(key, { ts: Date.now(), data: res.data || [] });
  return res;
};

export const clearBatchesCache = (productId?: number) => {
  if (productId == null) {
    batchesCache.clear();
  } else {
    batchesCache.delete(String(productId));
  }
};

// Debounced coalescing wrapper: batches requests within `waitMs` are combined into one API call.
const debounceMap: Map<string, { timer?: number; resolvers: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> }> = new Map();

export const getBatchesDebounced = (productId: number, requiredQty?: number, waitMs = 300) => {
  const key = `${productId}|${requiredQty ?? ''}`;
  return new Promise<{ data: BatchInfo[] }>((resolve, reject) => {
    const entry = debounceMap.get(key) || { resolvers: [] };
    entry.resolvers.push({ resolve, reject });
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = (setTimeout(async () => {
      try {
        const res = await getBatchesCached(productId, requiredQty);
        const e = debounceMap.get(key);
        if (e) {
          e.resolvers.forEach(r => r.resolve(res));
        }
      } catch (err) {
        const e = debounceMap.get(key);
        if (e) {
          e.resolvers.forEach(r => r.reject(err));
        }
      } finally {
        debounceMap.delete(key);
      }
    }, waitMs) as unknown as number);
    debounceMap.set(key, entry);
  });
};

// ADJUST inventory (IN / OUT)
export const adjustInventory = (
  productId: number,
  quantity: number,
  type: "IN" | "OUT",
  remarks: string
) =>
  api.put(`/inventory/${productId}/adjust`, {
    quantity,
    type,
    remarks,
  });

// RESERVE inventory (with batchNo)
export const reserveInventory = (
  productId: number,
  quantity: number,
  referenceId: string,
  batchNo: string
) =>
  api.put(`/inventory/${productId}/reserve?batchNo=${batchNo}`, {
    quantity,
    referenceId,
  });

// RELEASE inventory
export const releaseInventory = (
  productId: number,
  quantity: number,
  referenceId: string
) =>
  api.put(`/inventory/${productId}/release`, {
    quantity,
    referenceId,
  });

/*
functional flow


Stock arrives → Adjust IN
Order placed → Reserve
Order cancelled → Release
Order delivered → Adjust OUT

*/