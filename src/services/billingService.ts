import api from "./api";

export interface Billing {
  id: number;
  purchaseId: number;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  billedAt: string;
}

// CREATE BILL
export const createBilling = (purchaseId: number) =>
  api.post("/billings", { purchaseId });

// GET ALL BILLS
export const getAllBillings = () =>
  api.get<Billing[]>("/billings");

// GET BILL BY ID
export const getBillingById = (id: number) =>
  api.get<Billing>(`/billings/${id}`);

// GET BILL BY PURCHASE ID
export const getBillingByPurchaseId = (purchaseId: number) =>
  api.get<Billing[]>(`/billings/purchase/${purchaseId}`);
