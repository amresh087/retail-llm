import React, { useEffect, useState } from "react";
import { Container, Table, Spinner, Card, Row, Col, Button, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import AdminReportHeader from "../../components/AdminReportHeader";
import { getReport, type ReportResponse } from "../../services/reportingService";
import { mockReportData, useMockData } from "../../services/mockReportData";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const InventoryReportPage: React.FC = () => {
  const { t } = useTranslation();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (useMockData) {
      setReport(mockReportData);
      setLoading(false);
      return;
    }

    getReport()
      .then((res) => {
        console.log("Inventory report data received:", res.data);
        setReport(res.data);
      })
      .catch((err) => {
        console.error("Error fetching inventory report:", err);
        // Handle 401 (token expired) separately
        if (err.response?.status === 401) {
          setError(t('reports.sessionExpiredMessage'));
          localStorage.removeItem("user");
          setTimeout(() => {
            window.location.href = "/login?expired=true";
          }, 2000);
        } else {
          setError(err.message || t('reports.failedToLoadInventoryReport'));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">{t('reports.loadingInventoryReport')}</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <div className="alert alert-danger">
          <h5>❌ {t('reports.errorLoadingInventoryReport')}</h5>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            {t('reports.retry')}
          </Button>
        </div>
      </Container>
    );
  }

  if (!report || !report.inventoryStatus || report.inventoryStatus.length === 0) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning text-center">
          <h5>⚠️ {t('reports.noInventoryDataAvailable')}</h5>
          <p>{t('reports.noInventoryItemsFound')}</p>
        </div>
      </Container>
    );
  }

  // Calculate statistics
  const totalAvailable = report.inventoryStatus.reduce((acc, i) => acc + i.availableQty, 0);
  const totalReserved = report.inventoryStatus.reduce((acc, i) => acc + i.reservedQty, 0);
  const totalStock = totalAvailable + totalReserved;
  const lowStockItems = report.inventoryStatus.filter((i) => i.availableQty < 10).length;
  const outOfStockItems = report.inventoryStatus.filter((i) => i.availableQty === 0).length;

  // Chart data
  const inventoryData = {
    labels: report.inventoryStatus.map((i) => `Product ${i.productId}`),
    datasets: [
      {
        label: t('reports.availableQty'),
        data: report.inventoryStatus.map((i) => i.availableQty),
        backgroundColor: "rgba(75, 192, 192, 0.7)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: t('reports.reservedQty'),
        data: report.inventoryStatus.map((i) => i.reservedQty),
        backgroundColor: "rgba(255, 99, 132, 0.7)",
        borderColor: "rgba(255, 99, 132, 1)",
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
        title={`📦 ${t('reports.inventoryReport')}`}
        description={t('reports.monitorStockLevels')}
      />

      {/* KPI Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-white bg-success">
            <Card.Body>
              <Card.Title className="fs-6">{t('reports.totalStock')}</Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalStock}</Card.Text>
              <small>{t('reports.allItemsInInventory')}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-info">
            <Card.Body>
              <Card.Title className="fs-6">{t('reports.availableQty')}</Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalAvailable}</Card.Text>
              <small>{t('reports.readyToSell')}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-warning">
            <Card.Body>
              <Card.Title className="fs-6">{t('reports.reservedQty')}</Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalReserved}</Card.Text>
              <small>{t('reports.pendingOrders')}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-danger">
            <Card.Body>
              <Card.Title className="fs-6">{t('reports.lowOutOfStock')}</Card.Title>
              <Card.Text className="fs-4 fw-bold">{lowStockItems + outOfStockItems}</Card.Text>
              <small>{t('reports.itemsNeedingAttention')}</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Inventory Chart */}
      <Row className="mb-5">
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <Card.Title className="mb-0">📊 {t('reports.stockLevelsByProduct')}</Card.Title>
            </Card.Header>
            <Card.Body>
              <Bar data={inventoryData} options={chartOptions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Inventory Status Summary */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="bg-light">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <small className="text-muted">{t('reports.inStockItems')}</small>
                  <h4 className="mt-2 mb-0">
                    {report.inventoryStatus.filter((i) => i.availableQty > 10).length}
                  </h4>
                </div>
                <div className="text-success fs-3">✓</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="bg-light">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <small className="text-muted">{t('reports.lowStockItems')}</small>
                  <h4 className="mt-2 mb-0">{lowStockItems}</h4>
                </div>
                <div className="text-warning fs-3">⚠</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="bg-light">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <small className="text-muted">{t('reports.outOfStock')}</small>
                  <h4 className="mt-2 mb-0">{outOfStockItems}</h4>
                </div>
                <div className="text-danger fs-3">✕</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Inventory Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-dark text-white">
          <Card.Title className="mb-0">📋 {t('reports.detailedInventoryStatus')}</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>{t('reports.row')}</th>
                <th>{t('reports.productId')}</th>
                <th>{t('reports.availableQty')}</th>
                <th>{t('reports.reservedQty')}</th>
                <th>{t('reports.total')}</th>
                <th>{t('reports.utilization')}</th>
                <th>{t('reports.status')}</th>
              </tr>
            </thead>
            <tbody>
              {report.inventoryStatus.map((item, index) => {
                const total = item.availableQty + item.reservedQty;
                const utilization = total > 0 ? ((item.reservedQty / total) * 100).toFixed(1) : "0";
                let status, statusBg;

                if (item.availableQty === 0) {
                  status = t('reports.outOfStockStatus');
                  statusBg = "danger";
                } else if (item.availableQty < 10) {
                  status = t('reports.lowStockStatus');
                  statusBg = "warning";
                } else if (item.availableQty > 100) {
                  status = t('reports.wellStockedStatus');
                  statusBg = "success";
                } else {
                  status = t('reports.inStockStatus');
                  statusBg = "info";
                }

                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{item.productId}</strong>
                    </td>
                    <td>{item.availableQty}</td>
                    <td>{item.reservedQty}</td>
                    <td className="fw-bold">{total}</td>
                    <td>{utilization}%</td>
                    <td>
                      <Badge bg={statusBg}>{status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InventoryReportPage;
