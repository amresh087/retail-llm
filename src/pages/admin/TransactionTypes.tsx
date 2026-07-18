import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { transactionTypeService, TransactionTypeRecord } from '../../services/transactionTypeService';

const TransactionTypes: React.FC = () => {
  const [items, setItems] = useState<TransactionTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TransactionTypeRecord | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', active: true });

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await transactionTypeService.getAll();
      setItems(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load transaction types. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', name: '', description: '', active: true });
    setShowModal(true);
  };

  const openEdit = (item: TransactionTypeRecord) => {
    setEditing(item);
    setForm({ code: item.code, name: item.name ?? '', description: item.description ?? '', active: !!item.active });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const updated = await transactionTypeService.update(editing.id, form);
        setItems((cur) => cur.map((i) => (String(i.id) === String(updated.id) ? updated : i)));
      } else {
        const created = await transactionTypeService.create(form);
        setItems((cur) => [created, ...cur]);
      }
      setShowModal(false);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Save failed.');
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Delete this transaction type?')) return;
    try {
      await transactionTypeService.remove(id);
      setItems((cur) => cur.filter((i) => String(i.id) !== String(id)));
      setError('');
    } catch (err) {
      console.error(err);
      setError('Delete failed.');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Transaction Types</h2>
          <p className="text-muted">Manage transaction types used across transactions.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Create Type</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" />
              <span>Loading...</span>
            </div>
          ) : (
            <Table hover>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="fw-medium">{it.code}</td>
                    <td>{it.name || '-'}</td>
                    <td>{it.description}</td>
                    <td>{it.active ? 'Yes' : 'No'}</td>
                    <td>
                      <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => openEdit(it)}>Edit</Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(it.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Edit Transaction Type' : 'Create Transaction Type'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Code</Form.Label>
              <Form.Control value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </Form.Group>
            <Form.Group>
              <Form.Check type="checkbox" label="Active" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TransactionTypes;
