import React, { useEffect, useState } from "react";
import { Container, Table, Spinner, Card, Row, Col, Button, Badge } from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import AdminReportHeader from "../../components/AdminReportHeader";
import { getReport, type ReportResponse } from "../../services/reportingService";
import { mockReportData, useMockData } from "../../services/mockReportData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const BillingReportPage: React.FC = () => {
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
        console.log("Billing report data received:", res.data);
        setReport(res.data);
      })
      .catch((err) => {
        console.error("Error fetching billing report:", err);
        // Handle 401 (token expired) separately
        if (err.response?.status === 401) {
          setError("Your session has expired. Please login again.");
          localStorage.removeItem("user");
          setTimeout(() => {
            window.location.href = "/login?expired=true";
          }, 2000);
        } else {
          setError(err.message || "Failed to load billing report");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading billing report...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <div className="alert alert-danger">
          <h5>❌ Error Loading Billing Report</h5>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Retry
          </Button>
        </div>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning text-center">
          <h5>⚠️ No Billing Data Available</h5>
          <p>No billing records found.</p>
        </div>
      </Container>
    );
  }

  // Calculate billing statistics
  const taxAmount = report.totalTax;
  const netAmount = report.totalRevenue - taxAmount;
  const taxRate = ((taxAmount / report.totalRevenue) * 100).toFixed(2);
  const totalBills = report.productReports.length;
  const avgBillValue = report.totalRevenue / totalBills;

  // Billing trend data (simulated)
  const billingTrendData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Revenue (₹)",
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
      {
        label: "Tax (₹)",
        data: [
          (report.totalRevenue * 0.2 * taxAmount) / report.totalRevenue,
          (report.totalRevenue * 0.25 * taxAmount) / report.totalRevenue,
          (report.totalRevenue * 0.3 * taxAmount) / report.totalRevenue,
          (report.totalRevenue * 0.25 * taxAmount) / report.totalRevenue,
        ],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Revenue breakdown
  const revenueBreakdownData = {
    labels: ["Net Amount", "Tax"],
    datasets: [
      {
        data: [netAmount, taxAmount],
        backgroundColor: ["rgba(54, 162, 235, 0.8)", "rgba(255, 99, 132, 0.8)"],
        borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 99, 132, 1)"],
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

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" as const },
    },
  };

  return (
    <Container fluid className="mt-4 p-4">
      <AdminReportHeader
        title="💳 Billing Report"
        description="Track revenue, tax, and financial metrics"
      />

      {/* KPI Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-white bg-success">
            <Card.Body>
              <Card.Title className="fs-6">Total Revenue</Card.Title>
              <Card.Text className="fs-4 fw-bold">₹{report.totalRevenue.toFixed(2)}</Card.Text>
              <small>Gross revenue</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-primary">
            <Card.Body>
              <Card.Title className="fs-6">Net Amount</Card.Title>
              <Card.Text className="fs-4 fw-bold">₹{netAmount.toFixed(2)}</Card.Text>
              <small>After tax deduction</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-warning">
            <Card.Body>
              <Card.Title className="fs-6">Total Tax</Card.Title>
              <Card.Text className="fs-4 fw-bold">₹{taxAmount.toFixed(2)}</Card.Text>
              <small>Tax collected</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-white bg-info">
            <Card.Body>
              <Card.Title className="fs-6">Tax Rate</Card.Title>
              <Card.Text className="fs-4 fw-bold">{taxRate}%</Card.Text>
              <small>Effective tax rate</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-5">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <Card.Title className="mb-0">📈 Billing Trend</Card.Title>
            </Card.Header>
            <Card.Body>
              <Line data={billingTrendData} options={chartOptions} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <Card.Title className="mb-0">💰 Revenue Breakdown</Card.Title>
            </Card.Header>
            <Card.Body>
              <Pie data={revenueBreakdownData} options={pieOptions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Billing Summary Cards */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="bg-light">
            <Card.Body>
              <small className="text-muted d-block mb-2">Avg Bill Value</small>
              <h4 className="mb-0">₹{avgBillValue.toFixed(2)}</h4>
              <small>Per transaction</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="bg-light">
            <Card.Body>
              <small className="text-muted d-block mb-2">Total Transactions</small>
              <h4 className="mb-0">{totalBills}</h4>
              <small>Billing records</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="bg-light">
            <Card.Body>
              <small className="text-muted d-block mb-2">Gross Margin</small>
              <h4 className="mb-0">{(100 - parseFloat(taxRate)).toFixed(2)}%</h4>
              <small>Profit percentage</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Billing Table */}
      <Card className="shadow-sm mb-5">
        <Card.Header className="bg-dark text-white">
          <Card.Title className="mb-0">📋 Detailed Billing Records</Card.Title>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Bill ID</th>
                <th>Gross Amount (₹)</th>
                <th>Tax (₹)</th>
                <th>Net Amount (₹)</th>
                <th>Tax %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.productReports.map((product, index) => {
                const grossAmount = product.totalRevenue || 0;
                const billTax = (grossAmount * parseFloat(taxRate)) / 100;
                const netAmount = grossAmount - billTax;

                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>BILL-P{product.productId}-{String(index + 1).padStart(3, "0")}</strong>
                    </td>
                    <td>₹{grossAmount.toFixed(2)}</td>
                    <td>₹{billTax.toFixed(2)}</td>
                    <td className="fw-bold">₹{netAmount.toFixed(2)}</td>
                    <td>{taxRate}%</td>
                    <td>
                      <Badge bg="success">Paid</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Summary */}
      <Row>
        <Col md={12}>
          <Card className="bg-light">
            <Card.Body>
              <h5 className="mb-4">📊 Billing Summary</h5>
              <Row>
                <Col md={3} className="text-center mb-3">
                  <div>
                    <small className="text-muted">Total Revenue</small>
                    <h5 className="mt-2">₹{report.totalRevenue.toFixed(2)}</h5>
                  </div>
                </Col>
                <Col md={3} className="text-center mb-3">
                  <div>
                    <small className="text-muted">Total Tax</small>
                    <h5 className="mt-2">₹{taxAmount.toFixed(2)}</h5>
                  </div>
                </Col>
                <Col md={3} className="text-center mb-3">
                  <div>
                    <small className="text-muted">Net Amount</small>
                    <h5 className="mt-2">₹{netAmount.toFixed(2)}</h5>
                  </div>
                </Col>
                <Col md={3} className="text-center mb-3">
                  <div>
                    <small className="text-muted">Tax Rate</small>
                    <h5 className="mt-2">{taxRate}%</h5>
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

export default BillingReportPage;
