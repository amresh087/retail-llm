import React, { useEffect, useState } from "react";
import {
  Container,
  Table,
  Spinner,
  Card,
  Row,
  Col,
  ButtonGroup,
  Button,
  Form,
} from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import AdminReportHeader from "../../components/AdminReportHeader";
import { getReport, type ReportResponse } from "../../services/reportingService";
import { mockReportData, useMockData } from "../../services/mockReportData";
import "./DetailedReport.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DetailedReportPage: React.FC = () => {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"charts" | "tables">("charts");
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    if (useMockData) {
      console.log("Using mock data for testing");
      setReport(mockReportData);
      setLoading(false);
      return;
    }

    getReport()
      .then((res) => {
        console.log("Report data received:", res.data);
        setReport(res.data);
      })
      .catch((err) => {
        console.error("Error fetching report:", err);
        // Handle 401 (token expired) separately
        if (err.response?.status === 401) {
          setError("Your session has expired. Please login again.");
          localStorage.removeItem("user");
          setTimeout(() => {
            window.location.href = "/login?expired=true";
          }, 2000);
        } else {
          setError(err.message || "Failed to load report");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" /> 
        <p className="mt-3">Loading detailed report...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <div className="alert alert-danger mt-5">
          <h5>❌ Error Loading Report</h5>
          <p>{error}</p>
          <p className="text-muted small">Make sure the Reporting Service API is running on the correct port.</p>
          <Button onClick={() => window.location.reload()} variant="primary" className="mt-3">
            Retry
          </Button>
        </div>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning mt-5 text-center">
          <h5>⚠️ No Report Data Available</h5>
          <p>The reporting API may not have returned data yet.</p>
          <p>Make sure the backend is running and has data to report.</p>
          <Button onClick={() => window.location.reload()} variant="primary" className="mt-3">
            Retry
          </Button>
        </div>
      </Container>
    );
  }

  // Handle empty data
  if (!report.productReports || report.productReports.length === 0) {
    return (
      <Container className="mt-5">
        <div className="alert alert-info mt-5 text-center">
          <h5>📊 No Product Data Available</h5>
          <p>There are no products or transactions to report yet.</p>
          <Button onClick={() => window.location.reload()} variant="primary" className="mt-3">
            Refresh
          </Button>
        </div>
      </Container>
    );
  }

  // Data preparation for charts
  const productNames = report.productReports?.map((p) =>
    `Product ${p.productId}`
  ) || [];
  const revenuData = report.productReports?.map((p) => p.totalRevenue || 0) || [];
  const purchasedData = report.productReports?.map((p) => p.totalPurchased || 0) || [];

  const inventoryProductIds = report.inventoryStatus?.map((i) =>
    `Product ${i.productId}`
  ) || [];
  const availableQtyData = report.inventoryStatus?.map((i) => i.availableQty) || [];
  const reservedQtyData = report.inventoryStatus?.map((i) => i.reservedQty) || [];

  // Chart configurations
  const revenueChartData = {
    labels: productNames,
    datasets: [
      {
        label: "Total Revenue (₹)",
        data: revenuData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const purchaseChartData = {
    labels: productNames,
    datasets: [
      {
        label: "Total Purchased (Units)",
        data: purchasedData,
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

  const inventoryChartData = {
    labels: inventoryProductIds,
    datasets: [
      {
        label: "Available Quantity",
        data: availableQtyData,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "Reserved Quantity",
        data: reservedQtyData,
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  const totalRevenueVsTaxData = {
    labels: ["Revenue", "Tax"],
    datasets: [
      {
        data: [report.totalRevenue, report.totalTax],
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
        ],
        borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <Container fluid className="mt-4 p-4 report-container">
      <AdminReportHeader
        title="📊 Detailed Reports & Analytics"
        description="Track comprehensive business metrics with visual analytics"
      />

      {/* KPI Cards */}
      <Row className="mb-5">
        <Col md={3} className="mb-3">
          <Card className="text-white bg-primary h-100 kpi-card">
            <Card.Body>
              <Card.Title className="fs-6">Total Revenue</Card.Title>
              <Card.Text className="kpi-value">
                ₹{report.totalRevenue.toFixed(2)}
              </Card.Text>
              <small className="kpi-label">Cumulative sales revenue</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-success h-100 kpi-card">
            <Card.Body>
              <Card.Title className="fs-6">Total Tax</Card.Title>
              <Card.Text className="kpi-value">
                ₹{report.totalTax.toFixed(2)}
              </Card.Text>
              <small className="kpi-label">Tax collected</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-info h-100 kpi-card">
            <Card.Body>
              <Card.Title className="fs-6">Total Products</Card.Title>
              <Card.Text className="kpi-value">
                {report.productReports.length}
              </Card.Text>
              <small className="kpi-label">Products tracked</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-warning h-100 kpi-card">
            <Card.Body>
              <Card.Title className="fs-6">Total Inventory Items</Card.Title>
              <Card.Text className="kpi-value">
                {report.inventoryStatus.length}
              </Card.Text>
              <small className="kpi-label">SKUs in system</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* View Options */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label className="fw-bold">Date Range</Form.Label>
            <Form.Select
              value={dateRange}
              onChange={(e) =>
                setDateRange(e.target.value as "week" | "month" | "year")
              }
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label className="fw-bold">View Type</Form.Label>
            <ButtonGroup className="w-100">
              <Button
                variant={viewType === "charts" ? "primary" : "outline-primary"}
                onClick={() => setViewType("charts")}
              >
                📊 Charts
              </Button>
              <Button
                variant={viewType === "tables" ? "primary" : "outline-primary"}
                onClick={() => setViewType("tables")}
              >
                📋 Tables
              </Button>
            </ButtonGroup>
          </Form.Group>
        </Col>
      </Row>

      {/* Charts View */}
      {viewType === "charts" && (
        <>
          {/* Revenue Trend */}
          <Row className="mb-5">
            <Col md={6}>
              <Card className="shadow-sm chart-card">
                <Card.Header className="bg-primary text-white">
                  <Card.Title className="mb-0">📈 Revenue Trend</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Line data={revenueChartData} options={chartOptions} />
                </Card.Body>
              </Card>
            </Col>

            {/* Revenue vs Tax Pie Chart */}
            <Col md={6}>
              <Card className="shadow-sm chart-card">
                <Card.Header className="bg-success text-white">
                  <Card.Title className="mb-0">
                    💰 Revenue vs Tax Distribution
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <Pie data={totalRevenueVsTaxData} options={pieOptions} />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Purchase Analysis */}
          <Row className="mb-5">
            <Col md={6}>
              <Card className="shadow-sm chart-card">
                <Card.Header className="bg-info text-white">
                  <Card.Title className="mb-0">🛍️ Purchase Volume by Product</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Bar data={purchaseChartData} options={chartOptions} />
                </Card.Body>
              </Card>
            </Col>

            {/* Inventory Status */}
            <Col md={6}>
              <Card className="shadow-sm chart-card">
                <Card.Header className="bg-warning text-dark">
                  <Card.Title className="mb-0">📦 Inventory Status</Card.Title>
                </Card.Header>
                <Card.Body>
                  <Bar data={inventoryChartData} options={chartOptions} />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Detailed Breakdown */}
          <Row>
            <Col md={6}>
              <Card className="shadow-sm chart-card">
                <Card.Header className="bg-dark text-white">
                  <Card.Title className="mb-0">
                    📊 Purchase Distribution
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <Doughnut data={purchaseChartData} options={pieOptions} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="shadow-sm chart-card">
                <Card.Header className="bg-dark text-white">
                  <Card.Title className="mb-0">
                    📦 Inventory Distribution
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <Doughnut data={inventoryChartData} options={pieOptions} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Tables View */}
      {viewType === "tables" && (
        <>
          {/* Product Revenue Table */}
          <Card className="mb-5 shadow-sm chart-card">
            <Card.Header className="bg-primary text-white">
              <Card.Title className="mb-0">Product Revenue Details</Card.Title>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product ID</th>
                    <th>Total Purchased</th>
                    <th>Total Revenue (₹)</th>
                    <th>Avg Revenue per Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {report.productReports.map((product, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{product.productId}</strong>
                      </td>
                      <td>{product.totalPurchased ?? "0"} units</td>
                      <td className="fw-bold">
                        ₹{(product.totalRevenue ?? 0).toFixed(2)}
                      </td>
                      <td>
                        ₹
                        {(product.totalPurchased && product.totalRevenue
                          ? product.totalRevenue / product.totalPurchased
                          : 0
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Inventory Status Table */}
          <Card className="shadow-sm chart-card">
            <Card.Header className="bg-success text-white">
              <Card.Title className="mb-0">Inventory Status Details</Card.Title>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product ID</th>
                    <th>Available Quantity</th>
                    <th>Reserved Quantity</th>
                    <th>Total Stock</th>
                    <th>Stock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.inventoryStatus.map((item, index) => {
                    const totalStock = item.availableQty + item.reservedQty;
                    const status =
                      item.availableQty === 0
                        ? "Out of Stock"
                        : item.availableQty < 10
                          ? "Low Stock"
                          : "In Stock";
                    const statusColor =
                      status === "Out of Stock"
                        ? "danger"
                        : status === "Low Stock"
                          ? "warning"
                          : "success";

                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{item.productId}</strong>
                        </td>
                        <td>{item.availableQty}</td>
                        <td>{item.reservedQty}</td>
                        <td className="fw-bold">{totalStock}</td>
                        <td>
                          <span
                            className={`badge bg-${statusColor}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}

      {/* Summary Statistics */}
      <Row className="mt-5 mb-4">
        <Col md={12}>
          <Card className="bg-light chart-card">
            <Card.Header className="bg-secondary text-white">
              <Card.Title className="mb-0">Summary Statistics</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <div className="p-3 bg-white rounded border stat-box">
                    <small className="text-muted">Average Revenue per Product</small>
                    <h5 className="mt-2">
                      ₹
                      {(
                        report.totalRevenue / report.productReports.length
                      ).toFixed(2)}
                    </h5>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="p-3 bg-white rounded border stat-box">
                    <small className="text-muted">Tax Percentage</small>
                    <h5 className="mt-2">
                      {(
                        (report.totalTax / report.totalRevenue) *
                        100
                      ).toFixed(2)}
                      %
                    </h5>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="p-3 bg-white rounded border stat-box">
                    <small className="text-muted">Total Units Sold</small>
                    <h5 className="mt-2">
                      {report.productReports.reduce(
                        (acc, p) => acc + (p.totalPurchased || 0),
                        0
                      )}{" "}
                      units
                    </h5>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="p-3 bg-white rounded border stat-box">
                    <small className="text-muted">Total Inventory Items</small>
                    <h5 className="mt-2">
                      {report.inventoryStatus.reduce(
                        (acc, i) => acc + i.availableQty + i.reservedQty,
                        0
                      )}{" "}
                      items
                    </h5>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DetailedReportPage;
