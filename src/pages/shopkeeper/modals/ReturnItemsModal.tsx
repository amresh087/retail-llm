import { Button, Modal, Form, InputGroup, Alert } from "react-bootstrap";

interface BillItem {
  sku: string;
  name?: string;
  nameHi?: string;
  price: number;
  quantity: number;
}

interface ReturnItemsModalProps {
  show: boolean;
  billItems: BillItem[];
  billDiscount: number;
  billSubTotal: number;
  selectedRefundBill: any;
  returnItemSelection: Record<number, number>;
  processingReturn: boolean;
  returnError: string | null;
  t: (key: string, opts?: any) => string;
  onClose: () => void;
  onConfirm: () => void;
  onToggleItem: (idx: number, checked: boolean) => void;
  onQtyChange: (idx: number, qty: number, maxQty: number) => void;
}

const ReturnItemsModal = ({
  show,
  billItems,
  billDiscount,
  billSubTotal,
  selectedRefundBill,
  returnItemSelection,
  processingReturn,
  returnError,
  t,
  onClose,
  onConfirm,
  onToggleItem,
  onQtyChange,
}: ReturnItemsModalProps) => {
  const totalRefund = Object.entries(returnItemSelection).reduce(
    (sum, [idx, qty]) => {
      if (!qty || qty <= 0) return sum;
      const item = billItems[parseInt(idx)];
      return sum + (item?.price || 0) * qty;
    },
    0
  );

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="lg"
      scrollable
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          ↩️ Return Items from Bill {selectedRefundBill?.billId}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {returnError && <Alert variant="danger">{returnError}</Alert>}

        <div className="mb-3">
          <h6 className="fw-bold mb-3">Select items to return:</h6>

          {billItems && billItems.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="table table-sm table-hover">
                <thead style={{ backgroundColor: "#e9ecef" }}>
                  <tr>
                    <th style={{ fontWeight: "bold", width: "10%" }}>Select</th>
                    <th style={{ fontWeight: "bold" }}>SKU</th>
                    <th className="text-center" style={{ fontWeight: "bold" }}>
                      Ordered
                    </th>
                    <th className="text-center" style={{ fontWeight: "bold" }}>
                      Return
                    </th>
                    <th className="text-end" style={{ fontWeight: "bold" }}>
                      Price
                    </th>
                    <th className="text-end" style={{ fontWeight: "bold" }}>
                      Refund
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, idx) => {
                    const returnQty = returnItemSelection[idx] || 0;
                    const itemSubtotal = (item.quantity || 0) * (item.price || 0);
                    const proportionalDiscount =
                      billDiscount && billSubTotal
                        ? (billDiscount * itemSubtotal) / billSubTotal
                        : 0;
                    const itemTotal = itemSubtotal - proportionalDiscount;
                    const refundAmount =
                      (itemTotal * returnQty) / (item.quantity || 1);

                    return (
                      <tr key={idx}>
                        <td className="text-center">
                          <Form.Check
                            type="checkbox"
                            checked={idx in returnItemSelection}
                            onChange={(e) => onToggleItem(idx, e.target.checked)}
                          />
                        </td>
                        <td>
                          <small className="fw-bold">{item.sku}</small>
                        </td>
                        <td className="text-center">
                          <small>{item.quantity}</small>
                        </td>
                        <td className="text-center">
                          {idx in returnItemSelection ? (
                            <InputGroup size="sm">
                              <Form.Control
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={returnQty}
                                onChange={(e) =>
                                  onQtyChange(
                                    idx,
                                    parseInt(e.target.value) || 0,
                                    item.quantity
                                  )
                                }
                                style={{ width: "60px" }}
                              />
                            </InputGroup>
                          ) : (
                            <small className="text-muted">-</small>
                          )}
                        </td>
                        <td className="text-end">
                          <small>₹{(item.price || 0).toFixed(2)}</small>
                        </td>
                        <td className="text-end">
                          <small className="text-success fw-bold">
                            {returnQty > 0
                              ? `₹${refundAmount.toFixed(2)}`
                              : "₹0.00"}
                          </small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-light border">
              <small className="text-muted">No items found</small>
            </div>
          )}
        </div>

        {/* Refund Summary */}
        {Object.keys(returnItemSelection).length > 0 && (
          <div className="card mb-3">
            <div className="card-body pb-2">
              <h6 className="fw-bold mb-2">💰 Refund Summary</h6>
              {billItems.map((item, idx) => {
                const returnQty = returnItemSelection[idx];
                if (!returnQty || returnQty <= 0) return null;
                const refundAmountGross = (item.price || 0) * returnQty;
                return (
                  <div
                    key={idx}
                    className="row g-2 mb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <div className="col-6">
                      <small>
                        {item.sku} ({returnQty} × ₹{item.price})
                      </small>
                    </div>
                    <div className="col-6 text-end">
                      <small className="fw-bold text-success">
                        ₹{refundAmountGross.toFixed(2)}
                      </small>
                    </div>
                  </div>
                );
              })}

              <hr className="my-2" />

              <div className="row g-2">
                <div className="col-6">
                  <small className="fw-bold">Total Refund:</small>
                </div>
                <div className="col-6 text-end">
                  <small
                    className="fw-bold"
                    style={{ fontSize: "1rem", color: "#28a745" }}
                  >
                    ₹{totalRefund.toFixed(2)}
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="success"
          disabled={
            Object.values(returnItemSelection).reduce(
              (sum, qty) => sum + qty,
              0
            ) === 0 || processingReturn
          }
          onClick={onConfirm}
        >
          {processingReturn ? "⏳ Processing..." : "✅ Confirm Return"}
        </Button>
        <Button
          variant="secondary"
          disabled={processingReturn}
          onClick={onClose}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReturnItemsModal;