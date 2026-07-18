import React, { useEffect, useState } from "react";
import { Container, Table, Spinner, Card, Row, Col, Button, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import AdminReportHeader from "../../components/AdminReportHeader";
import { getReport, type ReportResponse } from "../../services/reportingService";
import { mockReportData, useMockData } from "../../services/mockReportData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalesReportPage: React.FC = () => {
  const { t } = useTranslation();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");

  useEffect(() => {
    if (useMockData) {
      setReport(mockReportData);
      setLoading(false);
      return;
    }

    getReport()
      .then((res) => {
        console.log("Sales report data received:", res.data);
        setReport(res.data);
      })
      .catch((err) => {
        console.error("Error fetching sales report:", err);
        setError(err.message || t('reports.failedToLoadSalesReport'));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">{t('reports.loadingSalesReport')}</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <div className="alert alert-danger">
          <h5>❌ {t('reports.errorLoadingSalesReport')}</h5>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            {t('reports.retry')}
          </Button>
        </div>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning text-center">
          <h5>⚠️ {t('reports.noSalesDataAvailable')}</h5>
          <p>{t('reports.noSalesRecorded')}</p>
        </div>
      </Container>
    );
  }

  const totalSales = report.productReports.length;
  const totalUnits = report.productReports.reduce((acc, p) => acc + (p.totalPurchased || 0), 0);
  const avgSaleValue = totalSales > 0 ? report.totalRevenue / totalSales : 0;

  // Sales trend data
  const salesTrendData = {
    labels: [t('reports.week1'), t('reports.week2'), t('reports.week3'), t('reports.week4')],
    datasets: [
      {
        label: t('reports.sales') + " (₹)",
        data: [
          report.totalRevenue * 0.2,
          report.totalRevenue * 0.25,
          report.totalRevenue * 0.3,
          report.totalRevenue * 0.25,
        ],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Product sales comparison
  const productSalesData = {
    labels: report.productReports.map((p) => `Product ${p.productId}`),
    datasets: [
      {
        label: t('reports.sales') + " (₹)",
        data: report.productReports.map((p) => p.totalRevenue || 0),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <Container fluid className="mt-4 p-4">
      <AdminReportHeader
        title={`📈 ${t('reports.salesReport')}`}
        description={t('reports.trackSalesPerformance')}
      />

      {/* KPI Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-white bg-success">
            <Card.Body>
              <Card.Title className="fs-6">{t('reports.totalRevenue')}</Card.Title>
              <Card.Text className="fs-4 fw-bold">₹{report.totalRevenue.toFixed(2)}</Card.Text>
              <small>{t('reports.allSalesCombined')}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-primary">
            <Card.Body>
              <Card.Title className="fs-6">{t('reports.totalUnitsSold')}</Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalUnits}</Card.Text>
              <small>{t('reports.totalItemsSold')}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-info">
            <Card.Body>
              <Card.Title className="fs-6">{t('reports.avgSaleValue')}</Card.Title>
              <Card.Text className="fs-4 fw-bold">₹{avgSaleValue.toFixed(2)}</Card.Text>
              <small>{t('reports.averagePerProduct')}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-warning">
            <Card.Body>
              <Card.Title className="fs-6">{t('reports.totalProductsSold')}</Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalSales}</Card.Text>
              <small>{t('reports.productTypesSold')}</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Period Selection */}
      <Row className="mb-4">
        <Col md={3}>
          <Form.Group>
            <Form.Label className="fw-bold">{t('reports.viewPeriod')}</Form.Label>
            <Form.Select value={period} onChange={(e) => setPeriod(e.target.value as any)}>
              <option value="daily">{t('reports.daily')}</option>
              <option value="weekly">{t('reports.weekly')}</option>
              <option value="monthly">{t('reports.monthly')}</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-5">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <Card.Title className="mb-0">📊 {t('reports.salesTrend')}</Card.Title>
            </Card.Header>
            <Card.Body>
              <Line data={salesTrendData} options={chartOptions} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <Card.Title className="mb-0">🏆 {t('reports.salesByProduct')}</Card.Title>
            </Card.Header>
            <Card.Body>
              <Bar data={productSalesData} options={chartOptions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-dark text-white">
          <Card.Title className="mb-0">📋 {t('reports.salesDetails')}</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>{t('reports.row')}</th>
                <th>{t('reports.productId')}</th>
                <th>{t('reports.unitsSold')}</th>
                <th>{t('reports.sales')} (₹)</th>
                <th>{t('reports.avgPricePerUnit')}</th>
                <th>{t('reports.percentOfTotalSales')}</th>
              </tr>
            </thead>
            <tbody>
              {report.productReports.map((product, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{product.productId}</strong>
                  </td>
                  <td>{product.totalPurchased ?? 0}</td>
                  <td className="fw-bold">₹{(product.totalRevenue ?? 0).toFixed(2)}</td>
                  <td>
                    ₹
                    {product.totalPurchased && product.totalRevenue
                      ? (product.totalRevenue / product.totalPurchased).toFixed(2)
                      : "0.00"}
                  </td>
                  <td>
                    {(
                      ((product.totalRevenue ?? 0) / report.totalRevenue) *
                      100
                    ).toFixed(2)}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SalesReportPage;
