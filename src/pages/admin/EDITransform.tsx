import { Card, Button, Row, Col, Form, Alert, Badge, ListGroup, Spinner, ProgressBar } from 'react-bootstrap';
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
  const [submissionState, setSubmissionState] = useState<{ status: 'idle' | 'submitted'; transformationId: string; documentStatus: string; message: string }>({
    status: 'idle',
    transformationId: '',
    documentStatus: '',
    message: '',
  });

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
    setSubmissionState({ status: 'idle', transformationId: '', documentStatus: '', message: '' });

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
      const documentId = uploadedDocument.id || uploadedDocument.name || 'pending';
      const jobStatus = await documentService.getTransformationJobStatus(documentId);
      const latestStatus = jobStatus?.status || uploadedDocument.status || 'Indexed';
      // const xml = buildXmlFromEdi(content, selectedTenant, selectedType, uploadedDocument.name || file.name, documentId);

      // setResult(xml);
      setSubmissionState({
        status: 'submitted',
        transformationId: documentId,
        documentStatus: latestStatus,
        message: 'The upload request was accepted and the transformation workflow has started.',
      });
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
    <div className="py-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="mb-1">🔄 EDI Transformation</h2>
          <p className="text-muted mb-0">Upload an EDI text file and view the returned submission status from the document API.</p>
        </div>
        <div className="text-md-end">
          <Badge bg={submissionState.status === 'submitted' ? 'success' : 'secondary'} pill className="mb-1">
            {submissionState.status === 'submitted' ? 'Submitted request' : 'Ready to submit'}
          </Badge>
          <div className="text-muted" style={{ fontSize: '0.85rem' }}>Quickly transform and preview XML</div>
        </div>
      </div>

      <Row className="g-4">
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}

              <ListGroup className="mb-3">
                <ListGroup.Item active className="d-flex justify-content-between align-items-center">
                  <div>1. Select Options</div>
                  <Badge bg="light" text="dark">{selectedTenant || '—'}</Badge>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>Tenant</div>
                  <Form.Select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)} style={{ width: '58%' }}>
                    <option value="">Choose Tenant</option>
                    {tenantOptions.map((tenant) => (
                      <option key={tenant.id} value={tenant.name}>{tenant.code} - {tenant.name}</option>
                    ))}
                  </Form.Select>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>Transaction Type</div>
                  <Form.Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ width: '58%' }}>
                    <option value="">Choose Type</option>
                    {transactionTypes.map((transactionType) => (
                      <option key={transactionType.id} value={transactionType.code}>{transactionType.code} - {transactionType.name || 'Transaction'}</option>
                    ))}
                  </Form.Select>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>2. Choose File</div>
                  <div style={{ width: '58%' }}>
                    <Form.Control type="file" accept=".txt" onChange={handleFileChange} />
                    <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>{file?.name || 'No file selected'}</div>
                  </div>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>3. Transform</div>
                  <div style={{ width: '58%' }}>
                    <Button variant="primary" onClick={handleTransform} disabled={!selectedTenant || !selectedType || !file || loading} className="w-100">
                      {loading ? (<><Spinner animation="border" size="sm" /> <span className="ms-2">Transforming…</span></>) : '🚀 Transform'}
                    </Button>
                  </div>
                </ListGroup.Item>
              </ListGroup>

              <div>
                <div className="mb-2"><strong>Progress</strong></div>
                <ProgressBar now={submissionState.status === 'submitted' ? 100 : loading ? 60 : 0} label={submissionState.status === 'submitted' ? 'Done' : loading ? 'Processing' : 'Idle'} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <div className="d-flex flex-column gap-3">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="mb-0">Submission Status</Card.Title>
                  <Card.Text className="text-muted mb-0">Results returned by the document API</Card.Text>
                </div>
                <div>
                  {submissionState.status === 'submitted' ? <Badge bg="success">Submitted</Badge> : <Badge bg="secondary">Idle</Badge>}
                </div>
              </Card.Header>
              <Card.Body>
                {submissionState.status === 'submitted' ? (
                  <div className="d-flex flex-column gap-2">
                    <div><strong>Transformation ID:</strong> <span className="text-monospace">{submissionState.transformationId}</span></div>
                    <div><strong>Status:</strong> {submissionState.documentStatus}</div>
                    <div className="text-muted">{submissionState.message}</div>
                  </div>
                ) : (
                  <div className="text-muted">No submission yet. Use the panel on the left to start a transformation.</div>
                )}
              </Card.Body>
            </Card>

            {result && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0">Generated XML Preview</Card.Title>
                  <div>
                    <Button variant="outline-primary" size="sm" onClick={handleDownload}>📥 Download</Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <pre style={{ maxHeight: '420px', overflow: 'auto', fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{result}</pre>
                </Card.Body>
              </Card>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default EDITransform;
