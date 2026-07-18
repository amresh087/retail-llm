import type { ReportResponse } from "./reportingService";

/**
 * Mock data for testing the DetailedReport component
 * Remove this after real data is available from the backend
 */
export const mockReportData: ReportResponse = {
  totalRevenue: 150000,
  totalTax: 15000,
  productReports: [
    { productId: 1, totalPurchased: 100, totalRevenue: 50000 },
    { productId: 2, totalPurchased: 80, totalRevenue: 40000 },
    { productId: 3, totalPurchased: 60, totalRevenue: 30000 },
    { productId: 4, totalPurchased: 40, totalRevenue: 20000 },
    { productId: 5, totalPurchased: 20, totalRevenue: 10000 },
  ],
  inventoryStatus: [
    { productId: 1, availableQty: 500, reservedQty: 100 },
    { productId: 2, availableQty: 450, reservedQty: 80 },
    { productId: 3, availableQty: 350, reservedQty: 60 },
    { productId: 4, availableQty: 250, reservedQty: 40 },
    { productId: 5, availableQty: 150, reservedQty: 20 },
  ],
};

export const useMockData = false; // Set to true to use mock data for testing
