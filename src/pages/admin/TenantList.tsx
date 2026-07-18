import { Card, Table, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import OnboardClientModal from '../../components/OnboardClientModal';
import { tenantService, type TenantRecord } from '../../services/tenantService';
import { userService } from '../../services/userService';
import { documentService, type DocumentRecord } from '../../services/documentService';

const TenantList = () => {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnboard, setShowOnboard] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantRecord | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(null);

  useEffect(() => {
    void loadTenants();
  }, []);

  const normalizeTenantKey = (value?: string) => value?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';

  const matchesTenant = (tenant: TenantRecord, doc: DocumentRecord) => {
    const docKey = normalizeTenantKey(doc.tenant);
    const codeKey = normalizeTenantKey(tenant.code);
    const nameKey = normalizeTenantKey(tenant.name);

    return (
      docKey === codeKey ||
      docKey === nameKey ||
      nameKey.includes(docKey) ||
      docKey.includes(nameKey)
    );
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError('');
      const [tenantData, userData, documentData] = await Promise.all([
        tenantService.getAll(),
        userService.getAll(),
        documentService.getAll(),
      ]);

      const tenantsWithCounts = tenantData.map((tenant) => {
        const normalized = tenant;
        const count = documentData.filter((doc) => matchesTenant(normalized, doc)).length;
        return {
          ...normalized,
          users: userData.filter((user) => user.tenantId === normalized.id).length,
          documents: count,
        };
      });

      setTenants(tenantsWithCounts);
    } catch (err) {
      setError('Unable to load tenants from the API. Make sure the tenant service is running on localhost:5051.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (tenant: { code: string; name: string; roleCode?: string; status?: string }) => {
    try {
      const created = await tenantService.create({ tenantCode: tenant.code, tenantName: tenant.name });
      setTenants((current) => [{ ...created, status: tenant.status ?? 'Active' }, ...current]);
      setError('');
      console.log('Selected role code:', tenant.roleCode);
    } catch (err) {
      setError('Unable to create the tenant. Please verify the backend payload and service status.');
      console.error(err);
    }
  };

  const handleDeleteTenant = async (tenantId: number) => {
    if (!window.confirm('Delete this tenant?')) return;

    try {
      await tenantService.remove(tenantId);
      setTenants((current) => current.filter((tenant) => tenant.id !== tenantId));
      setError('');
    } catch (err) {
      setError('Unable to delete the tenant.');
      console.error(err);
    }
  };

  const handleEditTenant = (tenant: TenantRecord) => {
    setEditingTenant(tenant);
    setShowOnboard(true);
  };

  const handleUpdateTenant = async (tenant: { id: number; code: string; name: string; roleCode?: string; status?: string }) => {
    try {
      const updated = await tenantService.update(tenant.id, { tenantCode: tenant.code, tenantName: tenant.name });
      setTenants((current) => current.map((item) => (item.id === tenant.id ? {
        ...item,
        code: updated.code,
        name: updated.name,
        status: tenant.status ?? item.status ?? 'Active',
      } : item)));
      setError('');
      setEditingTenant(null);
    } catch (err) {
      setError('Unable to update the tenant.');
      console.error(err);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>🏢 Tenant Management</h2>
          <p className="text-muted">Manage all tenants in the system</p>
        </div>
        <Button variant="primary" onClick={() => {
          setEditingTenant(null);
          setShowOnboard(true);
        }}>+ Create Tenant</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" />
              <span>Loading tenants...</span>
            </div>
          ) : (
            <Table hover>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Documents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="fw-medium">{tenant.code}</td>
                    <td>{tenant.name}</td>
                    <td>
                      <span className={`badge bg-${tenant.status === 'Active' ? 'success' : 'secondary'}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td>{tenant.users}</td>
                    <td>{tenant.documents}</td>
                    <td>
                      <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleEditTenant(tenant)}>Edit</Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteTenant(tenant.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <OnboardClientModal
        show={showOnboard}
        onClose={() => {
          setShowOnboard(false);
          setEditingTenant(null);
        }}
        onCreate={handleCreateTenant}
        onUpdate={handleUpdateTenant}
        editingTenant={editingTenant}
      />

      <Modal show={!!selectedTenant} onHide={() => setSelectedTenant(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Tenant Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTenant && (
            <div>
              <p><strong>Code:</strong> {selectedTenant.code}</p>
              <p><strong>Name:</strong> {selectedTenant.name}</p>
              <p><strong>Status:</strong> {selectedTenant.status}</p>
              <p><strong>Users:</strong> {selectedTenant.users}</p>
              <p><strong>Documents:</strong> {selectedTenant.documents}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedTenant(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TenantList;
