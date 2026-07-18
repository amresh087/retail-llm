import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card } from 'react-bootstrap';
import LanguageSwitcher from '../components/LanguageSwitcher';

/**
 * GUIDE: How to use translations in your components
 * 
 * 1. Import the useTranslation hook:
 *    import { useTranslation } from 'react-i18next';
 * 
 * 2. Call the hook in your component:
 *    const { t } = useTranslation();
 * 
 * 3. Use it in your JSX:
 *    <h1>{t('login.title')}</h1>
 *    <button>{t('common.save')}</button>
 */

const ExamplePage: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>{t('admin.title')}</h1>
            <LanguageSwitcher />
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <Card.Title>{t('navigation.home')}</Card.Title>
            </Card.Header>
            <Card.Body>
              <p>{t('admin.welcome')}</p>
              <small>Current Language: {i18n.language}</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <Card.Title>{t('navigation.shop')}</Card.Title>
            </Card.Header>
            <Card.Body>
              <p>{t('products.addProduct')}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <Card.Title>{t('common.language')}</Card.Title>
        </Card.Header>
        <Card.Body>
          <p>Available translations:</p>
          <ul>
            <li><strong>common.*</strong> - {t('common.language')}, {t('common.logout')}, {t('common.loading')}</li>
            <li><strong>login.*</strong> - {t('login.username')}, {t('login.password')}</li>
            <li><strong>admin.*</strong> - {t('admin.dashboard')}, {t('admin.users')}, {t('admin.products')}</li>
            <li><strong>customer.*</strong> - {t('customer.cart')}, {t('customer.orders')}</li>
            <li><strong>shopkeeper.*</strong> - {t('shopkeeper.inventory')}, {t('shopkeeper.sales')}</li>
            <li><strong>products.*</strong> - {t('products.name')}, {t('products.price')}, {t('products.quantity')}</li>
            <li><strong>cart.*</strong> - {t('cart.empty')}, {t('cart.total')}, {t('cart.checkout')}</li>
            <li><strong>order.*</strong> - {t('order.orderId')}, {t('order.status')}, {t('order.total')}</li>
          </ul>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ExamplePage;
