import { Card, Table, Button, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { tenantService, type TenantRecord } from '../../services/tenantService';
import { userService, type UserRecord } from '../../services/userService';

const roleOptions = ['ADMIN', 'TENANT-ADMIN', 'USER'] as const;
const roleIdMap: Record<string, number> = {
  ADMIN: 1,
  'TENANT-ADMIN': 2,
  USER: 3,
};

type FormState = {
  username: string;
  email: string;
  password: string;
  tenantId: number | null;
  role: string;
  status: string;
};

const emptyForm = (): FormState => ({
  username: '',
  email: '',
  password: '',
  tenantId: null,
  role: 'USER',
  status: 'Active',
});

const resolveTenantName = (user: UserRecord, tenantMap: Map<number, string>): string => {
  const tenantId = user.tenantId ?? 0;
  return tenantMap.get(tenantId) ?? user.tenant ?? 'Unknown';
};

const UserList = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm());

  useEffect(() => {
    void loadUsersAndTenants();
  }, []);

  const loadUsersAndTenants = async () => {
    try {
      setLoading(true);
      setError('');

      const [userData, tenantData] = await Promise.all([userService.getAll(), tenantService.getAll()]);
      const tenantNameMap = new Map(tenantData.map((tenant) => [tenant.id, tenant.name]));

      const usersWithTenantNames = userData.map((user) => ({
        ...user,
        tenant: resolveTenantName(user, tenantNameMap),
      }));

      setUsers(usersWithTenantNames);
      setTenants(tenantData);

      setFormData((current) => {
        if (tenantData.length > 0 && !current.tenantId) {
          return { ...current, tenantId: tenantData[0].id };
        }
        return current;
      });
    } catch (err) {
      setError('Unable to load users from the API. Make sure the tenant service is reachable on localhost:5051.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'TENANT-ADMIN':
        return 'warning';
      case 'USER':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const resetForm = () => {
    setFormData(emptyForm());
    if (tenants.length > 0) {
      setFormData((current) => ({ ...current, tenantId: tenants[0].id, role: 'USER', status: 'Active' }));
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    const matchingTenant = tenants.find((tenant) => tenant.id === user.tenantId)
      || tenants.find((tenant) => tenant.name === user.tenant)
      || null;

    setFormData({
      username: user.username ?? user.name ?? '',
      email: user.email ?? '',
      password: user.password ?? '',
      tenantId: matchingTenant?.id ?? null,
      role: user.role ?? 'USER',
      status: user.status ?? 'Active',
    });
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const selectedTenant = tenants.find((tenant) => tenant.id === formData.tenantId);
    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password || 'Welcome123!',
      tenantId: selectedTenant?.id ?? editingUser?.tenantId ?? null,
      tenantCode: selectedTenant?.code ?? undefined,
      roleId: roleIdMap[formData.role],
      status: formData.status,
      enabled: true,
      accountNonLocked: true,
      credentialsNonExpired: true,
      accountNonExpired: true,
    };

    try {
      if (editingUser) {
        const updated = await userService.update(editingUser.id, payload);
        const tenantName = selectedTenant?.name ?? editingUser.tenant ?? 'Unknown';
        setUsers((current) => current.map((item) => (item.id === editingUser.id ? {
          ...item,
          ...updated,
          tenant: tenantName,
          tenantId: payload.tenantId ?? item.tenantId,
        } : item)));
      } else {
        const created = await userService.create(payload);
        const tenantName = selectedTenant?.name ?? 'Unknown';
        setUsers((current) => [{ ...created, tenant: tenantName, tenantId: payload.tenantId ?? created.tenantId }, ...current]);
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      setError('');
    } catch (err) {
      setError(editingUser ? 'Unable to update the user.' : 'Unable to create the user.');
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await userService.remove(userId);
      setUsers((current) => current.filter((user) => user.id !== userId));
      setError('');
    } catch (err) {
      setError('Unable to delete the user.');
      console.error(err);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>👥 User Management</h2>
          <p className="text-muted">Manage all users and their roles</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>+ Create User</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" />
              <span>Loading users...</span>
            </div>
          ) : (
            <Table hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="fw-medium">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={getRoleColor(user.role)}>{user.role}</Badge>
                    </td>
                    <td>{user.tenant}</td>
                    <td>
                      <Badge bg={user.status === 'Active' ? 'success' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </td>
                    <td>
                      <Button variant="outline-primary" size="sm" className="me-2" onClick={() => openEditModal(user)}>Edit</Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => { setShowModal(false); setEditingUser(null); resetForm(); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? '✏️ Edit User' : '➕ Create User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                value={formData.username}
                onChange={(event) => setFormData((current) => ({ ...current, username: event.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                placeholder={editingUser ? 'Leave blank to keep existing' : 'Set a password'}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tenant</Form.Label>
              <Form.Select
                value={formData.tenantId ?? ''}
                onChange={(event) => setFormData((current) => ({ ...current, tenantId: Number(event.target.value) }))}
              >
                <option value="">Select Tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setEditingUser(null); resetForm(); }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">{editingUser ? 'Save Changes' : 'Create'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserList;
