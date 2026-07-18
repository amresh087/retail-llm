import api from './api';

export interface TransactionTypeRecord {
  id: string | number;
  code: string;
  name?: string;
  description?: string;
  active?: boolean;
  createdAt?: string;
}

const normalize = (data: any): TransactionTypeRecord => ({
  id: data.id ?? data.transactionTypeId ?? data.transactionCode ?? data.code ?? 0,
  code: data.code ?? data.transactionCode ?? data.name ?? '',
  name: data.name ?? data.documentName ?? data.displayName ?? data.title ?? '',
  description: data.description ?? data.purpose ?? data.desc ?? '',
  active: data.active ?? true,
  createdAt: data.createdAt ?? data.created_at,
});

const toBackendPayload = (payload: { code: string; name?: string; description?: string; active?: boolean }) => ({
  transactionCode: payload.code,
  documentName: payload.name || payload.code,
  purpose: payload.description || '',
});

export const transactionTypeService = {
  getAll: async (): Promise<TransactionTypeRecord[]> => {
    const resp = await api.get('/transaction/transaction-types');
    const data = Array.isArray(resp.data) ? resp.data : [];
    return data.map(normalize);
  },

  create: async (payload: { code: string; name?: string; description?: string; active?: boolean }): Promise<TransactionTypeRecord> => {
    const resp = await api.post('/transaction/transaction-types', toBackendPayload(payload));
    return normalize(resp.data);
  },

  update: async (id: string | number, payload: { code: string; name?: string; description?: string; active?: boolean }): Promise<TransactionTypeRecord> => {
    const resp = await api.put(`/transaction/transaction-types/${encodeURIComponent(String(id))}`, toBackendPayload(payload));
    return normalize(resp.data);
  },

  remove: async (id: string | number): Promise<void> => {
    await api.delete(`/transaction/transaction-types/${encodeURIComponent(String(id))}`);
  },
};

export default transactionTypeService;
