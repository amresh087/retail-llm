import { Card, Button, Row, Col, Form, Alert } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';
import { tenantService, type TenantRecord } from '../../services/tenantService';
import { transactionTypeService, type TransactionTypeRecord } from '../../services/transactionTypeService';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const ediTransactionTypes = [
  { code: '810', name: 'Invoice' },
  { code: '820', name: 'Payment Order / Remittance Advice' },
  { code: '824', name: 'Application Advice' },
  { code: '830', name: 'Planning Schedule' },
  { code: '846', name: 'Inventory Inquiry / Advice' },
  { code: '850', name: 'Purchase Order' },
  { code: '855', name: 'Purchase Order Acknowledgment' },
  { code: '856', name: 'Advance Ship Notice (ASN)' },
  { code: '862', name: 'Shipping Schedule' },
  { code: '864', name: 'Text Message' },
  { code: '870', name: 'Order Status Report' },
  { code: '940', name: 'Warehouse Shipping Order' },
  { code: '943', name: 'Warehouse Stock Transfer Shipment Advice' },
  { code: '944', name: 'Warehouse Stock Transfer Receipt Advice' },
  { code: '945', name: 'Warehouse Shipping Advice' },
  { code: '997', name: 'Functional Acknowledgment' },
];

const buildXmlFromEdi = (content: string, tenant: string, type: string, fileName: string, documentId: string) => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const segments = lines
    .map((line, index) => {
      const segmentName = line.split('*')[0] || `SEGMENT_${index + 1}`;
      return `    <Segment index="${index + 1}" name="${escapeXml(segmentName)}">${escapeXml(line)}</Segment>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<EDITransform>
  <Header>
    <Tenant>${escapeXml(tenant)}</Tenant>
    <TransactionType>${escapeXml(type)}</TransactionType>
    <GeneratedAt>${escapeXml(new Date().toISOString())}</GeneratedAt>
  </Header>
  <Source>
    <DocumentName>${escapeXml(fileName)}</DocumentName>
    <DocumentId>${escapeXml(documentId)}</DocumentId>
  </Source>
  <Segments>
${segments}
  </Segments>
</EDITransform>`;
};

const EDITransform = () => {
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tenantOptions, setTenantOptions] = useState<TenantRecord[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionTypeRecord[]>([]);

  useEffect(() => {
    void loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [tenantData, transactionData] = await Promise.all([
        tenantService.getAll(),
        transactionTypeService.getAll(),
      ]);

      setTenantOptions(tenantData);
      if (!selectedTenant && tenantData.length) {
        setSelectedTenant(tenantData[0].name);
      }

      setTransactionTypes(transactionData);
      if (!selectedType && transactionData.length) {
        setSelectedType(transactionData[0].code);
      }
    } catch (err) {
      console.error('Unable to load tenant or transaction options', err);
      setError('Unable to load tenant and transaction options.');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) {
      setFile(null);
      setError('');
      return;
    }

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (extension !== 'txt') {
      setFile(null);
      setError('Please select a .txt file.');
      event.target.value = '';
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleTransform = async () => {
    if (!selectedTenant || !selectedType || !file) {
      setError('Please select a tenant, transaction type, and EDI file.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const content = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase() ?? 'txt';
      const documentPayload = {
        name: file.name,
        type: extension === 'txt' ? 'TXT' : extension === 'xml' ? 'XML' : 'EDI',
        tenant: selectedTenant,
        transactionTypeCode: selectedType,
        mappingType: 'edi-to-xml',
        version: 'v1',
        status: 'Indexed',
        contentType: extension === 'txt' ? 'text/plain' : extension === 'xml' ? 'application/xml' : 'application/octet-stream',
      };

      const uploadedDocument = await documentService.upload(documentPayload, file);
      const xml = buildXmlFromEdi(content, selectedTenant, selectedType, uploadedDocument.name || file.name, uploadedDocument.id || 'pending');
      setResult(xml);
    } catch (err) {
      console.error(err);
      setError('Unable to upload the file to the document API and transform it.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const blob = new Blob([result], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedType || 'edi'}-transformed.xml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="mb-4">🔄 EDI Transformation</h2>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-bottom">
              <Card.Title className="mb-0">Transform EDI to XML</Card.Title>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Select Tenant</Form.Label>
                  <Form.Select
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                  >
                    <option value="">Choose Tenant</option>
                    {tenantOptions.map((tenant) => (
                      <option key={tenant.id} value={tenant.name}>
                        {tenant.code} - {tenant.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Transaction Type</Form.Label>
                  <Form.Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="">Choose Type</option>
                    {ediTransactionTypes.map((transactionType) => (
                      <option key={transactionType.code} value={transactionType.code}>
                        {transactionType.code} - {transactionType.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Choose EDI File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                  />
                  <Form.Text className="text-muted">Upload a .txt file to send it to the document API.</Form.Text>
                </Form.Group>

                <Button
                  variant="primary"
                  onClick={handleTransform}
                  disabled={!selectedTenant || !selectedType || !file || loading}
                  className="w-100"
                >
                  {loading ? 'Transforming...' : '🚀 Transform'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {result && (
          <Col lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0">Generated XML</Card.Title>
                  <div>
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={handleDownload}>
                      📥 Download
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <pre style={{ maxHeight: '400px', overflow: 'auto', fontSize: '0.85rem' }}>
                  {result}
                </pre>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default EDITransform;
