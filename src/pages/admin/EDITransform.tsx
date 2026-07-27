import { Card, Button, Row, Col, Form, Alert, Badge, ListGroup, Spinner, ProgressBar } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { documentService } from '../../services/documentService';
import { tenantService, type TenantRecord } from '../../services/tenantService';
import { transactionTypeService, type TransactionTypeRecord } from '../../services/transactionTypeService';

type SubmissionState = {
  status: 'idle' | 'submitted';
  transformationId: string;
  documentStatus: string;
  message: string;
  createdAt: string;
  updatedAt: string;
};

type SubmissionHistoryItem = {
  id: string;
  name: string;
  tenant: string;
  transactionTypeCode: string;
  status: string;
  documentId: string;
};

const EDITransform = () => {
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [error, setError] = useState('');
  const [tenantOptions, setTenantOptions] = useState<TenantRecord[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionTypeRecord[]>([]);
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    status: 'idle',
    transformationId: '',
    documentStatus: '',
    message: '',
    createdAt: '',
    updatedAt: '',
  });
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistoryItem[]>([]);

  useEffect(() => {
    void loadOptions();
    void loadSubmissionHistory();
  }, []);

  useEffect(() => {
    if (submissionState.status !== 'submitted') {
      return;
    }

    const shouldAutoPoll = /pending|processing|running|queued|submitted/i.test(submissionState.documentStatus);
    if (!shouldAutoPoll) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshSubmissionStatus(false);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [submissionState.status, submissionState.documentStatus, submissionState.transformationId]);

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

  const loadSubmissionHistory = async () => {
    try {
      const documents = await documentService.getAll();
      const ediSubmissions = await Promise.all(
        documents
          .filter((document) => {
            const type = (document.type || '').toUpperCase();
            const name = (document.name || '').toLowerCase();
            return document.mappingType === 'edi-to-xml' || type === 'EDI' || type === 'TXT' || name.endsWith('.edi') || name.endsWith('.txt');
          })
          .slice(0, 8)
          .map(async (document) => {
            const jobStatus = document.id ? await documentService.getTransformationJobStatus(document.id) : null;
            return {
              id: document.id || document.name,
              name: document.name,
              tenant: document.tenant,
              transactionTypeCode: document.transactionTypeCode || 'N/A',
              status: jobStatus?.status || document.status || 'Indexed',
              documentId: document.id,
            };
          })
      );

      setSubmissionHistory(ediSubmissions);
    } catch (err) {
      console.error('Unable to load EDI submission history', err);
    }
  };

  const updateJobStatus = async (status: string, payload?: string) => {
    if (!submissionState.transformationId) {
      return null;
    }

    try {
      const jobStatus = await documentService.getTransformationJobStatus(submissionState.transformationId);
      if (!jobStatus?.id) {
        return null;
      }

      return documentService.updateTransformationJobStatus(jobStatus.id, status, payload ?? status);
    } catch (err) {
      console.error('Unable to update transformation job status', err);
      return null;
    }
  };

  const refreshSubmissionStatus = async (showLoading = true) => {
    if (!submissionState.transformationId) {
      return;
    }

    if (showLoading) {
      setRefreshingStatus(true);
    }

    try {
      const jobStatus = await documentService.getTransformationJobStatus(submissionState.transformationId);
      const latestStatus = jobStatus?.status || submissionState.documentStatus || 'Indexed';
      const normalizedStatus = latestStatus.toLowerCase();
      const nextMessage = normalizedStatus.includes('complete') || normalizedStatus.includes('success')
        ? 'The workflow completed successfully.'
        : normalizedStatus.includes('process') || normalizedStatus.includes('running')
          ? 'The workflow is still processing. Click refresh again for the latest update.'
          : 'The workflow status was refreshed from the document API.';

      setSubmissionState((previous) => ({
        ...previous,
        documentStatus: latestStatus,
        message: nextMessage,
        createdAt: jobStatus?.createdAt || previous.createdAt || new Date().toISOString(),
        updatedAt: jobStatus?.updatedAt || new Date().toISOString(),
      }));
      await updateJobStatus(latestStatus, nextMessage);
      await loadSubmissionHistory();
    } catch (err) {
      console.error('Unable to refresh workflow status', err);
      setError('Unable to refresh the workflow status right now.');
    } finally {
      if (showLoading) {
        setRefreshingStatus(false);
      }
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
    setSubmissionState({ status: 'idle', transformationId: '', documentStatus: '', message: '', createdAt: '', updatedAt: '' });

    try {
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

      const submittedMessage = 'The upload request was accepted and the transformation workflow has started.';
      setSubmissionState({
        status: 'submitted',
        transformationId: documentId,
        documentStatus: latestStatus,
        message: submittedMessage,
        createdAt: jobStatus?.createdAt || new Date().toISOString(),
        updatedAt: jobStatus?.updatedAt || new Date().toISOString(),
      });
      await updateJobStatus(latestStatus, submittedMessage);
      await loadSubmissionHistory();
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

  const handleDeleteSubmission = async (documentId: string) => {
    if (!documentId) return;

    try {
      await documentService.remove(documentId);
      setSubmissionHistory((previous) => previous.filter((submission) => submission.documentId !== documentId && submission.id !== documentId));
      if (submissionState.transformationId === documentId) {
        setSubmissionState({ status: 'idle', transformationId: '', documentStatus: '', message: '', createdAt: '', updatedAt: '' });
      }
    } catch (err) {
      console.error('Unable to delete submission', err);
      setError('Unable to delete this submission right now.');
    }
  };

  const getProgressValue = () => {
    if (loading) return 60;
    if (submissionState.status !== 'submitted') return 0;

    const status = submissionState.documentStatus.toLowerCase();
    if (status.includes('pending') || status.includes('queued')) return 35;
    if (status.includes('process') || status.includes('running')) return 70;
    return 100;
  };

  const getProgressLabel = () => {
    if (loading) return 'Processing';
    if (submissionState.status !== 'submitted') return 'Idle';

    return submissionState.documentStatus || 'Done';
  };

  const getStatusBadgeVariant = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('complete') || normalized.includes('success') || normalized.includes('done')) {
      return 'success';
    }
    if (normalized.includes('pending') || normalized.includes('processing') || normalized.includes('queue') || normalized.includes('running')) {
      return 'warning';
    }
    return 'secondary';
  };

  const getStatusLabel = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('complete') || normalized.includes('success') || normalized.includes('done')) {
      return 'Completed';
    }
    if (normalized.includes('pending')) {
      return 'Pending';
    }
    if (normalized.includes('processing') || normalized.includes('running') || normalized.includes('queue')) {
      return 'Processing';
    }
    return 'Submitted';
  };

  const parseDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDateTime = (value?: string) => {
    const parsed = parseDate(value);
    if (!parsed) return '—';
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }).format(parsed);
  };

  const formatDuration = (start?: string, end?: string) => {
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    if (!startDate || !endDate) return '—';

    const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getWorkflowStage = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('complete') || normalized.includes('success') || normalized.includes('done')) {
      return 4;
    }
    if (normalized.includes('fail') || normalized.includes('error')) {
      return 4;
    }
    if (normalized.includes('process') || normalized.includes('running') || normalized.includes('queue') || normalized.includes('pending')) {
      const startedAt = parseDate(submissionState.createdAt);
      const updatedAt = parseDate(submissionState.updatedAt);
      if (startedAt && updatedAt && updatedAt.getTime() - startedAt.getTime() > 30000) {
        return 3;
      }
      return 2;
    }
    return 1;
  };

  const workflowStage = getWorkflowStage(submissionState.documentStatus || 'submitted');
  const workflowSteps = (() => {
    const isCompleted = /complete|success|done/.test((submissionState.documentStatus || '').toLowerCase());
    const isFailed = /fail|error/.test((submissionState.documentStatus || '').toLowerCase());
    const isProcessing = /process|running|queue|pending/.test((submissionState.documentStatus || '').toLowerCase());
    const currentStartedAt = parseDate(submissionState.createdAt) ?? parseDate(submissionState.updatedAt) ?? new Date();
    const lastUpdatedAt = parseDate(submissionState.updatedAt) ?? new Date();
    const stage2Start = currentStartedAt;
    const stage3Start = workflowStage >= 3 ? new Date(currentStartedAt.getTime() + 30000) : null;
    const finalStart = isCompleted || isFailed ? lastUpdatedAt : null;

    return [
      {
        title: '1. Submitted',
        caption: 'Request accepted',
        startedAt: currentStartedAt,
        duration: formatDuration(submissionState.createdAt || submissionState.updatedAt, workflowStage >= 2 ? (submissionState.updatedAt || submissionState.createdAt) : undefined),
        status: workflowStage === 1 ? 'active' : 'completed',
      },
      {
        title: '2. EDI text → EDI XML',
        caption: 'Normalize the EDI payload and generate XML',
        startedAt: stage2Start,
        duration: formatDuration(stage2Start.toISOString(), workflowStage >= 3 ? (stage3Start?.toISOString() || lastUpdatedAt.toISOString()) : (isCompleted || isFailed ? lastUpdatedAt.toISOString() : undefined)),
        status: workflowStage === 2 ? 'active' : workflowStage > 2 ? 'completed' : 'pending',
      },
      {
        title: '3. EDI XML → IDOC XML',
        caption: 'Transform the XML into the final IDOC structure',
        startedAt: stage3Start,
        duration: formatDuration(stage3Start?.toISOString(), finalStart?.toISOString()),
        status: workflowStage === 3 ? 'active' : workflowStage === 4 ? 'completed' : 'pending',
      },
      {
        title: '4. Completed / Failed',
        caption: isFailed ? 'The workflow ended with an error' : isCompleted ? 'The workflow completed successfully' : 'Waiting for the final result',
        startedAt: finalStart,
        duration: '—',
        status: isFailed ? 'failed' : isCompleted ? 'completed' : 'pending',
      },
    ];
  })();

  return (
    <div className="py-3">
      <div className="border rounded-4 p-4 mb-4 bg-light-subtle" style={{ borderColor: '#e5e7eb' }}>
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
          <div>
            <h2 className="mb-2">🔄 EDI Transformation</h2>
            <p className="text-muted mb-0">Upload an EDI text file, submit it for transformation, and monitor the workflow status from the document API.</p>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Badge bg={submissionState.status === 'submitted' ? 'success' : 'secondary'} pill className="px-3 py-2">
              {submissionState.status === 'submitted' ? 'Submitted request' : 'Ready to submit'}
            </Badge>
            <Badge bg="outline-secondary" text="dark" pill className="px-3 py-2 border">
              XML preview available
            </Badge>
          </div>
        </div>
      </div>

      <Row className="g-4">
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100 rounded-4">
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-1">Upload & transform</h5>
                  <p className="text-muted small mb-0">Complete the steps below to submit an EDI file.</p>
                </div>
                <Badge bg="primary">Workflow</Badge>
              </div>

              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded-3 border bg-light-subtle">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-semibold">Step 1 • Select options</div>
                    <Badge bg="secondary">{selectedTenant || 'Tenant'}</Badge>
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Tenant</Form.Label>
                    <Form.Select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)}>
                      <option value="">Choose Tenant</option>
                      {tenantOptions.map((tenant) => (
                        <option key={tenant.id} value={tenant.name}>{tenant.code} - {tenant.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Transaction type</Form.Label>
                    <Form.Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                      <option value="">Choose Type</option>
                      {transactionTypes.map((transactionType) => (
                        <option key={transactionType.id} value={transactionType.code}>{transactionType.code} - {transactionType.name || 'Transaction'}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>

                <div className="p-3 rounded-3 border bg-light-subtle">
                  <div className="fw-semibold mb-2">Step 2 • Upload file</div>
                  <Form.Control type="file" accept=".txt" onChange={handleFileChange} />
                  <div className="text-muted mt-2 small">{file?.name || 'No file selected yet'}</div>
                </div>

                <div className="p-3 rounded-3 border bg-light-subtle">
                  <div className="fw-semibold mb-2">Step 3 • Transform</div>
                  <Button variant="primary" onClick={handleTransform} disabled={!selectedTenant || !selectedType || !file || loading} className="w-100 py-2">
                    {loading ? (<><Spinner animation="border" size="sm" /> <span className="ms-2">Transforming…</span></>) : '🚀 Transform EDI'}
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Progress</strong>
                  <span className="text-muted small">{getProgressLabel()}</span>
                </div>
                <ProgressBar now={getProgressValue()} label={getProgressLabel()} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <div className="d-flex flex-column gap-3">
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center px-4 py-3">
                <div>
                  <Card.Title className="mb-0">Submission Status</Card.Title>
                  <Card.Text className="text-muted mb-0">Results returned by the document API</Card.Text>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {submissionState.status === 'submitted' ? (
                    <Badge bg={getStatusBadgeVariant(submissionState.documentStatus || 'submitted')}>
                      {getStatusLabel(submissionState.documentStatus || 'submitted')}
                    </Badge>
                  ) : (
                    <Badge bg="secondary">Idle</Badge>
                  )}
                  <Button variant="outline-secondary" size="sm" onClick={() => void refreshSubmissionStatus()} disabled={refreshingStatus || submissionState.status !== 'submitted'}>
                    {refreshingStatus ? <><Spinner animation="border" size="sm" className="me-2" />Refreshing</> : '🔄 Refresh'}
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                {submissionState.status === 'submitted' ? (
                  <div className="d-flex flex-column gap-3">
                    <div className="p-3 rounded-4 border bg-light-subtle">
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                        <div>
                          <div className="fw-semibold">Results returned by the document API</div>
                          <div className="text-muted small">Live workflow execution details</div>
                        </div>
                        <Badge bg={getStatusBadgeVariant(submissionState.documentStatus || 'submitted')} className="px-3 py-2">
                          {getStatusLabel(submissionState.documentStatus || 'submitted').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="d-flex flex-column flex-md-row gap-3 mb-3">
                        <div className="flex-grow-1 p-3 rounded-3 border bg-white">
                          <div className="text-uppercase small text-muted mb-1">Transformation ID</div>
                          <div className="fw-semibold text-monospace">{submissionState.transformationId}</div>
                        </div>
                        <div className="flex-grow-1 p-3 rounded-3 border bg-white">
                          <div className="text-uppercase small text-muted mb-1">Last updated</div>
                          <div className="fw-semibold">{submissionState.updatedAt || 'Just now'}</div>
                        </div>
                      </div>

                      <div className="rounded-3 border bg-white p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <h6 className="mb-1">Workflow status</h6>
                            <div className="text-muted small">{submissionState.message}</div>
                          </div>
                          <Badge bg="info" text="dark" className="px-3 py-2">
                            {submissionState.documentStatus || 'SUBMITTED'}
                          </Badge>
                        </div>

                        <div className="d-flex flex-column gap-3">
                          {workflowSteps.map((step, index) => {
                            const isActive = step.status === 'active';
                            const isCompleted = step.status === 'completed';
                            const isFailed = step.status === 'failed';
                            const isPending = step.status === 'pending';

                            return (
                              <div key={`${step.title}-${index}`} className="d-flex align-items-start gap-3">
                                <div className="d-flex flex-column align-items-center" style={{ minWidth: 36 }}>
                                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 36, height: 36, backgroundColor: isCompleted ? '#198754' : isFailed ? '#dc3545' : isActive ? '#0d6efd' : '#e9ecef', color: isCompleted || isFailed || isActive ? '#fff' : '#6c757d', fontSize: '0.95rem' }}>
                                    {isCompleted ? '✓' : isFailed ? '✕' : index + 1}
                                  </div>
                                  {index < workflowSteps.length - 1 && (
                                    <div className="mt-2" style={{ width: 2, height: 28, backgroundColor: isCompleted ? '#198754' : isFailed ? '#dc3545' : isActive ? '#0d6efd' : '#e9ecef' }} />
                                  )}
                                </div>
                                <div className="flex-grow-1 py-1">
                                  <div className="fw-semibold">{step.title}</div>
                                  <div className="text-muted small">{step.caption}</div>
                                  <div className="mt-2 small text-muted">
                                    <div>Started: {formatDateTime(step.startedAt?.toISOString())}</div>
                                    <div>Duration: {step.duration}</div>
                                  </div>
                                  {isActive && (
                                    <div className="mt-2 small fw-semibold text-primary">CURRENT STAGE</div>
                                  )}
                                  {isPending && (
                                    <div className="mt-2 small text-muted">PENDING</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-4 border border-dashed p-4 text-center text-muted bg-light-subtle">
                    <div className="fw-semibold mb-2">No submission yet</div>
                    <div>Use the panel on the left to submit an EDI file and watch the workflow appear here.</div>
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm rounded-4">
              <Card.Header className="bg-white border-bottom px-4 py-3">
                <Card.Title className="mb-0">Submitted EDI Transactions</Card.Title>
              </Card.Header>
              <Card.Body className="p-0">
                {submissionHistory.length ? (
                  <ListGroup variant="flush">
                    {submissionHistory.map((submission) => {
                      const normalizedStatus = (submission.status || 'Indexed').toLowerCase();
                      const badgeVariant = normalizedStatus.includes('complete') || normalizedStatus.includes('success') || normalizedStatus.includes('done')
                        ? 'success'
                        : normalizedStatus.includes('pending') || normalizedStatus.includes('processing') || normalizedStatus.includes('queue') || normalizedStatus.includes('running')
                          ? 'warning'
                          : 'secondary';
                      const badgeLabel = normalizedStatus.includes('complete') || normalizedStatus.includes('success') || normalizedStatus.includes('done')
                        ? 'Completed'
                        : normalizedStatus.includes('pending')
                          ? 'Pending'
                          : normalizedStatus.includes('processing') || normalizedStatus.includes('running') || normalizedStatus.includes('queue')
                            ? 'Processing'
                            : 'Indexed';

                      return (
                        <ListGroup.Item key={submission.id} className="d-flex justify-content-between align-items-start gap-3 px-4 py-3">
                          <div>
                            <div className="fw-semibold">{submission.name}</div>
                            <div className="text-muted small">{submission.tenant} • {submission.transactionTypeCode}</div>
                            <div className="text-muted small">ID: {submission.documentId || submission.id}</div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Badge bg={badgeVariant}>{badgeLabel}</Badge>
                            <Button variant="outline-danger" size="sm" onClick={() => void handleDeleteSubmission(submission.documentId || submission.id)}>
                              Delete
                            </Button>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                ) : (
                  <div className="p-3 text-muted">No submitted EDI transactions have been recorded yet.</div>
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
