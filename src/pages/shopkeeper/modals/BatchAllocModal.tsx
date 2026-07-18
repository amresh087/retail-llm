import { Button, Modal, Form } from "react-bootstrap";

interface BatchOption {
  batchNo?: string;
  id?: string | number;
  availableQty?: number;
  expiryDate?: string;
}

interface BatchAllocModalProps {
  show: boolean;
  batchOptions: BatchOption[];
  batchModalSelectedBatches: string[];
  batchModalQtyMap: Record<string, number>;
  batchModalTotalQty: number;
  t: (key: string, opts?: any) => string;
  onClose: () => void;
  onApply: () => void;
  onDistribute: (total: number) => void;
  onToggleBatch: (batchNo: string) => void;
  onQtyChange: (batchNo: string, qty: number) => void;
  onTotalQtyChange: (qty: number) => void;
}

const BatchAllocModal = ({
  show,
  batchOptions,
  batchModalSelectedBatches,
  batchModalQtyMap,
  batchModalTotalQty,
  t,
  onClose,
  onApply,
  onDistribute,
  onToggleBatch,
  onQtyChange,
  onTotalQtyChange,
}: BatchAllocModalProps) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Choose Batch / Quantity</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {batchOptions && batchOptions.length > 0 ? (
          <div>
            <div className="mb-2 small text-muted">Select batch</div>

            {/* Total Qty + Auto distribute */}
            <div className="d-flex align-items-center mb-3">
              <div style={{ width: 160 }} className="me-2">
                <Form.Label>Total Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  value={batchModalTotalQty}
                  onChange={(e) => onTotalQtyChange(Number(e.target.value) || 0)}
                />
              </div>
              <div style={{ marginTop: 22 }}>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => onDistribute(batchModalTotalQty)}
                >
                  Auto-distribute
                </Button>
              </div>
            </div>

            {/* Batch list */}
            <div style={{ maxHeight: "220px", overflowY: "auto" }}>
              {batchOptions.map((b, idx) => {
                const bNo = b.batchNo ?? String(b.id ?? "");
                const checked = batchModalSelectedBatches.includes(bNo);
                const expiry = b.expiryDate
                  ? new Date(b.expiryDate).toLocaleDateString()
                  : null;

                return (
                  <div key={idx} className="d-flex align-items-center mb-2">
                    <div className="form-check me-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`batch-${idx}`}
                        checked={checked}
                        onChange={() => onToggleBatch(bNo)}
                      />
                    </div>
                    <label
                      className="form-check-label flex-grow-1"
                      htmlFor={`batch-${idx}`}
                      style={{ marginRight: "8px" }}
                    >
                      {bNo} — {b.availableQty ?? 0} units
                      {expiry ? ` — Exp: ${expiry}` : ""}
                    </label>
                    <div style={{ width: 100 }}>
                      <Form.Control
                        type="number"
                        min={1}
                        value={batchModalQtyMap[bNo] ?? 1}
                        onChange={(e) =>
                          onQtyChange(bNo, Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted">
            No batch information available
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onApply}>
          Add
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BatchAllocModal;