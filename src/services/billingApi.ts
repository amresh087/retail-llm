import api from "./api";
import { getBatchesCached as getBatchesCachedFromInventory, getBatchesDebounced as getBatchesDebouncedFromInventory } from "./inventoryService";
export type CartItem = {
  productId: string;
  batchNo: string;
  name: string;
  nameHi?: string;
  sku: string;
  price: number;
  discountAmount?: number;
  qty: number;
  availableQty: number;
  expiryDate: string;
};




export const startBill = (userName: string) =>
  // send as query param because backend expects @RequestParam("userName")
  api.post(`/billings/start`, null, { params: { userName } });

export const getProductBySku = (sku: string) =>
  api.get(`/products/search/sku?sku=${sku}`);

export const getBatches = (productId: string, requiredQty?: number) => {
  const qs = requiredQty != null ? `?productId=${productId}&requiredQty=${requiredQty}` : `?productId=${productId}`;
  return api.get(`/inventory/batches${qs}`);
};

export const addItem = (billId: string, payload: any) =>
  api.post(`/billings/${billId}/items`, payload);

export const addItemsBatch = (billId: string, payload: any[]) =>
  api.post(`/billings/${billId}/items`, payload);

export const getSummary = (billId: string) =>
  api.get(`/billings/${billId}/summary`);

export const finalizeBill = (billId: string, payload?: any) =>
  // If backend supports payment metadata, send it in the body. Payload is optional.
  api.post(`/billings/${billId}/finalize`, payload);

export const cancelBill = (billId: string) =>
  // Cancel bill and release all reserved items
  api.post(`/billings/${billId}/cancel`);

export const checkBillRefundStatus = (billId: string) =>
  api.get(`/billings/${billId}/check-refund`);

export const markBillAsRefunded = (billId: string, amount: number) =>
  api.post(`/billings/${billId}/mark-refunded?amount=${amount}`);

export const refundBill = (billId: string, payload: { customerId?: string; walletCredit?: number; discountDebit?: number; cashRefund?: number }) =>
  api.post(`/billings/${billId}/refund`, payload);

// Expose cached batches via billingApi for UI modules that import from billingApi
export const getBatchesCached = (productId: string | number, requiredQty?: number) =>
  getBatchesCachedFromInventory(Number(productId), requiredQty);

export const getBatchesDebounced = (productId: string | number, requiredQty?: number, waitMs?: number) =>
  getBatchesDebouncedFromInventory(Number(productId), requiredQty, waitMs);
