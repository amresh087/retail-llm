import React, { useEffect, useState } from "react";
import { Container, Table, Spinner, Card, Row, Col, Button, ProgressBar } from "react-bootstrap";
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
import { Bar } from "react-chartjs-2";
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

const ProductReportPage: React.FC = () => {
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
        console.log("Product report data received:", res.data);
        setReport(res.data);
      })
      .catch((err) => {
        console.error("Error fetching product report:", err);
        // Handle 401 (token expired) separately
        if (err.response?.status === 401) {
          setError("Your session has expired. Please login again.");
          localStorage.removeItem("user");
          setTimeout(() => {
            window.location.href = "/login?expired=true";
          }, 2000);
        } else {
          setError(err.message || "Failed to load product report");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading product report...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <div className="alert alert-danger">
          <h5>❌ Error Loading Product Report</h5>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Retry
          </Button>
        </div>
      </Container>
    );
  }

  if (!report || !report.productReports || report.productReports.length === 0) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning text-center">
          <h5>⚠️ No Product Data Available</h5>
          <p>No products found in the system.</p>
        </div>
      </Container>
    );
  }

  // Calculate product statistics
  const totalProducts = report.productReports.length;
  const topProduct = report.productReports.reduce((prev, current) =>
    (prev.totalRevenue ?? 0) > (current.totalRevenue ?? 0) ? prev : current
  );
  const bestSellerByUnits = report.productReports.reduce((prev, current) =>
    (prev.totalPurchased ?? 0) > (current.totalPurchased ?? 0) ? prev : current
  );

  // Chart data - Product Revenue Comparison
  const productRevenueData = {
    labels: report.productReports.map((p) => `Product ${p.productId}`),
    datasets: [
      {
        label: "Revenue (₹)",
        data: report.productReports.map((p) => p.totalRevenue || 0),
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Chart data - Product Volume Comparison
  const productVolumeData = {
    labels: report.productReports.map((p) => `Product ${p.productId}`),
    datasets: [
      {
        label: "Units Sold",
        data: report.productReports.map((p) => p.totalPurchased || 0),
        backgroundColor: "rgba(75, 192, 192, 0.7)",
        borderColor: "rgba(75, 192, 192, 1)",
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
        title="🏷️ Product Report"
        description="Analyze product performance and metrics"
      />

      {/* KPI Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-white bg-primary">
            <Card.Body>
              <Card.Title className="fs-6">Total Products</Card.Title>
              <Card.Text className="fs-4 fw-bold">{totalProducts}</Card.Text>
              <small>Products in catalog</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-success">
            <Card.Body>
              <Card.Title className="fs-6">Top Revenue</Card.Title>
              <Card.Text className="fs-4 fw-bold">Product {topProduct.productId}</Card.Text>
              <small>₹{(topProduct.totalRevenue ?? 0).toFixed(2)}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-info">
            <Card.Body>
              <Card.Title className="fs-6">Best Seller</Card.Title>
              <Card.Text className="fs-4 fw-bold">Product {bestSellerByUnits.productId}</Card.Text>
              <small>{bestSellerByUnits.totalPurchased ?? 0} units</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-warning">
            <Card.Body>
              <Card.Title className="fs-6">Avg Price</Card.Title>
              <Card.Text className="fs-4 fw-bold">
                ₹
                {report.totalRevenue / report.productReports.reduce((acc, p) => acc + (p.totalPurchased || 0), 0)}
              </Card.Text>
              <small>Per unit average</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-5">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <Card.Title className="mb-0">💰 Revenue by Product</Card.Title>
            </Card.Header>
            <Card.Body>
              <Bar data={productRevenueData} options={chartOptions} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <Card.Title className="mb-0">📦 Units Sold by Product</Card.Title>
            </Card.Header>
            <Card.Body>
              <Bar data={productVolumeData} options={chartOptions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Product Performance Table */}
      <Card className="shadow-sm mb-5">
        <Card.Header className="bg-dark text-white">
          <Card.Title className="mb-0">📋 Product Performance Metrics</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Product ID</th>
                <th>Units Sold</th>
                <th>Revenue (₹)</th>
                <th>Avg Price</th>
                <th>Revenue Share %</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {report.productReports.map((product, index) => {
                const avgPrice =
                  product.totalPurchased && product.totalRevenue
                    ? product.totalRevenue / product.totalPurchased
                    : 0;
                const revenueShare = (((product.totalRevenue ?? 0) / report.totalRevenue) * 100).toFixed(1);
                const performance = parseInt(revenueShare) > 15 ? "High" : parseInt(revenueShare) > 5 ? "Medium" : "Low";

                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{product.productId}</strong>
                    </td>
                    <td>{product.totalPurchased ?? 0}</td>
                    <td className="fw-bold">₹{(product.totalRevenue ?? 0).toFixed(2)}</td>
                    <td>₹{avgPrice.toFixed(2)}</td>
                    <td>
                      <ProgressBar
                        now={parseInt(revenueShare)}
                        label={`${revenueShare}%`}
                        variant={parseInt(revenueShare) > 15 ? "success" : parseInt(revenueShare) > 5 ? "info" : "warning"}
                      />
                    </td>
                    <td>
                      <span
                        className={`badge bg-${
                          performance === "High" ? "success" : performance === "Medium" ? "info" : "warning"
                        }`}
                      >
                        {performance}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Product Ranking */}
      <Row>
        <Col md={6} className="mb-3">
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <Card.Title className="mb-0">🏆 Top 5 by Revenue</Card.Title>
            </Card.Header>
            <Card.Body>
              {report.productReports
                .sort((a, b) => (b.totalRevenue ?? 0) - (a.totalRevenue ?? 0))
                .slice(0, 5)
                .map((product, index) => (
                  <div key={index} className="mb-3 pb-3 border-bottom">
                    <div className="d-flex justify-content-between">
                      <span>
                        <strong>Product {product.productId}</strong>
                      </span>
                      <span>₹{(product.totalRevenue ?? 0).toFixed(2)}</span>
                    </div>
                    <ProgressBar now={(((product.totalRevenue ?? 0) / report.totalRevenue) * 100)} className="mt-2" />
                  </div>
                ))}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-3">
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <Card.Title className="mb-0">⭐ Top 5 by Units Sold</Card.Title>
            </Card.Header>
            <Card.Body>
              {report.productReports
                .sort((a, b) => (b.totalPurchased ?? 0) - (a.totalPurchased ?? 0))
                .slice(0, 5)
                .map((product, index) => (
                  <div key={index} className="mb-3 pb-3 border-bottom">
                    <div className="d-flex justify-content-between">
                      <span>
                        <strong>Product {product.productId}</strong>
                      </span>
                      <span>{product.totalPurchased ?? 0} units</span>
                    </div>
                    <ProgressBar
                      now={parseFloat(
                        (
                          ((product.totalPurchased ?? 0) /
                            report.productReports.reduce((acc, p) => acc + (p.totalPurchased ?? 0), 0)) *
                          100
                        ).toFixed(1)
                      )}
                      className="mt-2"
                      variant="info"
                    />
                  </div>
                ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductReportPage;
