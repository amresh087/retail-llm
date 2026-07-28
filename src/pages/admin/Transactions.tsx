import { useEffect, useState } from 'react';
import { Card, Table, Button, Badge, Spinner, Modal } from 'react-bootstrap';
import { documentService, type DocumentRecord } from '../../services/documentService';

type TransactionHistoryRow = {
  documentId: string;
  name: string;
  tenant: string;
  transactionTypeCode: string;
  status: string;
  updatedAt: string;
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<TransactionHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    void loadTransactionHistory();
  }, []);

  const loadTransactionHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const documents = await documentService.getAll('edi-to-xml');
      const visibleDocuments = documents.filter((document) => {
        const mappingType = document.mappingType?.toLowerCase() ?? '';
        const name = document.name?.toLowerCase() ?? '';
        return !mappingType.includes('mapping') && !mappingType.includes('idoc') && !name.includes('mapping') && !name.includes('xslt') && !name.includes('templet');
      });
      const results = await Promise.all(
        visibleDocuments.map(async (document) => {
          const jobStatus = document.id ? await documentService.getTransformationJobStatus(document.id) : null;
          return {
            documentId: document.id,
            name: document.name,
            tenant: document.tenant,
            transactionTypeCode: document.transactionTypeCode || document.type || 'N/A',
            status: jobStatus?.status || document.status || 'Indexed',
            updatedAt: jobStatus?.updatedAt || '',
          };
        })
      );

      setTransactions(results);
      setCurrentPage(1);
    } catch (err) {
      console.error('Unable to load transaction history', err);
      setError('Unable to load transaction history at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (documentId: string) => {
    if (!documentId) return;

    setDeletingId(documentId);
    setError('');

    try {
      await documentService.remove(documentId);
      await loadTransactionHistory();
    } catch (err) {
      console.error('Unable to delete transaction', err);
      setError('Unable to delete this transaction right now.');
    } finally {
      setDeletingId(null);
    }
  };

  const openArtifactModal = async (documentId: string, xmlType: 'edixml' | 'idocxml') => {
    if (!documentId) return;

    setModalLoading(true);
    setModalOpen(true);
    setModalTitle(xmlType === 'edixml' ? 'EDI XML' : 'IDOC XML');
    setModalContent('');

    try {
      const content = await documentService.getTransactionXml(documentId, xmlType);
      setModalContent(content || 'No artifact available yet.');
    } catch (err) {
      console.error('Unable to load artifact', err);
      setModalContent('Unable to load artifact right now.');
    } finally {
      setModalLoading(false);
    }
  };

  const formatXmlContent = (value: string) => {
    const trimmed = value?.trim() || '';
    if (!trimmed) return '';

    try {
      const parser = new DOMParser();
      const document = parser.parseFromString(trimmed, 'application/xml');
      const parserError = document.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid XML payload');
      }

      const escapeXml = (value: string) =>
        value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

      const formatNode = (node: Node, level: number): string => {
        const indent = '  '.repeat(level);
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          return text ? `${indent}${escapeXml(text)}` : '';
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
          return '';
        }

        const element = node as Element;
        const attributes = Array.from(element.attributes)
          .map((attribute) => `${attribute.name}="${escapeXml(attribute.value)}"`)
          .join(' ');
        const openingTag = `<${element.tagName}${attributes ? ` ${attributes}` : ''}>`;
        const closingTag = `</${element.tagName}>`;
        const childNodes = Array.from(element.childNodes).filter((child) => {
          if (child.nodeType === Node.TEXT_NODE) return !!child.textContent?.trim();
          return child.nodeType === Node.ELEMENT_NODE;
        });

        const childElements = childNodes.filter((child): child is Element => child.nodeType === Node.ELEMENT_NODE);
        const textChildren = childNodes.filter((child) => child.nodeType === Node.TEXT_NODE);
        const hasOnlyTextChild = childElements.length === 0 && textChildren.length === 1;

        if (!childNodes.length) {
          return `${indent}${openingTag}${closingTag}`;
        }

        if (hasOnlyTextChild) {
          const textValue = textChildren[0].textContent?.trim() ?? '';
          return `${indent}${openingTag}${escapeXml(textValue)}${closingTag}`;
        }

        const innerContent = childNodes.map((child) => formatNode(child, level + 1)).filter(Boolean).join('\n');
        return `${indent}${openingTag}\n${innerContent}\n${indent}${closingTag}`;
      };

      const root = document.documentElement;
      return root ? formatNode(root, 0) : trimmed;
    } catch {
      return trimmed;
    }
  };

  const handleDownloadArtifact = () => {
    if (!modalContent) return;

    const blob = new Blob([modalContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${modalTitle.toLowerCase().replace(/\s+/g, '-')}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('success') || normalized.includes('complete') || normalized.includes('done')) {
      return 'success';
    }
    if (normalized.includes('fail') || normalized.includes('error')) {
      return 'danger';
    }
    if (normalized.includes('processing') || normalized.includes('pending') || normalized.includes('queued')) {
      return 'warning';
    }
    return 'secondary';
  };

  const formatUpdatedAt = (updatedAt: string) => {
    if (!updatedAt) return '—';
    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2>💳 Transactions</h2>
          <p className="text-muted mb-0">Transaction history from the document transformation pipeline.</p>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={() => void loadTransactionHistory()} disabled={loading}>
          {loading ? (
            <><Spinner animation="border" size="sm" className="me-2" /> Refreshing</>
          ) : '🔄 Refresh'}
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light border-bottom d-flex justify-content-between align-items-center">
          <Card.Title className="mb-0">Transaction History</Card.Title>
          <span className="text-muted small">Showing EDI transformation documents</span>
        </Card.Header>
        <Card.Body>
          {error && <div className="alert alert-danger py-2">{error}</div>}

          <Table hover responsive>
            <thead>
              <tr>
                <th>Document ID</th>
                <th>Name</th>
                <th>Tenant</th>
                <th>Type</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.documentId}>
                    <td className="fw-medium">{tx.documentId}</td>
                    <td>{tx.name}</td>
                    <td>{tx.tenant}</td>
                    <td>{tx.transactionTypeCode}</td>
                    <td>
                      <Badge bg={getStatusColor(tx.status)}>{tx.status}</Badge>
                    </td>
                    <td>{formatUpdatedAt(tx.updatedAt)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => void openArtifactModal(tx.documentId?.trim() || '', 'edixml')}
                      >
                        EDI XML
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                        onClick={() => void openArtifactModal(tx.documentId?.trim() || '', 'idocxml')}
                      >
                        IDOC XML
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => void handleDeleteTransaction(tx.documentId?.trim() || '')}
                        disabled={deletingId === tx.documentId}
                      >
                        {deletingId === tx.documentId ? <Spinner animation="border" size="sm" /> : '🗑 Delete'}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    {loading ? 'Loading transaction history…' : 'No transaction history available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {transactions.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted small">
                Showing {startIndex + 1}-{Math.min(startIndex + pageSize, transactions.length)} of {transactions.length} transactions
              </span>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                  ← Previous
                </Button>
                <span className="align-self-center text-muted small">Page {currentPage} of {totalPages}</span>
                <Button variant="outline-secondary" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
                  Next →
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={modalOpen} onHide={() => setModalOpen(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" /> Loading artifact...
            </div>
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', maxHeight: '60vh', overflow: 'auto' }}>{formatXmlContent(modalContent)}</pre>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={handleDownloadArtifact} disabled={!modalContent || modalLoading}>
            ⬇ Download
          </Button>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Transactions;
