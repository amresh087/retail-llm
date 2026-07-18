import { Container, Row, Col, Card, Badge, Table, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../auth/AuthContext';

const LogsList = () => {
  const auth = useContext(AuthContext);
  const username = auth?.user?.username || 'Admin';

  const logs = [
    { id: 1, timestamp: '2026-07-17 16:45:23', level: 'INFO', source: 'EDI-Processor', message: 'Document INV-2026-045 processed successfully' },
    { id: 2, timestamp: '2026-07-17 16:42:10', level: 'WARNING', source: 'Validator', message: 'Validation warning: Missing optional field in ASN' },
    { id: 3, timestamp: '2026-07-17 16:40:05', level: 'INFO', source: 'JobScheduler', message: 'Job ID 3 started processing' },
    { id: 4, timestamp: '2026-07-17 16:38:22', level: 'ERROR', source: 'Database', message: 'Connection timeout to backup database' },
    { id: 5, timestamp: '2026-07-17 16:35:45', level: 'INFO', source: 'Auth-Service', message: 'User amresh logged in successfully' },
  ];

  const navItems = ['Dashboard', 'Tenants', 'Users', 'Documents', 'EDI', 'Jobs', 'Logs'];

  const getNavLink = (item: string) => {
    switch (item) {
      case 'Dashboard':
        return '/admin';
      case 'Tenants':
        return '/admin/tenants';
      case 'Users':
        return '/admin/users';
      case 'Documents':
        return '/admin/documents';
      case 'EDI':
        return '/admin/edi';
      case 'Jobs':
        return '/admin/jobs';
      case 'Logs':
        return '/admin/logs';
      default:
        return '/admin';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'danger';
      case 'WARNING':
        return 'warning';
      case 'INFO':
        return 'info';
      case 'DEBUG':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <Container fluid className="py-4">
        {/* Header */}
        <div className="mb-4">
          <Badge bg="primary" className="mb-2 px-3 py-2">EDI Platform</Badge>
          <h2 className="mb-1">Welcome, {username}</h2>
          <p className="text-muted">AI EDI Platform Operations Center</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-4">
          <nav className="nav gap-2 flex-wrap">
            {navItems.map((item) => (
              <Link
                key={item}
                to={getNavLink(item)}
                className={`btn btn-sm rounded-pill ${
                  item === 'Logs' ? 'btn-dark' : 'btn-light text-dark'
                }`}
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <main>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>System Logs</h4>
            <Button variant="outline-secondary" size="sm">🔄 Refresh</Button>
          </div>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small">Log Level</Form.Label>
                    <Form.Select size="sm" defaultValue="">
                      <option value="">All Levels</option>
                      <option value="ERROR">ERROR</option>
                      <option value="WARNING">WARNING</option>
                      <option value="INFO">INFO</option>
                      <option value="DEBUG">DEBUG</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small">Source</Form.Label>
                    <Form.Select size="sm" defaultValue="">
                      <option value="">All Sources</option>
                      <option value="EDI-Processor">EDI-Processor</option>
                      <option value="Validator">Validator</option>
                      <option value="JobScheduler">JobScheduler</option>
                      <option value="Database">Database</option>
                      <option value="Auth-Service">Auth-Service</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Table className="mb-0 small">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Level</th>
                    <th>Source</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="small font-monospace">{log.timestamp}</td>
                      <td>
                        <Badge bg={getLevelColor(log.level)}>
                          {log.level}
                        </Badge>
                      </td>
                      <td className="fw-medium">{log.source}</td>
                      <td>{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </main>
      </Container>
    </div>
  );
};

export default LogsList;
