import { Container, Row, Col, Card } from 'react-bootstrap';
import { useContext } from 'react';
import { AuthContext } from '../../auth/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const auth = useContext(AuthContext);
  const username = auth?.user?.username || 'Admin';

  const stats = [
    { label: 'Total Tenants', value: '12', icon: '🏢', gradient: 'gradient-blue' },
    { label: 'Total Users', value: '85', icon: '👥', gradient: 'gradient-green' },
    { label: 'Total Documents', value: '1,540', icon: '📄', gradient: 'gradient-purple' },
    { label: 'EDI Jobs', value: '5,245', icon: '🔄', gradient: 'gradient-orange' },
    { label: 'Indexed Docs', value: '950', icon: '✓', gradient: 'gradient-teal' },
    { label: 'Failed Jobs', value: '5', icon: '❌', gradient: 'gradient-red' },
    { label: 'Storage Used', value: '42 GB', icon: '💾', gradient: 'gradient-pink' },
    { label: 'Active Users', value: '18', icon: '🟢', gradient: 'gradient-cyan' },
  ];

  const chartData = [
    { title: 'Documents Uploaded', value: '1,540', trend: '+12%' },
    { title: 'EDI Processed', value: '5,245', trend: '+8%' },
    { title: 'Success Rate', value: '99.8%', trend: '+0.2%' },
    { title: 'Storage Usage', value: '42 GB', trend: '+5%' },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="dashboard-title">Dashboard</h2>
        <p className="dashboard-subtitle">Welcome back, <strong>{username}</strong></p>
      </div>

      {/* Stats Grid */}
      <Row className="g-3 mb-4">
        {stats.map((stat) => (
          <Col key={stat.label} xs={12} sm={6} md={4} lg={3}>
            <div className={`stat-card ${stat.gradient}`}>
              <div className="stat-card-content">
                <div className="stat-info">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{stat.value}</div>
                </div>
                <div className="stat-icon">{stat.icon}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Charts Section */}
      <div className="mb-4">
        <h5 className="mb-3">📊 Charts & Analytics</h5>
        <Row className="g-3">
          {chartData.map((chart) => (
            <Col key={chart.title} md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="mb-3">{chart.title}</div>
                  <div className="fs-5 fw-bold mb-2">{chart.value}</div>
                  <div style={{ color: '#28a745', fontSize: '0.9rem' }}>{chart.trend} from last month</div>
                  <div
                    style={{
                      height: '40px',
                      background: 'linear-gradient(to right, #e3f2fd, #1976d2)',
                      borderRadius: '4px',
                      marginTop: '10px',
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Quick Actions */}
      <Row className="g-3">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">📋 Recent Documents</h5>
              <p className="text-muted small mb-2">Guide.pdf - Levi - PDF - v1 - Indexed</p>
              <p className="text-muted small mb-2">spec.pdf - Nike - PDF - v2 - Processing</p>
              <p className="text-muted small">manual.pdf - Puma - PDF - v1 - Indexed</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">🚀 Quick Actions</h5>
              <div className="d-flex flex-column gap-2">
                <button className="btn btn-sm btn-outline-primary">+ Create Tenant</button>
                <button className="btn btn-sm btn-outline-primary">+ Add User</button>
                <button className="btn btn-sm btn-outline-primary">📤 Upload Document</button>
                <button className="btn btn-sm btn-outline-primary">🔄 Transform EDI</button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;