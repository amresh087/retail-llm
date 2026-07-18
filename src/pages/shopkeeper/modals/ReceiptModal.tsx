import { Button, Modal, Table } from "react-bootstrap";
import type { CartItem } from "../../../services/billingApi";

interface ReceiptData {
  billId: string;
  items: CartItem[];
  payment: any;
  totals: {
    discountAmt: number;
    taxable: number;
    gstAmt: number;
    grandTotal: number;
  };
  server: any;
  walletUsed: number;
  amountToCharge: number;
}

interface ReceiptModalProps {
  show: boolean;
  receiptData: ReceiptData | null;
  getLocalized: (en?: string, hi?: string) => string;
  t: (key: string, opts?: any) => string;
  onClose: () => void;
  onDone: () => void;
}

const ReceiptModal = ({
  show,
  receiptData,
  getLocalized,
  t,
  onClose,
  onDone,
}: ReceiptModalProps) => {
  const handlePrint = () => {
    const content = document.getElementById("receipt-content");
    if (!content) return;
    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) { alert(t("billing.unableToOpenPrintWindow")); return; }
    w.document.write(
      `<html><head><title>Receipt</title><style>
        body{font-family:sans-serif;padding:12px}
        table{width:100%;border-collapse:collapse}
        td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left}
      </style></head><body>`
    );
    w.document.write(content.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {t("billing.receiptTitle", { billId: receiptData?.billId || "" })}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {receiptData ? (
          <div id="receipt-content">
            <h5>{t("billing.storeReceipt")}</h5>
            <div className="small text-muted">
              {t("billing.billLabel", { billId: receiptData.billId })}
            </div>

            <Table size="sm" className="mt-2">
              <thead>
                <tr>
                  <th>{t("billing.table.item")}</th>
                  <th>{t("billing.table.qty")}</th>
                  <th>{t("billing.table.price")}</th>
                  <th>{t("billing.table.discount")}</th>
                  <th>{t("billing.table.total")}</th>
                </tr>
              </thead>
              <tbody>
                {receiptData.items.map((it) => {
                  const discountPerUnit = it.discountAmount ?? 0;
                  const totalDiscount = discountPerUnit * it.qty;
                  const priceAfterDiscount = Math.max(0, (it.price ?? 0) - discountPerUnit);
                  const receiptItemTotal = priceAfterDiscount * it.qty;
                  return (
                    <tr key={`${it.productId}-${it.batchNo}`}>
                      <td>{getLocalized(it.name, it.nameHi) || it.sku}</td>
                      <td>{it.qty}</td>
                      <td>₹{it.price.toFixed(2)}</td>
                      <td>₹{totalDiscount.toFixed(2)}</td>
                      <td>₹{receiptItemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            <div className="mt-3">
              <div className="d-flex justify-content-between">
                <div>{t("billing.subtotal")}</div>
                <div>
                  ₹{(receiptData.totals.discountAmt + receiptData.totals.taxable).toFixed(2)}
                </div>
              </div>
              <div className="d-flex justify-content-between">
                <div>{t("billing.discountLabel")}</div>
                <div>₹{receiptData.totals.discountAmt.toFixed(2)}</div>
              </div>
              <div className="d-flex justify-content-between">
                <div>{t("billing.gst")}</div>
                <div>₹{receiptData.totals.gstAmt.toFixed(2)}</div>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold">
                <div>{t("billing.grandTotal")}</div>
                <div>₹{receiptData.totals.grandTotal.toFixed(2)}</div>
              </div>

              {receiptData.walletUsed > 0 && (
                <>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between p-2 text-success fw-bold">
                    <div className="small">💳 Wallet Used</div>
                    <div className="small">-₹{receiptData.walletUsed.toFixed(2)}</div>
                  </div>
                </>
              )}

              {receiptData.amountToCharge !== undefined && (
                <div className="d-flex justify-content-between bg-warning bg-opacity-10 p-2 rounded mt-2">
                  <div className="fw-bold">Amount Due</div>
                  <div className="fw-bold">₹{receiptData.amountToCharge.toFixed(2)}</div>
                </div>
              )}
            </div>

            {receiptData.payment?.customerMobile && (
              <div className="mt-3 p-2 bg-light rounded">
                <div className="small text-success fw-bold">{t("billing.walletCreated")}</div>
                <div className="small">{t("billing.walletMobile")}: {receiptData.payment.customerMobile}</div>
                <div className="small">
                  {t("billing.discountCredited", {
                    amount: receiptData.payment.discount?.toFixed(2) || "0.00",
                  })}
                </div>
                <div className="small text-muted">{t("billing.useWalletFuture")}</div>
              </div>
            )}
          </div>
        ) : (
          <div>{t("billing.noReceiptData")}</div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" className="receipt-close-btn" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" className="receipt-print-btn" onClick={handlePrint}>
          Print
        </Button>
        <Button variant="success" className="receipt-done-btn" onClick={onDone}>
          {t("billing.done")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReceiptModal;