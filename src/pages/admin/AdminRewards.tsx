import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container,
  Card,
  Row,
  Col,
  Badge,
  Table,
  Spinner,
  Alert,
  Button,
} from "react-bootstrap";
import AdminHeader from "../../components/AdminHeader";
import "./AdminRewards.css";
import {
  getCustomerByMobile,
  getWalletTransactions,
  getBillingTransactions,
  type Customer,
  type WalletTransaction,
} from "../../services/customerApi";

interface BillTransaction {
  billId: string;
  amount: number;
  discount: number;
  date: string;
  itemCount: number;
}

const AdminRewards = () => {
  const { t } = useTranslation();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [billTransactions, setBillTransactions] = useState<BillTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileInput, setMobileInput] = useState<string>("");
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "wallet" | "bills">("overview");

  const loadCustomerData = async (mobileNo: string) => {
    if (!mobileNo.trim()) {
      setError(t('adminRewards.pleaseEnterMobileNumber'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const customerRes = await getCustomerByMobile(mobileNo);
      const cust = customerRes.data;
      setCustomer(cust);

      if (cust.id) {
        try {
          const transRes = await getWalletTransactions(cust.id);
          setTransactions(transRes.data || []);
        } catch (err) {
          console.warn("Could not fetch wallet transactions", err);
          setTransactions([]);
        }

        // Fetch billing transactions from API
        try {
          const billRes = await getBillingTransactions(cust.id);
          const bills = billRes.data || [];
          const mappedBills: BillTransaction[] = bills.map((bill: any) => ({
            billId: bill.billId || `BILL_${bill.id}`,
            amount: bill.totalAmount || 0,
            discount: bill.discount || 0,
            date: bill.billedAt ? new Date(bill.billedAt).toLocaleDateString() : new Date().toLocaleDateString(),
            itemCount: 1
          }));
          setBillTransactions(mappedBills);
        } catch (err) {
          console.warn("Could not fetch billing transactions", err);
          setBillTransactions([]);
        }
      }

      setSearched(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('adminRewards.failedToLoadCustomer');
      setError(msg);
      setCustomer(null);
      setTransactions([]);
      setBillTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomerData(mobileInput);
  };

  if (loading && searched) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t('adminRewards.loading')}</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="admin-rewards-container py-4">
      <AdminHeader 
        title={t('adminRewards.customerRewardsManagement')} 
        description={t('adminRewards.viewAndManageCustomer')}
      />
      <div className="rewards-header mb-4">
        <h2>💰 {t('adminRewards.customerRewards')}</h2>
      </div>

      {/* Search Section */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input
              type="text"
              placeholder={t('adminRewards.enterCustomerMobileNumber')}
              value={mobileInput}
              onChange={(e) => setMobileInput(e.target.value)}
              className="form-control"
            />
            <Button variant="primary" type="submit">
              {t('adminRewards.search')}
            </Button>
          </form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {customer ? (
        <>
          {/* Customer Summary Cards */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center bg-success text-white">
                <Card.Body>
                  <Card.Title>{t('adminRewards.walletBalance')}</Card.Title>
                  <h2 className="mb-0">₹{(customer.walletBalance || 0).toFixed(2)}</h2>
                  <small className="mt-2 d-block">{t('adminRewards.availableCredits')}</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center bg-info text-white">
                <Card.Body>
                  <Card.Title>{t('adminRewards.mobile')}</Card.Title>
                  <h4 className="mb-0">{customer.mobileNo}</h4>
                  <small className="mt-2 d-block">{t('adminRewards.customerId')}: {customer.id?.substring(0, 8)}</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center bg-warning text-dark">
                <Card.Body>
                  <Card.Title>{t('adminRewards.totalTransactions')}</Card.Title>
                  <h2 className="mb-0">{transactions.length}</h2>
                  <small className="mt-2 d-block">{t('adminRewards.creditsDebits')}</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tabs */}
          <div className="mb-4">
            <div className="btn-group" role="group">
              <Button
                variant={activeTab === "overview" ? "primary" : "outline-primary"}
                onClick={() => setActiveTab("overview")}
              >
                📊 {t('adminRewards.overview')}
              </Button>
              <Button
                variant={activeTab === "wallet" ? "primary" : "outline-primary"}
                onClick={() => setActiveTab("wallet")}
              >
                💳 {t('adminRewards.walletTransactions')}
              </Button>
              <Button
                variant={activeTab === "bills" ? "primary" : "outline-primary"}
                onClick={() => setActiveTab("bills")}
              >
                🧾 {t('adminRewards.billingTransactions')}
              </Button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">📊 {t('adminRewards.walletOverview')}</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="fw-bold text-muted">{t('adminRewards.currentBalance')}</label>
                      <div className="fs-4 text-success">
                        ₹{(customer.walletBalance || 0).toFixed(2)}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="fw-bold text-muted">{t('adminRewards.memberSince')}</label>
                      <div className="fs-6">
                        {new Date(customer.createdAt || "").toLocaleDateString() || t('adminRewards.notAvailable')}
                      </div>
                    </div>
                  </Col>
                </Row>
                <hr />
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="fw-bold text-muted">{t('adminRewards.totalTransactions')}</label>
                      <div className="fs-5">{transactions.length}</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="fw-bold text-muted">{t('adminRewards.lastUpdated')}</label>
                      <div className="fs-6">
                        {new Date(customer.updatedAt || "").toLocaleDateString() || t('adminRewards.notAvailable')}
                      </div>
                    </div>
                  </Col>
                </Row>
                <Alert variant="info" className="mt-3 mb-0">
                  <strong>ℹ️ {t('adminRewards.adminNote')}:</strong> {t('adminRewards.adminNoteText')}
                </Alert>
              </Card.Body>
            </Card>
          )}

          {/* Wallet Transactions Tab */}
          {activeTab === "wallet" && (
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">� Wallet Transactions</h5>
              </Card.Header>
              <Card.Body>
                {transactions.length > 0 ? (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Description</th>
                          <th>ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn, idx) => (
                          <tr key={idx}>
                            <td className="small">
                              {new Date(txn.createdAt || "").toLocaleDateString()}
                            </td>
                            <td>
                              <Badge bg={txn.type === "CREDIT" ? "success" : "danger"}>
                                {txn.type}
                              </Badge>
                            </td>
                            <td className="fw-bold">
                              {txn.type === "CREDIT" ? "+" : "-"}₹{txn.amount.toFixed(2)}
                            </td>
                            <td className="small">{txn.description}</td>
                            <td className="small text-muted">{txn.id?.substring(0, 8)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="info" className="mb-0">
                    No wallet transactions found for this customer.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Billing Transactions Tab */}
          {activeTab === "bills" && (
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">🧾 Billing Transactions</h5>
              </Card.Header>
              <Card.Body>
                {billTransactions.length > 0 ? (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Bill ID</th>
                          <th>Date</th>
                          <th>Items</th>
                          <th>Amount</th>
                          <th>Discount</th>
                          <th>Net Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billTransactions.map((bill, idx) => (
                          <tr key={idx}>
                            <td className="fw-bold">
                              <Badge bg="secondary">{bill.billId.substring(0, 16)}</Badge>
                            </td>
                            <td className="small">{bill.date}</td>
                            <td className="text-center">
                              <Badge bg="info">{bill.itemCount}</Badge>
                            </td>
                            <td className="fw-bold">₹{bill.amount.toFixed(2)}</td>
                            <td className="text-success fw-bold">₹{bill.discount.toFixed(2)}</td>
                            <td className="fw-bold">₹{(bill.amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="info" className="mb-0">
                    No billing transactions found for this customer.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          )}
        </>
      ) : (
        !searched && (
          <Alert variant="info">
            Enter a customer mobile number to view rewards and wallet details.
          </Alert>
        )
      )}
    </Container>
  );
};

export default AdminRewards;
