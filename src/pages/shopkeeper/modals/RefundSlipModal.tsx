import { Button, Modal, Table } from "react-bootstrap";

interface RefundSlipItem {
  sku: string;
  qty: number;
  unitPrice: number;
  gross: number;
}

interface RefundSlipTotals {
  totalGross: number;
  walletCredit: number;
  discountReversed: number;
  cashRefund: number;
  netWalletChange: number;
}

interface RefundSlipData {
  billId: string;
  date: string;
  customerId: string;
  items: RefundSlipItem[];
  totals: RefundSlipTotals;
}

interface RefundSlipModalProps {
  show: boolean;
  refundSlipData: RefundSlipData | null;
  getLocalized: (en?: string, hi?: string) => string;
  onClose: () => void;
}

const RefundSlipModal = ({
  show,
  refundSlipData,
  getLocalized,
  onClose,
}: RefundSlipModalProps) => {
  const handlePrint = () => {
    const content = document.getElementById("refund-slip-content");
    if (!content) return;
    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) { alert("Unable to open print window"); return; }
    w.document.write(
      `<html><head><title>Refund Slip</title><style>
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
          Refund Slip - {refundSlipData?.billId || ""}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {refundSlipData ? (
          <div id="refund-slip-content">
            <h5>Refund Slip</h5>
            <div className="small text-muted">Bill: {refundSlipData.billId}</div>
            <div className="small text-muted">Date: {refundSlipData.date}</div>

            <Table size="sm" className="mt-2">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Gross</th>
                </tr>
              </thead>
              <tbody>
                {refundSlipData.items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.sku}</td>
                    <td>{it.qty}</td>
                    <td>₹{it.unitPrice.toFixed(2)}</td>
                    <td>₹{it.gross.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="mt-3">
              <div className="d-flex justify-content-between">
                <div>Total Gross</div>
                <div>₹{refundSlipData.totals.totalGross.toFixed(2)}</div>
              </div>
              <div className="d-flex justify-content-between">
                <div>Wallet Credit</div>
                <div>₹{(refundSlipData.totals.walletCredit || 0).toFixed(2)}</div>
              </div>
              <div className="d-flex justify-content-between">
                <div>Discount Reversed (wallet)</div>
                <div>₹{(refundSlipData.totals.discountReversed || 0).toFixed(2)}</div>
              </div>
              <div className="d-flex justify-content-between">
                <div>Cash/Card Refund</div>
                <div>₹{(refundSlipData.totals.cashRefund || 0).toFixed(2)}</div>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold">
                <div>Net Wallet Change</div>
                <div>₹{(refundSlipData.totals.netWalletChange || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div>No refund data available</div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          Print
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RefundSlipModal;