import { Container, Row, Col, Card, Badge, Table, Button, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../auth/AuthContext';

const JobsList = () => {
  const auth = useContext(AuthContext);
  const username = auth?.user?.username || 'Admin';

  const jobs = [
    { id: 1, name: 'Process PO-2026-001', type: 'EDI Processing', tenant: 'Acme Corp', progress: 100, status: 'Completed', startTime: '2026-07-15 10:30' },
    { id: 2, name: 'Validate INV-2026-045', type: 'Data Validation', tenant: 'Global Trade Inc', progress: 45, status: 'Processing', startTime: '2026-07-17 14:20' },
    { id: 3, name: 'Transform ASN-2026-089', type: 'Data Transform', tenant: 'Acme Corp', progress: 75, status: 'Processing', startTime: '2026-07-17 15:10' },
    { id: 4, name: 'Archive Old Docs', type: 'System Job', tenant: 'System', progress: 30, status: 'Queued', startTime: '2026-07-17 16:00' },
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Processing':
        return 'warning';
      case 'Queued':
        return 'secondary';
      case 'Failed':
        return 'danger';
      default:
        return 'info';
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
                  item === 'Jobs' ? 'btn-dark' : 'btn-light text-dark'
                }`}
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <main>
          <h4 className="mb-4">Processing Jobs</h4>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Table className="mb-0">
                <thead>
                  <tr>
                    <th>Job Name</th>
                    <th>Type</th>
                    <th>Tenant</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="fw-medium">⚙️ {job.name}</td>
                      <td>{job.type}</td>
                      <td>{job.tenant}</td>
                      <td>
                        <ProgressBar
                          now={job.progress}
                          label={`${job.progress}%`}
                          style={{ minWidth: '120px' }}
                          className="small"
                          variant={job.progress === 100 ? 'success' : 'info'}
                        />
                      </td>
                      <td>
                        <Badge bg={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </td>
                      <td className="small">{job.startTime}</td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-2">Details</Button>
                        {job.status === 'Processing' && <Button variant="outline-danger" size="sm">Cancel</Button>}
                      </td>
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

export default JobsList;
