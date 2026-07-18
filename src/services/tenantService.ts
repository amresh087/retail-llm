import api from './api';

export interface TenantRecord {
  id: number;
  code: string;
  name: string;
  status: string;
  users: number;
  documents: number;
  createdAt?: string;
}

interface TenantPayload {
  tenantId?: number;
  id?: number;
  tenantCode?: string;
  code?: string;
  tenantName?: string;
  name?: string;
  createdAt?: string;
  created_at?: string;
  users?: number;
  documents?: number;
}

const normalizeTenant = (tenant: TenantPayload): TenantRecord => ({
  id: tenant.tenantId ?? tenant.id ?? 0,
  code: tenant.tenantCode ?? tenant.code ?? '',
  name: tenant.tenantName ?? tenant.name ?? '',
  status: 'Active',
  users: tenant.users ?? 0,
  documents: tenant.documents ?? 0,
  createdAt: tenant.createdAt ?? tenant.created_at,
});

export const tenantService = {
  getAll: async (): Promise<TenantRecord[]> => {
    const response = await api.get('/tenants');
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(normalizeTenant);
  },

  getAllWithCounts: async (users: Array<{ tenantId?: number | null }>): Promise<TenantRecord[]> => {
    const response = await api.get('/tenants');
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map((tenant) => {
      const normalized = normalizeTenant(tenant);
      const tenantId = normalized.id;
      const userCount = users.filter((user) => user.tenantId === tenantId).length;
      return {
        ...normalized,
        users: userCount,
        documents: normalized.documents ?? 0,
      };
    });
  },

  create: async (payload: { tenantCode: string; tenantName: string }): Promise<TenantRecord> => {
    const response = await api.post('/tenants', payload);
    return normalizeTenant(response.data);
  },

  update: async (tenantId: number, payload: { tenantCode: string; tenantName: string }): Promise<TenantRecord> => {
    const response = await api.put(`/tenants/${tenantId}`, payload);
    return normalizeTenant(response.data);
  },

  remove: async (tenantId: number): Promise<void> => {
    await api.delete(`/tenants/${tenantId}`);
  },
};
