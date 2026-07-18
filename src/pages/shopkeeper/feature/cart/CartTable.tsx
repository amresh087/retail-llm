import { Button, Table } from "react-bootstrap";
import type { CartItem } from "../../../../services/billingApi";

interface CartTableProps {
  cart: CartItem[];
  getLocalized: (en?: string, hi?: string) => string;
  increaseQty: (productId: string, batchNo: string) => void;
  decreaseQty: (productId: string, batchNo: string) => void;
  openBatchAllocModal: (item: CartItem) => void;
  t: (key: string, opts?: any) => string;
}

const CartTable = ({
  cart,
  getLocalized,
  increaseQty,
  decreaseQty,
  openBatchAllocModal,
  t,
}: CartTableProps) => {
  return (
    <Table striped bordered hover size="sm" className="mt-3">
      <thead>
        <tr>
          <th>SKU</th>
          <th style={{ width: 180 }}>{t("billing.table.item")}</th>
          <th style={{ width: 180 }}>{t("billing.table.qty")}</th>
          <th style={{ width: 120 }}>{t("billing.table.price")}</th>
          <th style={{ width: 100 }}>{t("billing.table.discount")}</th>
          <th style={{ width: 140 }}>{t("billing.table.total")}</th>
          <th style={{ width: 100 }}>{t("billing.table.action")}</th>
        </tr>
      </thead>
      <tbody>
        {cart.map((i) => {
          const discountPerUnit = i.discountAmount ?? 0;
          const totalDiscount = discountPerUnit * i.qty;
          const priceAfterDiscount = Math.max(0, (i.price ?? 0) - discountPerUnit);
          const cartItemTotal = priceAfterDiscount * i.qty;

          return (
            <tr key={`${i.productId}-${i.batchNo}`}>
              <td style={{ width: 180 }}>{i.sku}</td>
              <td style={{ maxWidth: 300 }}>
                {getLocalized(i.name, i.nameHi) || i.sku}
              </td>
              <td>
                <div className="d-flex align-items-center">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => decreaseQty(i.productId, i.batchNo)}
                  >
                    -
                  </Button>
                  <div className="px-3">{i.qty}</div>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => increaseQty(i.productId, i.batchNo)}
                  >
                    +
                  </Button>
                  <div className="ms-auto small text-muted">
                    {t("billing.available")}: {i.availableQty}
                  </div>
                </div>
              </td>
              <td>₹{i.price.toFixed(2)}</td>
              <td>₹{totalDiscount.toFixed(2)}</td>
              <td>₹{cartItemTotal.toFixed(2)}</td>
              <td>
                <Button
                  size="sm"
                  variant="info"
                  onClick={() => openBatchAllocModal(i)}
                >
                  Split
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default CartTable;