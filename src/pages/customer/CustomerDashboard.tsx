import { Container, Row, Col, Card, Badge } from "react-bootstrap";
import { useContext } from "react";
import { AuthContext } from "../../auth/AuthContext";

const CustomerDashboard = () => {
  const auth = useContext(AuthContext);
  const username = auth?.user?.username || "User";

  const stats = [
    { label: 'My Documents', value: '24', icon: '📄' },
    { label: 'Processed', value: '18', icon: '✓' },
    { label: 'Pending', value: '6', icon: '⏳' },
    { label: 'Failed', value: '0', icon: '❌' },
  ];

  return (
    <div className="min-vh-100 bg-light">
      <Container fluid className="py-4">
        {/* Header */}
        <div className="mb-4">
          <Badge bg="primary" className="mb-2 px-3 py-2">EDI Platform</Badge>
          <h2 className="mb-1">Welcome, {username}</h2>
          <p className="text-muted">AI EDI Platform User Dashboard</p>
        </div>

        {/* Main Content */}
        <main>
          <h4 className="mb-3">Your Activity</h4>
          <Row className="g-3">
            {stats.map((stat) => (
              <Col key={stat.label} xs={12} sm={6} md={4} lg={3}>
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="p-3 text-center">
                    <div style={{ fontSize: '1.5rem' }} className="mb-2">{stat.icon}</div>
                    <div className="fw-bold fs-5">{stat.value}</div>
                    <div className="text-muted small mt-1">{stat.label}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Action Sections */}
          <Row className="g-3 mt-2">
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">📋 Recent Documents</h5>
                  <p className="text-muted">No documents uploaded yet</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">📊 Transformation Status</h5>
                  <p className="text-muted">No transformations in progress</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </main>
      </Container>
    </div>
  );
};

export default CustomerDashboard;
