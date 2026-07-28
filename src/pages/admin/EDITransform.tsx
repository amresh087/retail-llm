import { Card, Button, Row, Col, Form, Alert, Spinner } from 'react-bootstrap';
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

type WorkflowTimelineStatus = 'active' | 'completed' | 'pending' | 'failed';

type WorkflowStep = {
  title: string;
  caption: string;
  startedAt?: Date;
  duration: string;
  status: WorkflowTimelineStatus;
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

  // Helper: recognize canonical server statuses and treat metadata payloads separately
  const isRecognizedServerStatus = (status?: string) => {
    if (!status) return false;
    const normalized = status.trim().toUpperCase();
    const canonical = /^(SUBMITTED|EDI_TEXT_TO_EDI_XML|EDI_XML_TO_IDOC_XML|PROCESSING|COMPLETED|PENDING|CANCELLED|FAILED)$/;
    if (canonical.test(normalized)) return true;
    if (status.includes('=') || status.includes(';')) return false; // metadata
    return /^[A-Z_]+$/.test(normalized);
  };

  useEffect(() => {
    void loadOptions();
  }, []);

  useEffect(() => {
    if (submissionState.status !== 'submitted') {
      return;
    }

    const normalized = (submissionState.documentStatus || '').trim().toLowerCase();
    const shouldAutoPoll = /pending|processing|running|queued|submitted|edi_text_to_edi_xml|edi_xml_to_idoc_xml/i.test(normalized);
    if (!shouldAutoPoll) {
      return;
    }

    const fastPoll = /edi_text_to_edi_xml|edi_xml_to_idoc_xml|processing|running/.test(normalized);
    const intervalMs = fastPoll ? 2000 : 5000;

    const timer = window.setInterval(() => {
      void refreshSubmissionStatus(false);
    }, intervalMs);

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
      const candidateStatus = jobStatus?.status?.trim() || submissionState.documentStatus || 'Indexed';
      const recognized = isRecognizedServerStatus(candidateStatus);
      const latestStatus = recognized ? candidateStatus : submissionState.documentStatus || 'Indexed';
      const normalizedStatus = latestStatus.toLowerCase();
      const nextMessage = normalizedStatus.includes('complete') || normalizedStatus.includes('success')
        ? 'The workflow completed successfully.'
        : normalizedStatus.includes('process') || normalizedStatus.includes('running')
          ? 'The workflow is still processing. Click refresh again for the latest update.'
          : 'The workflow status was refreshed from the document API.';

      const statusMessage = recognized ? nextMessage : (jobStatus?.payload ? `Metadata: ${jobStatus.payload}` : nextMessage);
      setSubmissionState((previous) => ({
        ...previous,
        documentStatus: latestStatus,
        message: statusMessage,
        createdAt: jobStatus?.createdAt || previous.createdAt || new Date().toISOString(),
        updatedAt: jobStatus?.updatedAt || new Date().toISOString(),
      }));
      await updateJobStatus(latestStatus, nextMessage);
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
      const candidateStatus = jobStatus?.status?.trim() || uploadedDocument.status || 'Indexed';
      const recognized = isRecognizedServerStatus(candidateStatus);
      const effectiveStatus = recognized ? candidateStatus : (uploadedDocument.status || 'Indexed');

      const submittedMessage = 'The upload request was accepted and the transformation workflow has started.';
      setSubmissionState({
        status: 'submitted',
        transformationId: documentId,
        documentStatus: effectiveStatus,
        message: recognized ? submittedMessage : (jobStatus?.payload ? `Metadata: ${jobStatus.payload}` : submittedMessage),
        createdAt: jobStatus?.createdAt || new Date().toISOString(),
        updatedAt: jobStatus?.updatedAt || new Date().toISOString(),
      });
      await updateJobStatus(effectiveStatus, submittedMessage);
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

  const getWorkflowBadgeVariant = (status: string) => {
    const normalized = status.trim().toLowerCase();
    if (normalized.includes('complete') || normalized.includes('success') || normalized.includes('done')) {
      return 'success';
    }
    if (normalized.includes('fail') || normalized.includes('error')) {
      return 'danger';
    }
    if (normalized.includes('edi_text_to_edi_xml') || normalized.includes('edi_xml_to_idoc_xml') || normalized.includes('processing') || normalized.includes('running') || normalized.includes('queue') || normalized.includes('pending')) {
      return 'warning';
    }
    return 'secondary';
  };

  const getWorkflowStageLabel = (status: string) => {
    const normalized = status.trim().toLowerCase();
    if (normalized.includes('complete') || normalized.includes('success') || normalized.includes('done')) {
      return 'Completed';
    }
    if (normalized.includes('fail') || normalized.includes('error')) {
      return 'Failed';
    }
    if (normalized.includes('pending') || normalized.includes('processing') || normalized.includes('running') || normalized.includes('queue')) {
      return 'Stage 3 • In progress';
    }
    if (normalized.includes('edi_text_to_edi_xml')) {
      return 'Stage 2 • EDI text → EDI XML';
    }
    if (normalized.includes('edi_xml_to_idoc_xml')) {
      return 'Stage 3 • EDI XML → IDOC XML';
    }
    return 'Stage 1 • Submitted';
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
    const normalized = status.trim().toLowerCase();
    if (normalized.includes('complete') || normalized.includes('success') || normalized.includes('done')) {
      return 4;
    }
    if (normalized.includes('fail') || normalized.includes('error')) {
      return 4;
    }
    if (normalized.includes('pending') || normalized.includes('processing') || normalized.includes('running') || normalized.includes('queue')) {
      return 3;
    }
    if (normalized.includes('edi_text_to_edi_xml')) {
      return 2;
    }
    if (normalized.includes('edi_xml_to_idoc_xml')) {
      return 3;
    }
    return 1;
  };

  const getWorkflowStepStates = (status: string) => {
    const normalized = status.trim().toLowerCase();
    const isCompleted = /complete|success|done/.test(normalized);
    const isFailed = /fail|error/.test(normalized);
    const workflowStage = getWorkflowStage(status);

    return {
      step1: workflowStage >= 1 ? 'completed' : 'active',
      step2: workflowStage >= 2 ? 'completed' : 'pending',
      step3: workflowStage === 4 ? 'completed' : workflowStage >= 3 ? 'active' : 'pending',
      step4: isFailed ? 'failed' : isCompleted ? 'completed' : 'pending',
    };
  };

  const workflowStage = getWorkflowStage(submissionState.documentStatus || 'submitted');
  const workflowStepStates = getWorkflowStepStates(submissionState.documentStatus || 'submitted');
  const workflowSteps: WorkflowStep[] = (() => {
    const normalizedStatus = (submissionState.documentStatus || '').trim().toLowerCase();
    const isCompleted = /complete|success|done/.test(normalizedStatus);
    const isFailed = /fail|error/.test(normalizedStatus);
    const currentStartedAt = parseDate(submissionState.createdAt) ?? new Date();
    const statusUpdatedAt = parseDate(submissionState.updatedAt) ?? new Date();
    const now = new Date();

    const totalElapsedMs = Math.max(0, now.getTime() - currentStartedAt.getTime());
    const smallStage2Ms = 30 * 1000;
    const stage2Duration = workflowStage >= 3 ? Math.min(smallStage2Ms, totalElapsedMs) : undefined;
    const stage3DurationMs = workflowStage >= 3 ? Math.max(0, totalElapsedMs - (stage2Duration ?? 0)) : undefined;

    const stage2DurationLabel = stage2Duration ? (Math.floor(stage2Duration / 1000) + 's') : (workflowStage === 2 ? formatDuration(currentStartedAt.toISOString(), now.toISOString()) : '—');
    const stage3DurationLabel = stage3DurationMs ? (Math.floor(stage3DurationMs / 1000) + 's') : (workflowStage === 3 ? formatDuration(statusUpdatedAt?.toISOString(), now.toISOString()) : '—');

    return [
      {
        title: '1. Submitted',
        caption: 'Request accepted',
        startedAt: currentStartedAt,
        duration: workflowStage === 1 ? formatDuration(currentStartedAt.toISOString(), now.toISOString()) : '0s',
        status: workflowStepStates.step1 === 'active' ? 'active' : workflowStepStates.step1 === 'completed' ? 'completed' : 'pending',
      },
      {
        title: '2. EDI text → EDI XML',
        caption: 'Normalize the EDI payload and generate XML',
        startedAt: currentStartedAt,
        duration: stage2DurationLabel,
        status: workflowStepStates.step2 === 'active' ? 'active' : workflowStepStates.step2 === 'completed' ? 'completed' : 'pending',
      },
      {
        title: '3. EDI XML → IDOC XML',
        caption: 'Transform the XML into the final IDOC structure',
        startedAt: workflowStage >= 3 ? statusUpdatedAt : undefined,
        duration: workflowStage >= 3 ? stage3DurationLabel : '—',
        status: workflowStepStates.step3 === 'active' ? 'active' : workflowStepStates.step3 === 'completed' ? 'completed' : 'pending',
      },
      {
        title: '4. Completed / Failed',
        caption: isFailed ? 'The workflow ended with an error' : isCompleted ? 'The workflow completed successfully' : 'Waiting for the final result',
        startedAt: workflowStage === 4 ? statusUpdatedAt : undefined,
        duration: '—',
        status: workflowStepStates.step4 === 'failed' ? 'failed' : workflowStepStates.step4 === 'completed' ? 'completed' : 'pending',
      },
    ];
  })();

  const placeholderWorkflowSteps: WorkflowStep[] = [
    {
      title: '1. Submitted',
      caption: 'The request is waiting to begin',
      duration: '—',
      status: 'pending',
    },
    {
      title: '2. EDI text → EDI XML',
      caption: 'This stage will appear once the job starts',
      duration: '—',
      status: 'pending',
    },
    {
      title: '3. EDI XML → IDOC XML',
      caption: 'The transformation flow will continue here',
      duration: '—',
      status: 'pending',
    },
    {
      title: '4. Completed / Failed',
      caption: 'The final state will be added when the workflow finishes',
      duration: '—',
      status: 'pending',
    },
  ];

  const renderWorkflowTimeline = (steps: WorkflowStep[]) => (
    <div className="d-flex flex-column gap-3">
      {steps.map((step, index) => {
        const isActive = step.status === 'active';
        const isCompleted = step.status === 'completed';
        const isFailed = step.status === 'failed';
        const isPending = step.status === 'pending';

        return (
          <div key={`${step.title}-${index}`} className="d-flex align-items-start gap-3">
            <div className="d-flex flex-column align-items-center" style={{ minWidth: 36 }}>
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 36, height: 36, backgroundColor: isCompleted ? '#198754' : isFailed ? '#dc3545' : isActive ? '#0d6efd' : '#e9ecef', color: isCompleted || isFailed || isActive ? '#fff' : '#6c757d', fontSize: '0.95rem' }}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className="mt-2" style={{ width: 2, height: 28, backgroundColor: isCompleted ? '#198754' : isFailed ? '#dc3545' : isActive ? '#0d6efd' : '#e9ecef' }} />
              )}
            </div>
            <div className="flex-grow-1 py-1">
              <div>
                <div className="fw-semibold d-flex align-items-center">
                  {isActive && <Spinner animation="border" size="sm" className="me-2" />}
                  <span>{step.title}</span>
                </div>
                <div className="text-muted small">{step.caption}</div>
                <div className="mt-2 small text-muted">
                  <div>Duration: {step.duration}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="py-3">
      <div className="border rounded-4 p-4 mb-4 bg-light-subtle" style={{ borderColor: '#e5e7eb' }}>
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
          <div>
            <h2 className="mb-2">🔄 EDI Transformation</h2>
            <p className="text-muted mb-0">Upload an EDI text file, submit it for transformation, and monitor the workflow status from the document API.</p>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="text-muted small">{submissionState.status === 'submitted' ? 'Submitted request' : 'Ready to submit'}</span>
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
              </div>

              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded-3 border bg-light-subtle">
                  <div className="mb-2">
                    <div className="fw-semibold">Step 1 • Select options</div>
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
                  <Button variant="outline-secondary" size="sm" onClick={() => void refreshSubmissionStatus()} disabled={refreshingStatus || submissionState.status !== 'submitted'}>
                    {refreshingStatus ? <><Spinner animation="border" size="sm" className="me-2" />Refreshing</> : '🔄 Refresh'}
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                {submissionState.status === 'submitted' ? (
                  <div className="d-flex flex-column gap-3">
                    <div className="p-3 rounded-4 border bg-light-subtle">
                      <div className="mb-3">
                        <div className="fw-semibold">Results returned by the document API</div>
                        <div className="text-muted small">Live workflow execution details</div>
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
                        <div className="mb-3">
                          <h6 className="mb-1">Workflow status</h6>
                          <div className="text-muted small">{submissionState.message}</div>
                        </div>

                        {renderWorkflowTimeline(workflowSteps)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-4 border border-dashed p-4 text-center text-muted bg-light-subtle">
                    <div className="fw-semibold mb-2">No active workflow yet</div>
                    <div className="mb-3">Use the panel on the left to submit an EDI file and watch the workflow appear here.</div>
                    <div className="rounded-3 border bg-white p-3 text-start">
                      <div className="mb-3">
                        <h6 className="mb-1">Workflow preview</h6>
                        <div className="text-muted small">A few placeholder stages will keep the panel looking complete before the job starts.</div>
                      </div>
                      {renderWorkflowTimeline(placeholderWorkflowSteps)}
                    </div>
                  </div>
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
