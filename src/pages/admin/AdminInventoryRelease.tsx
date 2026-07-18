import React, { useEffect, useState } from "react";
import {
  getInventory,
  releaseInventory,
  getReservedItems,
  type InventoryStatus,
  type ReservedItem
} from "../../services/inventoryService";
import "./AdminInventoryRelease.css";

const AdminInventoryRelease: React.FC = () => {
  const PRODUCT_ID = 1; // later make dynamic

  const [inventory, setInventory] = useState<InventoryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [quantity, setQuantity] = useState<string>("0");
  const [referenceId, setReferenceId] = useState("");

  // Reserved items list
  const [reservedItems, setReservedItems] = useState<ReservedItem[]>([]);

  const loadInventory = () => {
    setLoading(true);
    getInventory(PRODUCT_ID)
      .then(res => setInventory(res.data))
      .catch(err => {
        setError("Failed to load inventory data");
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const loadReservedItems = () => {
    console.log("Loading reserved items for product:", PRODUCT_ID);
    getReservedItems(PRODUCT_ID)
      .then(res => {
        console.log("Reserved items response:", res);
        const items = res.data || [];
        console.log("Reserved items data:", items);
        setReservedItems(items);
      })
      .catch(err => {
        console.error("Failed to load reserved items:", err);
        setReservedItems([]);
      });
  };

  useEffect(() => {
    loadInventory();
    loadReservedItems();
  }, []);

  const handleReleaseInventory = async () => {
    const qty = parseInt(quantity);
    if (qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }
    if (!referenceId.trim()) {
      setError("Please enter a reference ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Attempting to release:", { PRODUCT_ID, qty, referenceId });
      const response = await releaseInventory(PRODUCT_ID, qty, referenceId);
      console.log("Release response:", response);
      setSuccess("✅ Inventory released successfully! Stock is now available.");
      setQuantity("0");
      setReferenceId("");
      // Reload all data
      loadInventory();
      loadReservedItems();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error("Release error - Full error:", err);
      console.error("Error response:", err?.response?.data);
      console.error("Error message:", err?.message);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to release inventory";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !inventory && reservedItems.length === 0) {
    return (
      <div className="release-inventory-loading">
        <div className="spinner">
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-text">Loading inventory and reserved items...</p>
      </div>
    );
  }

  return (
    <div className="release-inventory-container">
      <h2 className="release-title">🔓 Release Reserved Inventory</h2>
      <p className="release-subtitle">Return reserved stock back to available inventory for other orders</p>

      {/* Alert Messages */}
      {error && (
        <div className="alert-message alert-danger">
          <span className="alert-icon">⚠️</span>
          <span className="alert-text">{error}</span>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert-message alert-success">
          <span className="alert-icon">✓</span>
          <span className="alert-text">{success}</span>
          <button className="alert-close" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Inventory Status */}
      {inventory && (
        <div className="inventory-status">
          <div className="status-card available">
            <div className="status-icon">📦</div>
            <div className="status-info">
              <h3>Available Quantity</h3>
              <p className="status-value">{inventory.availableQty}</p>
            </div>
          </div>

          <div className="status-card reserved">
            <div className="status-icon">🔒</div>
            <div className="status-info">
              <h3>Reserved Quantity</h3>
              <p className="status-value">{inventory.reservedQty}</p>
            </div>
          </div>

          <div className="status-card total">
            <div className="status-icon">📊</div>
            <div className="status-info">
              <h3>Total Quantity</h3>
              <p className="status-value">{(inventory.availableQty || 0) + (inventory.reservedQty || 0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reserved Items List */}
      <div className="reserved-items-section">
        <h3 className="section-title">📋 Reserved Items ({reservedItems.length})</h3>

        {reservedItems.length > 0 ? (
          <div className="reserved-items-grid">
            {reservedItems.map((item, index) => (
              <div
                key={index}
                className="reserved-item-card"
                onClick={() => {
                  setReferenceId(item.referenceId);
                  setQuantity(item.quantity.toString());
                }}
              >
                <div className="item-header">
                  <span className="item-ref-label">Reference:</span>
                  <span className="item-ref-value">{item.referenceId}</span>
                </div>
                <div className="item-body">
                  <div className="item-detail">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value">{item.quantity} units</span>
                  </div>
                  {item.reservedDate && (
                    <div className="item-detail">
                      <span className="detail-label">Reserved Since:</span>
                      <span className="detail-value">{new Date(item.reservedDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="item-action">
                  <button className="quick-select-btn" onClick={(e) => {
                    e.stopPropagation();
                    setReferenceId(item.referenceId);
                    setQuantity(item.quantity.toString());
                  }}>
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-reserved">
            <p className="empty-icon">✨</p>
            <p className="empty-text">No reserved items. All stock is available!</p>
          </div>
        )}
      </div>

      {/* Release Form */}
      <div className="release-form-container">
        <h3 className="form-title">🔓 Release Form</h3>

        {reservedItems.length > 0 && (
          <div className="form-hint">
            <span className="hint-icon">💡</span>
            <span className="hint-text">Click on a reserved item above to auto-fill the form, or enter details manually</span>
          </div>
        )}

        <form className="release-form">
          <div className="form-group">
            <label htmlFor="release-ref" className="form-label">Reference ID *</label>
            <input
              id="release-ref"
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g., ORDER-1001, PO-2024-03"
              className="form-input"
              list="ref-list"
            />
            <datalist id="ref-list">
              {reservedItems.map((item, index) => (
                <option key={index} value={item.referenceId} />
              ))}
            </datalist>
            {referenceId && !reservedItems.some(item => item.referenceId === referenceId) && reservedItems.length > 0 && (
              <small className="form-warning">
                ⚠️ This reference is not in the reserved list
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="release-qty" className="form-label">Quantity to Release *</label>
            <input
              id="release-qty"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="form-input"
            />
          </div>

          <button
            type="button"
            onClick={handleReleaseInventory}
            disabled={loading || parseInt(quantity) <= 0 || !referenceId.trim()}
            className="btn btn-release"
          >
            <span className="btn-icon">🔓</span>
            <span className="btn-text">Release Inventory</span>
          </button>
        </form>
      </div>

      {/* Info Section */}
      <div className="info-section">
        <h3 className="info-title">ℹ️ How Release Works</h3>
        <div className="info-cards">
          <div className="info-card">
            <span className="info-num">1</span>
            <h4>Select Reserved Item</h4>
            <p>Click on a reserved item from the list above or enter the reference ID manually</p>
          </div>
          <div className="info-card">
            <span className="info-num">2</span>
            <h4>Enter Quantity</h4>
            <p>Specify how many units to release from this reservation</p>
          </div>
          <div className="info-card">
            <span className="info-num">3</span>
            <h4>Release Inventory</h4>
            <p>Click the Release button to return stock to available inventory</p>
          </div>
          <div className="info-card">
            <span className="info-num">4</span>
            <h4>Stock Available</h4>
            <p>Released inventory becomes available for new orders immediately</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInventoryRelease;
