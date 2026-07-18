import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../auth/AuthContext';
import './ShopkeeperDashboard.css';

const ShopkeeperDashboard = () => {
  const auth = useContext(AuthContext);
  const { t } = useTranslation();
  const username = auth?.user?.username || 'Shopkeeper';

  const menuItems = [
    {
      title: t('admin.products'),
      description: t('admin.products'),
      icon: '📦',
      link: '/shopkeeper/products',
      badge: 'View',
      color: 'primary'
    },
    {
      title: t('shopkeeper.inventory'),
      description: t('shopkeeper.inventory'),
      icon: '📊',
      link: '/shopkeeper/inventory',
      badge: 'Check',
      color: 'info'
    },
    {
      title: 'Billing',
      description: 'Create invoices & payments',
      icon: '💳',
      link: '/shopkeeper/billing',
      badge: 'Create',
      color: 'success'
    },
    {
      title: 'Rewards',
      description: 'Customer loyalty & points',
      icon: '🎁',
      link: '/shopkeeper/rewards',
      badge: 'Rewards',
      color: 'warning'
    }
  ];

  return (
    <Container fluid className="shopkeeper-dashboard-container py-4">

      {/* Header */}
      <div className="header-section mb-4">
        <Row className="align-items-center">
          <Col>
            <Badge bg="dark" className="mb-2 px-3 py-2">
              {t('shopkeeper.store')}
            </Badge>
            <h2 className="header-title">
              {t('shopkeeper.welcome')}, <span>{username}</span>
            </h2>
            <p className="header-subtitle">
              {t('shopkeeper.title')}
            </p>
          </Col>

          <Col className="text-end d-none d-md-block">
            <p className="date-value">
              {new Date().toLocaleDateString('en-IN')}
            </p>
          </Col>
        </Row>
      </div>

      {/* Modules */}
      <div className="menu-section">
        <h5 className="section-title mb-3">Store Management</h5>

        <Row xs={1} md={2} lg={4} className="g-3">
          {menuItems.map((item, index) => (
            <Col key={index}>
              <Link to={item.link} className="text-decoration-none">
                <Card className="menu-card h-100">
                  <Card.Body className="p-3 d-flex flex-column">

                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="menu-icon">{item.icon}</span>
                      <Badge bg={item.color}>{item.badge}</Badge>
                    </div>

                    <Card.Title className="menu-title">
                      {item.title}
                    </Card.Title>

                    <Card.Text className="menu-description">
                      {item.description}
                    </Card.Text>

                    <Button variant="outline-dark" size="sm" className="mt-auto">
                      Open →
                    </Button>

                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

      {/* Footer */}
      <Row className="footer-section mt-4">
        <Col md={12}>
          <div className="footer-content">
            <Row className="text-center">

              <Col md={4}>
                <div className="footer-item">
                  <div className="footer-icon">🏪</div>
                  <div className="footer-label">Store</div>
                  <div className="footer-value">AI EDI Platform</div>
                </div>
              </Col>

              <Col md={4}>
                <div className="footer-item">
                  <div className="footer-icon">👤</div>
                  <div className="footer-label">Account</div>
                  <div className="footer-value">{username}</div>
                </div>
              </Col>

              <Col md={4}>
                <div className="footer-item">
                  <div className="footer-icon">⏰</div>
                  <div className="footer-label">Last Activity</div>
                  <div className="footer-value">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </Col>

            </Row>
          </div>
        </Col>
      </Row>

    </Container>
  );
};

export default ShopkeeperDashboard;