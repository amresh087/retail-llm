import { Button, Modal, Table, Alert } from "react-bootstrap";

interface BillItem {
  sku: string;
  name?: string;
  nameHi?: string;
  productName?: string;
  price: number;
  qty?: number;
  quantity?: number;
}

interface BillDetailsModalProps {
  show: boolean;
  loadingBillDetails: boolean;
  selectedBillId: string | null;
  selectedBillDate: string | null;
  billItems: BillItem[];
  billDiscount: number;
  billSubTotal: number;
  billTaxAmount: number;
  billTotalAmount: number;
  billRefunded: boolean;
  getLocalized: (en?: string, hi?: string) => string;
  t: (key: string, opts?: any) => string;
  onClose: () => void;
  onProcessReturn: () => void;
}

const BillDetailsModal = ({
  show,
  loadingBillDetails,
  selectedBillId,
  selectedBillDate,
  billItems,
  billDiscount,
  billSubTotal,
  billTaxAmount,
  billTotalAmount,
  billRefunded,
  getLocalized,
  t,
  onClose,
  onProcessReturn,
}: BillDetailsModalProps) => {
  return (
    <Modal
      show={show}
      onHide={onClose}
      size="lg"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title>📋 Bill Details</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loadingBillDetails ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading bill details...</p>
          </div>
        ) : (
          <div>
            {/* Bill Header */}
            <div
              className="card mb-4"
              style={{ backgroundColor: "#f0f7ff", border: "1px solid #0d6efd" }}
            >
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <small className="text-muted d-block">Bill ID</small>
                    <h6 className="fw-bold" style={{ wordBreak: "break-all" }}>
                      {selectedBillId}
                    </h6>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Date</small>
                    <h6 className="fw-bold">{selectedBillDate}</h6>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill Summary */}
            <div
              className="card mb-4"
              style={{ backgroundColor: "#f9f9f9", border: "1px solid #ddd" }}
            >
              <div className="card-body">
                <h6 className="fw-bold mb-3">💰 Bill Summary</h6>
                <div className="row">
                  <div className="col-md-6">
                    <small className="text-muted d-block">Subtotal</small>
                    <h6 className="fw-bold">₹{billSubTotal.toFixed(2)}</h6>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Tax</small>
                    <h6 className="fw-bold">₹{billTaxAmount.toFixed(2)}</h6>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Discount</small>
                    <h6 className="fw-bold text-success">
                      -₹{billDiscount.toFixed(2)}
                    </h6>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Total Amount</small>
                    <h6
                      className="fw-bold"
                      style={{ color: "#0d6efd", fontSize: "1.1rem" }}
                    >
                      ₹{billTotalAmount.toFixed(2)}
                    </h6>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill Items */}
            <h6 className="fw-bold mb-3">📦 Items in Bill</h6>
            {billItems && billItems.length > 0 ? (
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  overflowX: "auto",
                }}
              >
                <Table striped bordered hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, idx) => {
                      const qty = item.qty || item.quantity || 0;
                      const itemSubtotal = (item.price || 0) * qty;
                      const itemDiscount =
                        billSubTotal > 0
                          ? (billDiscount * itemSubtotal) / billSubTotal
                          : 0;
                      const itemTotal = itemSubtotal - itemDiscount;

                      return (
                        <tr key={idx}>
                          <td>
                            <small className="fw-bold">{item.sku || "N/A"}</small>
                          </td>
                          <td>
                            <small>
                              {getLocalized(item.name, item.nameHi) ||
                                item.productName ||
                                "N/A"}
                            </small>
                          </td>
                          <td className="text-center">
                            <small className="fw-bold">{qty}</small>
                          </td>
                          <td className="text-end">
                            <small>₹{(item.price || 0).toFixed(2)}</small>
                          </td>
                          <td className="text-end">
                            <small className="text-danger">
                              {itemDiscount > 0
                                ? `-₹${itemDiscount.toFixed(2)}`
                                : "-"}
                            </small>
                          </td>
                          <td className="text-end">
                            <small className="fw-bold">
                              ₹{itemTotal.toFixed(2)}
                            </small>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div
                className="alert alert-light border"
                style={{ backgroundColor: "#f0f0f0" }}
              >
                <small className="text-muted">No items found in this bill</small>
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {billRefunded && (
          <Alert variant="warning" className="w-100 mb-0">
            ⚠️ This bill has already been refunded. Cannot process return again.
          </Alert>
        )}
        <Button
          variant="danger"
          disabled={billRefunded}
          onClick={onProcessReturn}
        >
          ↩️ Process Return
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BillDetailsModal;