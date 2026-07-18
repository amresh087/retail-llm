import { Button, Modal } from "react-bootstrap";

interface CancelConfirmModalProps {
  show: boolean;
  isCancelling: boolean;
  t: (key: string, opts?: any) => string;
  onClose: () => void;
  onConfirm: () => void;
}

const CancelConfirmModal = ({
  show,
  isCancelling,
  t,
  onClose,
  onConfirm,
}: CancelConfirmModalProps) => {
  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>⚠️ Cancel Bill</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="alert alert-warning mb-3">
          <strong>{t("billing.cancelBillConfirm")}</strong>
        </div>
        <p>{t("billing.cancelBillWill")}</p>
        <ul>
          <li>{t("billing.cancelBillList.release")}</li>
          <li>{t("billing.cancelBillList.cancelSession")}</li>
          <li>{t("billing.cancelBillList.allowRestart")}</li>
        </ul>
        <p className="text-muted mb-0">{t("billing.cannotUndo")}</p>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isCancelling}
        >
          {t("billing.keepBill")}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={isCancelling}
        >
          {isCancelling ? t("billing.cancelling") : t("billing.cancelBill")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CancelConfirmModal;