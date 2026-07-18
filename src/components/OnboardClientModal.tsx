import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface Props {
  show: boolean;
  onClose: () => void;
  onCreate: (tenant: { code: string; name: string; roleCode?: string; status?: string }) => void;
  onUpdate?: (tenant: { id: number; code: string; name: string; roleCode?: string; status?: string }) => Promise<void>;
  editingTenant?: { id: number; code: string; name: string; status?: string } | null;
}

const defaultRoles = [
  { id: 1, createdAt: '2026-07-17 09:05:35.000000', name: 'Administrator', code: 'ADMIN' },
  { id: 2, createdAt: '2026-07-17 09:05:35.000000', name: 'Tenant Admin', code: 'SUPPORT' },
  { id: 3, createdAt: '2026-07-17 09:05:35.000000', name: 'Regular user', code: 'USER' },
];

const OnboardClientModal: React.FC<Props> = ({ show, onClose, onCreate, onUpdate, editingTenant }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Active');
  const [selectedRoleCode, setSelectedRoleCode] = useState('ADMIN');

  useEffect(() => {
    if (editingTenant) {
      setCode(editingTenant.code);
      setName(editingTenant.name);
      setStatus(editingTenant.status ?? 'Active');
      setSelectedRoleCode('ADMIN');
    } else {
      setCode('');
      setName('');
      setStatus('Active');
      setSelectedRoleCode('ADMIN');
    }
  }, [editingTenant, show]);

  const handleSubmit = async () => {
    if (!code.trim() || !name.trim()) return;

    if (editingTenant && onUpdate) {
      await onUpdate({
        id: editingTenant.id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        roleCode: selectedRoleCode,
        status,
      });
    } else {
      onCreate({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        roleCode: selectedRoleCode,
        status,
      });
    }

    setCode('');
    setName('');
    setStatus('Active');
    setSelectedRoleCode('ADMIN');
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{editingTenant ? 'Edit Tenant' : 'Onboard New Client'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Tenant Code</Form.Label>
            <Form.Control value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., ACME" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tenant Name</Form.Label>
            <Form.Control value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Form.Select>
          </Form.Group>
        </Form>

        <div className="mt-3">
          <Form.Group className="mb-2">
            <Form.Label>Select default role</Form.Label>
            <Form.Select value={selectedRoleCode} onChange={(e) => setSelectedRoleCode(e.target.value)}>
              {defaultRoles.map((role) => (
                <option key={role.id} value={role.code}>
                  {role.name} ({role.code})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>{editingTenant ? 'Save Changes' : 'Onboard Client'}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OnboardClientModal;
