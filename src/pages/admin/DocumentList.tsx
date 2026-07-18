import { useEffect, useState } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { documentService, type DocumentRecord } from '../../services/documentService';
import { tenantService, type TenantRecord } from '../../services/tenantService';
import { transactionTypeService, type TransactionTypeRecord } from '../../services/transactionTypeService';

const DocumentList = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [tenantOptions, setTenantOptions] = useState<TenantRecord[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'PDF',
    tenant: '',
    transactionTypeCode: '',
    version: 'v1',
    status: 'Indexed',
    contentType: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    void loadDocuments();
    void loadTransactionTypes();
    void loadTenantOptions();
  }, []);

  const loadTenantOptions = async () => {
    try {
      const data = await tenantService.getAll();
      setTenantOptions(data);
      if (!formData.tenant && data.length) {
        setFormData((current) => ({ ...current, tenant: data[0].name }));
      }
    } catch (err) {
      console.error('Unable to load tenant options:', err);
    }
  };

  const loadTransactionTypes = async () => {
    try {
      const data = await transactionTypeService.getAll();
      setTransactionTypes(data);
    } catch (err) {
      console.error('Unable to load transaction types:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await documentService.getAll();
      setDocuments(data);
    } catch (err) {
      setError('Unable to load documents from the API.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Indexed':
        return 'success';
      case 'Processing':
        return 'warning';
      case 'Failed':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getTransactionTypeName = (code?: string) => {
    if (!code) return '';
    const transactionType = transactionTypes.find((item) => item.code === code);
    return transactionType?.name ?? '';
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'PDF', tenant: tenantOptions[0]?.name ?? '', transactionTypeCode: '', version: 'v1', status: 'Indexed', contentType: '' });
    setSelectedFile(null);
    setEditingDoc(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (doc: DocumentRecord) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.name,
      type: doc.type,
      tenant: doc.tenant,
      transactionTypeCode: (doc as any).transactionTypeCode ?? '',
      version: doc.version,
      status: doc.status,
      contentType: doc.contentType ?? '',
    });
    setShowModal(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const inferredType = extension === 'xml' ? 'XML' : extension === 'txt' ? 'TXT' : 'PDF';

    setFormData((current) => ({
      ...current,
      name: file.name,
      type: inferredType,
      contentType: file.type || (extension === 'xml' ? 'application/xml' : extension === 'txt' ? 'text/plain' : 'application/pdf'),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingDoc) {
        const updated = await documentService.update(editingDoc.id, formData);
        setDocuments((current) => current.map((item) => (item.id === editingDoc.id ? updated : item)));
      } else {
        if (!selectedFile) {
          setError('Please select a file before uploading.');
          return;
        }
        const created = await documentService.upload(formData, selectedFile);
        setDocuments((current) => [created, ...current]);
      }
      setShowModal(false);
      resetForm();
      setError('');
    } catch (err) {
      setError(editingDoc ? 'Unable to update the document.' : 'Unable to upload the document.');
      console.error(err);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await documentService.remove(docId);
      setDocuments((current) => current.filter((doc) => doc.id !== docId));
      setError('');
    } catch (err) {
      setError('Unable to delete the document.');
      console.error(err);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>📄 Mapping Documents</h2>
          <p className="text-muted">Upload and manage mapping documents</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>📤 Upload Document</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" />
              <span>Loading documents...</span>
            </div>
          ) : (
            <Table hover>
              <thead>
                <tr>
                  <th>Trans Code</th>
                  <th>Trans Name</th>
                  <th>Docs Name</th>
                  <th>Type</th>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.transactionTypeCode || '-'}</td>
                    <td>{getTransactionTypeName(doc.transactionTypeCode) || '-'}</td>
                    <td className="fw-medium">{doc.name}</td>
                    <td>{doc.type}</td>
                    <td>{doc.tenant}</td>                   
                    <td>
                      <Badge bg={getStatusColor(doc.status)}>{doc.status}</Badge>
                    </td>
                    <td>
                      <Button variant="outline-primary" size="sm" className="me-2" onClick={() => openEditModal(doc)}>Edit</Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(doc.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingDoc ? '✏️ Edit Document' : '📤 Upload Document'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Document File</Form.Label>
              <Form.Control type="file" accept=".pdf,.xml,.txt" onChange={handleFileSelect} />
              <Form.Text className="text-muted">Choose a PDF, XML, or TXT file from your computer.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Document Name</Form.Label>
              <Form.Control value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select value={formData.type} onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value }))}>
                <option value="PDF">PDF</option>
                <option value="XML">XML</option>
                <option value="TXT">TXT</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tenant</Form.Label>
              <Form.Select
                value={formData.tenant}
                onChange={(event) => setFormData((current) => ({ ...current, tenant: event.target.value }))}
                required
              >
                <option value="">Select tenant</option>
                {tenantOptions.map((tenant) => (
                  <option key={tenant.id} value={tenant.name}>
                    {tenant.code} - {tenant.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Transaction Type Code</Form.Label>
              <Form.Select value={formData.transactionTypeCode} onChange={(event) => setFormData((current) => ({ ...current, transactionTypeCode: event.target.value }))} required>
                <option value="">Select a transaction type</option>
                {transactionTypes.map((type) => (
                  <option key={type.id} value={type.code}>
                    {type.code} {type.name ? `- ${type.name}` : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Version</Form.Label>
              <Form.Control value={formData.version} onChange={(event) => setFormData((current) => ({ ...current, version: event.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}>
                <option value="Indexed">Indexed</option>
                <option value="Processing">Processing</option>
                <option value="Failed">Failed</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
              <Button variant="primary" type="submit">Save</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DocumentList;
