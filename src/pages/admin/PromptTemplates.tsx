import { Card, Table, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { useState } from 'react';

const PromptTemplates = () => {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      tenant: 'Levi',
      name: 'Default Prompt',
      version: '1',
      prompt: 'You are an EDI to XML AI assistant. Use customer documents. Return valid XML only.',
    },
    {
      id: 2,
      tenant: 'Nike',
      name: 'Custom Prompt',
      version: '2',
      prompt: 'Transform EDI data to XML format for Nike business documents.',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    tenant: '',
    name: '',
    prompt: '',
  });

  const handleEdit = (template: any) => {
    setEditingId(template.id);
    setFormData({
      tenant: template.tenant,
      name: template.name,
      prompt: template.prompt,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingId) {
      setTemplates(
        templates.map((t) =>
          t.id === editingId ? { ...t, ...formData, version: (parseInt(t.version) + 1).toString() } : t
        )
      );
    } else {
      setTemplates([
        ...templates,
        {
          id: Math.max(...templates.map((t) => t.id)) + 1,
          version: '1',
          ...formData,
        },
      ]);
    }
    setShowModal(false);
    setEditingId(null);
    setFormData({ tenant: '', name: '', prompt: '' });
  };

  return (
    <div>
      <h2 className="mb-4">📝 Prompt Templates</h2>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light border-bottom d-flex justify-content-between align-items-center">
          <Card.Title className="mb-0">Templates</Card.Title>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingId(null);
              setFormData({ tenant: '', name: '', prompt: '' });
              setShowModal(true);
            }}
          >
            + Create Template
          </Button>
        </Card.Header>
        <Card.Body>
          <Table hover>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Template Name</th>
                <th>Version</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td>{template.tenant}</td>
                  <td className="fw-medium">{template.name}</td>
                  <td>
                    <span className="badge bg-info">{template.version}</span>
                  </td>
                  <td>
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(template)}>
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? '✏️ Edit Template' : '➕ Create Template'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tenant</Form.Label>
              <Form.Select
                value={formData.tenant}
                onChange={(e) => setFormData({ ...formData, tenant: e.target.value })}
              >
                <option value="">Select Tenant</option>
                <option value="Levi">Levi</option>
                <option value="Nike">Nike</option>
                <option value="Puma">Puma</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Template Name</Form.Label>
              <Form.Control
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>System Prompt</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Template
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PromptTemplates;
