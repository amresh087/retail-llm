import { useEffect, useState } from 'react';
import { Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
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
              {transactions.length > 0 ? (
                transactions.map((tx) => (
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
                      <Button variant="outline-primary" size="sm" className="me-2">View</Button>
                      <Button variant="outline-secondary" size="sm" className="me-2">📥 XML</Button>
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
        </Card.Body>
      </Card>
    </div>
  );
};

export default Transactions;
