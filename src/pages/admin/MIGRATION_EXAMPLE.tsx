/**
 * EXAMPLE: How to Update Pages for i18n
 * 
 * This file shows a refactored version of a dashboard component using translations.
 * Use this as a template when updating other pages.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const ExampleAdminDashboard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Container fluid className="py-4">
      {/* Header with Language Switcher */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>{t('admin.welcome')}</h1>
            <LanguageSwitcher />
          </div>
        </Col>
      </Row>

      {/* Dashboard Cards */}
      <Row className="g-4 mb-4">
        <Col md={6} lg={3}>
          <Card>
            <Card.Header>
              <Card.Title>{t('admin.users')}</Card.Title>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">{t('admin.title')}</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card>
            <Card.Header>
              <Card.Title>{t('admin.products')}</Card.Title>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">{t('navigation.shop')}</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card>
            <Card.Header>
              <Card.Title>{t('admin.categories')}</Card.Title>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">{t('categories.title')}</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card>
            <Card.Header>
              <Card.Title>{t('admin.orders')}</Card.Title>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">{t('order.orderId')}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>
              <Card.Title>{t('admin.settings')}</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-2">
                <Button variant="primary">
                  {t('common.save')}
                </Button>
                <Button variant="secondary">
                  {t('common.cancel')}
                </Button>
                <Button variant="danger">
                  {t('common.delete')}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ExampleAdminDashboard;

/**
 * MIGRATION STEPS:
 * 
 * 1. Add imports at the top:
 *    import { useTranslation } from 'react-i18next';
 *    import LanguageSwitcher from '../../components/LanguageSwitcher';
 * 
 * 2. Call useTranslation hook:
 *    const { t } = useTranslation();
 * 
 * 3. Replace hardcoded strings:
 *    BEFORE: <h1>Admin Dashboard</h1>
 *    AFTER:  <h1>{t('admin.title')}</h1>
 * 
 * 4. Add LanguageSwitcher to your header/navbar:
 *    <LanguageSwitcher />
 * 
 * 5. Update all text content:
 *    - Button labels: {t('common.save')}
 *    - Card headers: {t('admin.users')}
 *    - Placeholders: placeholder={t('products.name')}
 *    - Error messages: t('validation.required')
 * 
 * 6. Test in both languages to ensure layout works
 */
