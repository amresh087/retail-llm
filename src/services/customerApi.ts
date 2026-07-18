import api from "./api";

export interface Customer {
  id?: string;
  mobileNo?: string;
  walletBalance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerRequest {
  mobileNo?: string;
  initialWalletAmount?: number;
}

export interface WalletTransaction {
  id?: string;
  customerId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Get or create customer
export const getOrCreateCustomer = (mobileNo: string, billingId?: string) =>
  api.post<Customer>(`/users/customers/getOrCreate`, { mobileNo, billingId });

// Get customer by mobile
export const getCustomerByMobile = (mobileNo: string) =>
  api.get<Customer>(`/users/customers/mobile/${mobileNo}`);

// Get customer by ID
export const getCustomerById = (customerId: string) =>
  api.get<Customer>(`/users/customers/${customerId}`);

// Update wallet balance
export const addToWallet = (customerId: string, amount: number, description: string) =>
  api.post<Customer>(`/users/customers/${customerId}/wallet/add`, { amount, description });

// Deduct from wallet
export const deductFromWallet = (customerId: string, amount: number, description: string) =>
  api.post<Customer>(`/users/customers/${customerId}/wallet/deduct`, { amount, description });

// Get wallet transactions
export const getWalletTransactions = (customerId: string) =>
  api.get<WalletTransaction[]>(`/users/customers/${customerId}/wallet/transactions`);

// Get wallet transactions with pagination
export const getWalletTransactionsPaginated = (customerId: string, page: number = 0, size: number = 10) => {
  const p = Number(page ?? 0);
  const s = Number(size ?? 10);
  return api.get<PaginatedResponse<WalletTransaction>>(`/users/customers/${customerId}/wallet/transactions/paginated`, {
    params: { page: p, size: s }
  });
};

// Get billing transactions (from billing service)
export const getBillingTransactions = (customerId: string) =>
  api.get<any[]>(`/billings/customer/${customerId}`);

// Get billing transactions with pagination
export const getBillingTransactionsPaginated = (customerId: string, page: number = 0, size: number = 10) => {
  const p = Number(page ?? 0);
  const s = Number(size ?? 10);
  return api.get<PaginatedResponse<any>>(`/billings/customer/${customerId}/paginated`, {
    params: { page: p, size: s }
  });
};
