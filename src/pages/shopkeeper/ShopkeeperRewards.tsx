import { useState } from "react";
import {
  Container,
} from "react-bootstrap";
import ShopkeeperHeader from "../../components/ShopkeeperHeader";
import "./ShopkeeperRewards.css";
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

const ShopkeeperRewards = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [billTransactions, setBillTransactions] = useState<BillTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileInput, setMobileInput] = useState<string>("");
  const [searched, setSearched] = useState(false);
  const [walletCurrentPage, setWalletCurrentPage] = useState(1);
  const [billingCurrentPage, setBillingCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadCustomerData = async (mobileNo: string) => {
    if (!mobileNo.trim()) {
      setError("Please enter a mobile number");
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
      const msg = err?.response?.data?.message || err?.message || "Failed to load customer";
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
        <div className="rewards-loading">
          <div className="rewards-spinner"></div>
          <p>Loading customer data...</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="rewards-page-container">
      <ShopkeeperHeader 
        title="💳 Customer Wallet & Rewards" 
        description="Quick access to customer wallet balance and billing history for POS"
      />
      
      <Container className="rewards-content">
        {/* Search Section */}
        <div className="rewards-search-card">
          <div className="rewards-search-header">
            <h3 className="rewards-search-title">Find Customer</h3>
          </div>
          <div className="rewards-search-body">
            <form onSubmit={handleSearch} className="rewards-search-form">
              <div className="rewards-search-input-group">
                <input
                  type="text"
                  placeholder="Enter customer mobile number"
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value)}
                  className="rewards-input"
                />
                <button type="submit" className="rewards-search-btn">
                  🔍 Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className="rewards-error-alert">
            <span className="rewards-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loading && searched && (
          <div className="rewards-loading">
            <div className="rewards-spinner"></div>
            <p>Loading customer data...</p>
          </div>
        )}

        {customer && !loading ? (
          <div className="rewards-customer-section">
            {/* Customer Info Cards */}
            <div className="rewards-stats-grid">
              <div className="rewards-stat-card rewards-stat-primary">
                <div className="rewards-stat-icon">💰</div>
                <div className="rewards-stat-content">
                  <div className="rewards-stat-label">Wallet Balance</div>
                  <div className="rewards-stat-value">₹{(customer.walletBalance || 0).toFixed(2)}</div>
                  <div className="rewards-stat-subtitle">Available to use</div>
                </div>
              </div>

              <div className="rewards-stat-card rewards-stat-secondary">
                <div className="rewards-stat-icon">📱</div>
                <div className="rewards-stat-content">
                  <div className="rewards-stat-label">Mobile Number</div>
                  <div className="rewards-stat-value">{customer.mobileNo}</div>
                  <div className="rewards-stat-subtitle">ID: {customer.id?.substring(0, 12)}</div>
                </div>
              </div>

              <div className="rewards-stat-card rewards-stat-accent">
                <div className="rewards-stat-icon">📅</div>
                <div className="rewards-stat-content">
                  <div className="rewards-stat-label">Member Since</div>
                  <div className="rewards-stat-value">{new Date(customer.createdAt || "").toLocaleDateString()}</div>
                  <div className="rewards-stat-subtitle">Customer ID</div>
                </div>
              </div>
            </div>

            {/* Wallet Details Card */}
            <div className="rewards-details-card">
              <div className="rewards-details-header">
                <h4 className="rewards-details-title">📊 Wallet Summary</h4>
              </div>
              <div className="rewards-details-body">
                <div className="rewards-details-grid">
                  <div className="rewards-detail-item">
                    <div className="rewards-detail-label">Current Balance</div>
                    <div className="rewards-detail-value rewards-value-primary">₹{(customer.walletBalance || 0).toFixed(2)}</div>
                  </div>
                  <div className="rewards-detail-item">
                    <div className="rewards-detail-label">Total Transactions</div>
                    <div className="rewards-detail-value rewards-value-secondary">{transactions.length}</div>
                  </div>
                  <div className="rewards-detail-item">
                    <div className="rewards-detail-label">Total Billing Txns</div>
                    <div className="rewards-detail-value rewards-value-accent">{billTransactions.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Transactions */}
            <div className="rewards-transactions-card">
              <div className="rewards-transactions-header">
                <h4 className="rewards-transactions-title">📋 Wallet Transactions</h4>
              </div>
              <div className="rewards-transactions-body">
                {transactions.length > 0 ? (
                  <>
                    <div className="rewards-table-wrapper">
                      <table className="rewards-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions
                            .slice((walletCurrentPage - 1) * itemsPerPage, walletCurrentPage * itemsPerPage)
                            .map((txn, idx) => (
                            <tr key={idx}>
                              <td className="rewards-table-date">
                                {new Date(txn.createdAt || "").toLocaleDateString()}
                              </td>
                              <td>
                                <span className={`rewards-badge ${txn.type === "CREDIT" ? "rewards-badge-credit" : "rewards-badge-debit"}`}>
                                  {txn.type === "CREDIT" ? "✅ CREDIT" : "❌ DEBIT"}
                                </span>
                              </td>
                              <td className="rewards-table-amount">
                                <span className={txn.type === "CREDIT" ? "rewards-amount-credit" : "rewards-amount-debit"}>
                                  {txn.type === "CREDIT" ? "+" : "-"}₹{txn.amount.toFixed(2)}
                                </span>
                              </td>
                              <td className="rewards-table-description">{txn.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {transactions.length > itemsPerPage && (
                      <div className="rewards-pagination">
                        <button 
                          className="rewards-pagination-btn"
                          onClick={() => setWalletCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={walletCurrentPage === 1}
                        >
                          ← Previous
                        </button>
                        <div className="rewards-pagination-info">
                          Page {walletCurrentPage} of {Math.ceil(transactions.length / itemsPerPage)} 
                          <span className="rewards-pagination-total">({transactions.length} total)</span>
                        </div>
                        <button 
                          className="rewards-pagination-btn"
                          onClick={() => setWalletCurrentPage(prev => Math.min(Math.ceil(transactions.length / itemsPerPage), prev + 1))}
                          disabled={walletCurrentPage === Math.ceil(transactions.length / itemsPerPage)}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rewards-empty-state">
                    <span className="rewards-empty-icon">📭</span>
                    <p>No wallet transactions found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Billing Transactions */}
            <div className="rewards-billing-card">
              <div className="rewards-billing-header">
                <h4 className="rewards-billing-title">🧾 Billing Transactions</h4>
              </div>
              <div className="rewards-billing-body">
                {billTransactions && billTransactions.length > 0 ? (
                  <>
                    <div className="rewards-table-wrapper">
                      <table className="rewards-table">
                        <thead>
                          <tr>
                            <th>Bill ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Amount</th>
                            <th>Reward</th>
                            <th>Net Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billTransactions
                            .slice((billingCurrentPage - 1) * itemsPerPage, billingCurrentPage * itemsPerPage)
                            .map((bill) => (
                            <tr key={bill.billId}>
                              <td><span className="rewards-badge rewards-badge-info">{bill.billId}</span></td>
                              <td>{bill.date}</td>
                              <td><span className="rewards-badge rewards-badge-secondary">{bill.itemCount}</span></td>
                              <td>₹{bill.amount.toFixed(2)}</td>
                              <td><span className="rewards-amount-credit">₹{bill.discount.toFixed(2)}</span></td>
                              <td className="rewards-table-net">₹{(bill.amount - bill.discount).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {billTransactions.length > itemsPerPage && (
                      <div className="rewards-pagination">
                        <button 
                          className="rewards-pagination-btn"
                          onClick={() => setBillingCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={billingCurrentPage === 1}
                        >
                          ← Previous
                        </button>
                        <div className="rewards-pagination-info">
                          Page {billingCurrentPage} of {Math.ceil(billTransactions.length / itemsPerPage)}
                          <span className="rewards-pagination-total">({billTransactions.length} total)</span>
                        </div>
                        <button 
                          className="rewards-pagination-btn"
                          onClick={() => setBillingCurrentPage(prev => Math.min(Math.ceil(billTransactions.length / itemsPerPage), prev + 1))}
                          disabled={billingCurrentPage === Math.ceil(billTransactions.length / itemsPerPage)}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rewards-empty-state">
                    <span className="rewards-empty-icon">📭</span>
                    <p>No billing transactions found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tips Section */}
            <div className="rewards-tip-card">
              <div className="rewards-tip-icon">💡</div>
              <div className="rewards-tip-content">
                <div className="rewards-tip-title">Pro Tip</div>
                <div className="rewards-tip-text">
                  Share the customer's wallet balance with them during billing. They can use it to get discounts on their purchases!
                </div>
              </div>
            </div>
          </div>
        ) : !searched ? (
          <div className="rewards-empty-search">
            <div className="rewards-empty-icon-lg">🔍</div>
            <p className="rewards-empty-text">Search for a customer by mobile number to view their wallet and rewards.</p>
          </div>
        ) : null}
      </Container>
    </div>
  );
};

export default ShopkeeperRewards;
