import api from "./api"; // your axios instance with baseURL and token

export interface InventoryStatus {
  productId: number;
  availableQty: number;
  reservedQty: number;
}

export interface ProductReport {
  productId: number;
  totalPurchased: number | null;
  totalRevenue: number | null;
}

export interface ReportResponse {
  inventoryStatus: InventoryStatus[];
  productReports: ProductReport[];
  totalRevenue: number;
  totalTax: number;
}

// Fetch the report from backend
export const getReport = () => api.get<ReportResponse>("/report");
