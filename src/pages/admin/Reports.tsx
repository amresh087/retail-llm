import React, { useEffect, useState } from "react";
import { Container, Table, Spinner, Card, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminHeader from "../../components/AdminHeader";
import { getReport, type ReportResponse } from "../../services/reportingService";
import { mockReportData, useMockData } from "../../services/mockReportData";

const ReportPage: React.FC = () => {
  const { t } = useTranslation();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchWithRetry = async (attempts = 3, delayMs = 1000) => {
      try {
        // If developer wants mock data, use it immediately
        if (useMockData) {
          if (!cancelled) setReport(mockReportData as ReportResponse);
          return;
        }

        const res = await getReport();

        // If backend returned no data, fall back to mock if available
        if (!res?.data || Object.keys(res.data).length === 0) {
          console.warn('Reports: backend returned empty data — falling back to mock data');
          if (!cancelled) setReport(mockReportData as ReportResponse);
          return;
        }

        if (!cancelled) setReport(res.data);
      } catch (err: any) {
        console.error("Error fetching report:", err);
        if (err.response?.status === 401 && attempts > 0) {
          // Wait a bit to allow AuthContext to perform a silent refresh,
          // then retry the request.
          await new Promise((r) => setTimeout(r, delayMs));
          return fetchWithRetry(attempts - 1, delayMs * 1.5);
        }

        // On other errors, fall back to mock data if enabled, else show error
        if (useMockData) {
          if (!cancelled) setReport(mockReportData as ReportResponse);
        } else {
          if (!cancelled) setError(err.message || t('reports.viewInventoryAndSales'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchWithRetry();

    return () => { cancelled = true; };
  }, []);

  if (loading)
    return <div className="text-center mt-5"><Spinner animation="border" /> {t('reports.loadingReport')}</div>;

  if (error)
    return <div className="alert alert-danger mt-5 text-center"><h5>{t('reports.sessionExpired')}</h5><p>{error}</p></div>;

  if (!report)
    return <div className="alert alert-danger mt-5 text-center">{t('reports.noReportData')}</div>;

  return (
    <Container className="mt-4">
      <AdminHeader 
        title={t('reports.reportsAndAnalytics')} 
        description={t('reports.viewInventoryAndSales')}
      />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📊 {t('reports.inventoryAndSalesReport')}</h2>
        <Button 
          variant="primary" 
          onClick={() => navigate('/admin/detailed-reports')}
        >
          📈 {t('reports.viewDetailedReports')}
        </Button>
      </div>

      {/* Report Navigation Cards */}
      <Row className="mb-5">
        <Col md={6} lg={3} className="mb-3">
          <Card 
            className="h-100 cursor-pointer" 
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/admin/sales-report')}
          >
            <Card.Body className="text-center">
              <div className="fs-1 mb-3">📈</div>
              <Card.Title>{t('reports.salesReport')}</Card.Title>
              <Card.Text className="text-muted small">
                {t('reports.trackSalesPerformance')}
              </Card.Text>
              <Button variant="outline-primary" size="sm">{t('reports.viewDetails')}</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card 
            className="h-100 cursor-pointer"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/admin/inventory-report')}
          >
            <Card.Body className="text-center">
              <div className="fs-1 mb-3">📦</div>
              <Card.Title>{t('reports.inventoryReport')}</Card.Title>
              <Card.Text className="text-muted small">
                {t('reports.monitorsStockLevels')}
              </Card.Text>
              <Button variant="outline-primary" size="sm">{t('reports.viewDetails')}</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card 
            className="h-100 cursor-pointer"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/admin/product-report')}
          >
            <Card.Body className="text-center">
              <div className="fs-1 mb-3">🏷️</div>
              <Card.Title>{t('reports.productReport')}</Card.Title>
              <Card.Text className="text-muted small">
                {t('reports.analyzeProductPerformance')}
              </Card.Text>
              <Button variant="outline-primary" size="sm">{t('reports.viewDetails')}</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card 
            className="h-100 cursor-pointer"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/admin/billing-report')}
          >
            <Card.Body className="text-center">
              <div className="fs-1 mb-3">💳</div>
              <Card.Title>{t('reports.billingReport')}</Card.Title>
              <Card.Text className="text-muted small">
                {t('reports.trackRevenueAndTax')}
              </Card.Text>
              <Button variant="outline-primary" size="sm">{t('reports.viewDetails')}</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Totals */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="text-white bg-primary mb-3">
            <Card.Body>
              <Card.Title>{t('reports.totalRevenue')}</Card.Title>
              <Card.Text>₹{report.totalRevenue.toFixed(2)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="text-white bg-success mb-3">
            <Card.Body>
              <Card.Title>{t('reports.totalTax')}</Card.Title>
              <Card.Text>₹{report.totalTax.toFixed(2)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Inventory Status Table */}
      <h4 className="mb-3">{t('reports.inventoryStatus')}</h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>{t('reports.productId')}</th>
            <th>{t('reports.availableQuantity')}</th>
            <th>{t('reports.reservedQuantity')}</th>
          </tr>
        </thead>
        <tbody>
          {report.inventoryStatus.map((item) => (
            <tr key={item.productId}>
              <td>{item.productId}</td>
              <td>{item.availableQty}</td>
              <td>{item.reservedQty}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Product Reports Table */}
      <h4 className="mb-3 mt-4">{t('reports.productReports')}</h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>{t('reports.productId')}</th>
            <th>{t('reports.totalPurchased')}</th>
            <th>{t('reports.totalRevenue')}</th>
          </tr>
        </thead>
        <tbody>
          {report.productReports.map((product, index) => (
            <tr key={index}>
              <td>{product.productId}</td>
              <td>{product.totalPurchased ?? "0"}</td>
              <td>${product.totalRevenue?.toFixed(2) ?? "0.00"}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default ReportPage;
