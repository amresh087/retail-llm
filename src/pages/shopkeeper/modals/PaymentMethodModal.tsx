import { Button, Modal, Form, InputGroup, Alert } from "react-bootstrap";

interface PaymentMethodModalProps {
  show: boolean;
  billTotalAmount: number;
  billDiscount: number;
  paymentMethodType: "cash" | "wallet" | "mixed";
  walletAmountUsed: number;
  walletAmountInput: string;
  discountReversalOption: "yes" | "no";
  fetchedBillSummary: any;
  allowManualPaymentMethodEdit: boolean;
  returnError: string | null;
  processingReturn: boolean;
  t: (key: string, opts?: any) => string;
  onClose: () => void;
  onConfirm: () => void;
  onPaymentMethodChange: (method: "cash" | "wallet" | "mixed") => void;
  onWalletAmountChange: (input: string, amount: number) => void;
  onDiscountReversalChange: (option: "yes" | "no") => void;
  onAllowEdit: () => void;
}

const PaymentMethodModal = ({
  show,
  billTotalAmount,
  billDiscount,
  paymentMethodType,
  walletAmountUsed,
  walletAmountInput,
  discountReversalOption,
  fetchedBillSummary,
  allowManualPaymentMethodEdit,
  returnError,
  processingReturn,
  t,
  onClose,
  onConfirm,
  onPaymentMethodChange,
  onWalletAmountChange,
  onDiscountReversalChange,
  onAllowEdit,
}: PaymentMethodModalProps) => {
  const isFromApi = !!fetchedBillSummary && !allowManualPaymentMethodEdit;

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>💳 Original Payment Method</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {returnError && <Alert variant="danger">{returnError}</Alert>}

        {/* Payment Method Selection */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">Original Payment Method</h6>
          <small className="text-muted d-block mb-2">
            Select or confirm the payment method used:
          </small>

          {/* Cash */}
          <div className="d-flex align-items-center gap-2">
            <Form.Check
              type="radio"
              id="payment_cash"
              label="💵 All Cash"
              name="paymentMethod"
              value="cash"
              checked={paymentMethodType === "cash"}
              disabled={isFromApi}
              onChange={() => {
                onPaymentMethodChange("cash");
                onWalletAmountChange("", 0);
              }}
              className="mb-2"
            />
            {fetchedBillSummary && (
              <small className="text-muted">(from API)</small>
            )}
          </div>

          {/* Wallet */}
          <div className="d-flex align-items-center gap-2">
            <Form.Check
              type="radio"
              id="payment_wallet"
              label="💳 All Wallet"
              name="paymentMethod"
              value="wallet"
              checked={paymentMethodType === "wallet"}
              disabled={isFromApi}
              onChange={() => {
                onPaymentMethodChange("wallet");
                onWalletAmountChange(
                  String(billTotalAmount || 0),
                  billTotalAmount || 0
                );
              }}
              className="mb-2"
            />
            {fetchedBillSummary && (
              <small className="text-muted">(from API)</small>
            )}
          </div>

          {/* Mixed */}
          <div className="d-flex align-items-center gap-2">
            <Form.Check
              type="radio"
              id="payment_mixed"
              label="🔄 Mixed (Cash + Wallet)"
              name="paymentMethod"
              value="mixed"
              checked={paymentMethodType === "mixed"}
              disabled={isFromApi}
              onChange={() => onPaymentMethodChange("mixed")}
              className="mb-3"
            />
            {fetchedBillSummary && (
              <small className="text-muted">(from API)</small>
            )}
          </div>

          {/* Wallet amount input for mixed */}
          {paymentMethodType === "mixed" && (
            <div
              className="card mt-3 p-3"
              style={{ backgroundColor: "#f0f8ff" }}
            >
              <small className="text-muted mb-2">
                Enter the amount paid from wallet:
              </small>
              <InputGroup size="sm">
                <InputGroup.Text>₹</InputGroup.Text>
                <Form.Control
                  type="number"
                  min="0"
                  max={billTotalAmount || 0}
                  step="0.01"
                  placeholder="0.00"
                  value={walletAmountInput}
                  disabled={isFromApi}
                  onChange={(e) =>
                    onWalletAmountChange(
                      e.target.value,
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </InputGroup>
              <small className="text-muted mt-2 d-block">
                Bill Total: ₹{(billTotalAmount || 0).toFixed(2)}
              </small>
            </div>
          )}

          {/* Allow manual edit */}
          {fetchedBillSummary && !allowManualPaymentMethodEdit && (
            <div className="mt-2">
              <Button variant="link" size="sm" onClick={onAllowEdit}>
                Edit
              </Button>
              <small className="text-muted ms-2">
                You can edit the payment method if needed.
              </small>
            </div>
          )}
        </div>

        <hr />

        {/* Discount Handling */}
        {billDiscount > 0 && (
          <div className="mb-3">
            <h6 className="fw-bold mb-3">Discount Handling</h6>
            <small className="text-muted d-block mb-2">
              This bill had a discount of{" "}
              <span className="fw-bold text-success">
                ₹{billDiscount.toFixed(2)}
              </span>
            </small>

            <Form.Check
              type="radio"
              id="discount_yes"
              label="✅ Revert discount from wallet (recommended)"
              name="discountReversal"
              value="yes"
              checked={discountReversalOption === "yes"}
              onChange={() => onDiscountReversalChange("yes")}
              className="mb-2"
            />
            <Form.Check
              type="radio"
              id="discount_no"
              label="❌ Keep discount (no revert)"
              name="discountReversal"
              value="no"
              checked={discountReversalOption === "no"}
              onChange={() => onDiscountReversalChange("no")}
            />
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="success"
          disabled={
            processingReturn ||
            (paymentMethodType === "mixed" &&
              (walletAmountUsed <= 0 ||
                walletAmountUsed > (billTotalAmount || 0)))
          }
          onClick={onConfirm}
        >
          ✅ Continue with Return
        </Button>
        <Button
          variant="secondary"
          onClick={onClose}
        >
          Back
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentMethodModal;