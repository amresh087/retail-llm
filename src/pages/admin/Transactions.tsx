import { Card, Table, Button, Badge } from 'react-bootstrap';

const Transactions = () => {
  const transactions = [
    { id: 'PO123', tenant: 'Levi', status: 'Success', time: '2.1 sec', type: '850' },
    { id: 'PO124', tenant: 'Nike', status: 'Success', time: '1.8 sec', type: '850' },
    { id: 'ASN456', tenant: 'Levi', status: 'Failed', time: '3.2 sec', type: '856' },
    { id: 'INV789', tenant: 'Puma', status: 'Success', time: '2.5 sec', type: '810' },
    { id: 'ACK321', tenant: 'Nike', status: 'Success', time: '1.5 sec', type: '855' },
  ];

  const getStatusColor = (status: string) => {
    return status === 'Success' ? 'success' : 'danger';
  };

  return (
    <div>
      <h2 className="mb-4">💳 Transactions</h2>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light border-bottom d-flex justify-content-between align-items-center">
          <Card.Title className="mb-0">Transaction History</Card.Title>
          <Button variant="outline-secondary" size="sm">🔄 Refresh</Button>
        </Card.Header>
        <Card.Body>
          <Table hover>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Tenant</th>
                <th>Type</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="fw-medium">{tx.id}</td>
                  <td>{tx.tenant}</td>
                  <td>{tx.type}</td>
                  <td>
                    <Badge bg={getStatusColor(tx.status)}>
                      {tx.status}
                    </Badge>
                  </td>
                  <td>{tx.time}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" className="me-2">
                      View
                    </Button>
                    <Button variant="outline-secondary" size="sm">
                      📥 XML
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Transactions;
