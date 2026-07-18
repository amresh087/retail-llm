import { Container, Row, Col, Card, Badge, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../auth/AuthContext';

const EDISettings = () => {
  const auth = useContext(AuthContext);
  const username = auth?.user?.username || 'Admin';

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
                  item === 'EDI' ? 'btn-dark' : 'btn-light text-dark'
                }`}
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <main>
          <h4 className="mb-4">EDI Configuration</h4>

          <Row className="g-3">
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light border-bottom">
                  <Card.Title className="mb-0">EDI Standards</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Primary EDI Standard</Form.Label>
                      <Form.Select defaultValue="X12">
                        <option value="X12">X12</option>
                        <option value="EDIFACT">EDIFACT</option>
                        <option value="JSON">JSON</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Secondary Standard (Optional)</Form.Label>
                      <Form.Select defaultValue="">
                        <option value="">None</option>
                        <option value="EDIFACT">EDIFACT</option>
                        <option value="JSON">JSON</option>
                      </Form.Select>
                    </Form.Group>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light border-bottom">
                  <Card.Title className="mb-0">Processing Settings</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Enable AI Processing"
                        defaultChecked
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Enable Data Validation"
                        defaultChecked
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Enable Archive"
                        defaultChecked
                      />
                    </Form.Group>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-3 mt-2">
            <Col>
              <Button variant="primary">Save Settings</Button>
              <Button variant="secondary" className="ms-2">Reset to Defaults</Button>
            </Col>
          </Row>
        </main>
      </Container>
    </div>
  );
};

export default EDISettings;
