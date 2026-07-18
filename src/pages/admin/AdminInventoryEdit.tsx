import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getInventory,
  adjustInventory,
  reserveInventory,
  releaseInventory,
  getBatches,
  getAllReservedItems,
  type InventoryStatus,
  type BatchInfo,
  type ReservedItem
} from "../../services/inventoryService";
import {
  getActiveCategories,
  getBrandsByCategory,
  getNamesByBrand,
  getProductBySku,
  type Category,
  type Brand
} from "../../services/productService";
import "./AdminInventoryEdit.css";

type ActionType = "adjust" | "reserve" | "release";

const AdminInventoryEdit: React.FC = () => {
  const { t } = useTranslation();
  const PRODUCT_ID = 1; // later make dynamic

  // ============================================
  // DATA STATES
  // ============================================
  const [inventory, setInventory] = useState<InventoryStatus | null>(null);
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [reservedItems, setReservedItems] = useState<ReservedItem[]>([]);
  
  // CASCADING DROPDOWN STATES
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [productSkus, setProductSkus] = useState<string[]>([]);
  // selectedProduct removed - no longer needed for display

  // ============================================
  // UI STATES
  // ============================================
  const [selectedAction, setSelectedAction] = useState<ActionType>("adjust");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cascadeLoading, setCascadeLoading] = useState(false);

  // ============================================
  // CASCADE FORM STATES (for reserve)
  // ============================================
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [cascadeBatches, setCascadeBatches] = useState<BatchInfo[]>([]);
  const [selectedCascadeBatchNo, setSelectedCascadeBatchNo] = useState<string>("");

  // ============================================
  // FORM STATES
  // ============================================
  const [quantity, setQuantity] = useState<string>("0");
  const [remarks, setRemarks] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>("");
  const [selectedReleaseItem, setSelectedReleaseItem] = useState<string>("");

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const showMessage = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(message);
    }
  };

  const resetForm = () => {
    setQuantity("0");
    setRemarks("");
    setReferenceId("");
  };

  // ============================================
  // DATA LOADING FUNCTIONS
  // ============================================

  const loadInventory = async () => {
    try {
      const res = await getInventory(PRODUCT_ID);
      setInventory(res.data);
    } catch (err) {
      console.error("Failed to load inventory:", err);
      setError("Failed to load inventory data");
    }
  };

  const loadBatches = async () => {
    try {
      const res = await getBatches(PRODUCT_ID);
      const batchesData = res.data || [];
      setBatches(batchesData);
      if (batchesData.length > 0) {
        setSelectedBatchNo(batchesData[0].batchNo);
      }
    } catch (err) {
      console.error("Failed to load batches:", err);
      setBatches([]);
    }
  };

  const loadReservedItems = async () => {
    try {
      // ✅ Load ALL reserved items from all products
      const res = await getAllReservedItems();
      const itemsData = res.data || [];
      
      if (itemsData.length > 0) {
        setReservedItems(itemsData);
        setSelectedReleaseItem(itemsData[0].referenceId);
      } else {
        // No reserved items found
        setReservedItems([]);
        setSelectedReleaseItem("");
      }
    } catch (err) {
      console.error("Failed to load reserved items:", err);
      // If API fails, clear reserved items
      setReservedItems([]);
      setSelectedReleaseItem("");
    }
  };

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const handleAdjustInventory = async (type: "IN" | "OUT") => {
    const qty = parseInt(quantity);
    if (qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await adjustInventory(PRODUCT_ID, qty, type, remarks);
      showMessage("success", `Inventory ${type === "IN" ? "added" : "removed"} successfully`);
      resetForm();
      await loadInventory();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || `Failed to ${type === "IN" ? "add" : "remove"} inventory`;
      showMessage("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReserveInventory = async () => {
    const qty = parseInt(quantity);
    if (qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }
    if (!referenceId.trim()) {
      setError("Please enter a reference ID");
      return;
    }
    if (!selectedBatchNo) {
      setError("Please select a batch");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await reserveInventory(PRODUCT_ID, qty, referenceId, selectedBatchNo);
      showMessage("success", "Inventory reserved successfully!");
      resetForm();
      await Promise.all([loadInventory(), loadBatches(), loadReservedItems()]);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to reserve inventory";
      showMessage("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseInventory = async () => {
    const qty = parseInt(quantity);
    if (qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }
    if (!selectedReleaseItem.trim()) {
      setError("Please select a reserved item to release");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const selectedItem = reservedItems.find(i => i.referenceId === selectedReleaseItem);
      const productId = selectedItem?.productId || PRODUCT_ID;
      console.log("Releasing inventory:", { selectedItem, productId, qty, referenceId: selectedReleaseItem });
      await releaseInventory(productId, qty, selectedReleaseItem);
      showMessage("success", "Inventory released successfully!");
      setQuantity("0");
      await Promise.all([loadInventory(), loadBatches(), loadReservedItems()]);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to release inventory";
      showMessage("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CASCADE DROPDOWN HANDLERS (for reserve)
  // ============================================

  const loadCascadeCategories = async () => {
    try {
      setCascadeLoading(true);
      const res = await getActiveCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories([]);
    } finally {
      setCascadeLoading(false);
    }
  };

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedBrand("");
    setSelectedProductName("");
    setSelectedProductId(null);
    setProductSkus([]);
    setCascadeBatches([]);
    setSelectedCascadeBatchNo("");

    if (!categoryName) {
      setFilteredBrands([]);
      return;
    }

    // Find category ID and load mapped brands
    try {
      setCascadeLoading(true);
      const categoryObj = categories.find(c => c.category === categoryName);
      
      if (!categoryObj) {
        setFilteredBrands([]);
        setCascadeLoading(false);
        return;
      }

      // Load brands mapped to this category by ID
      getBrandsByCategory(categoryObj.id)
        .then((res) => {
          // API now returns Brand objects directly
          setFilteredBrands(res.data || []);
        })
        .catch((err) => {
          console.error("Failed to load mapped brands:", err);
          setFilteredBrands([]);
        })
        .finally(() => setCascadeLoading(false));
    } catch (err) {
      console.error("Failed to handle category change:", err);
      setFilteredBrands([]);
      setCascadeLoading(false);
    }
  };

  const handleBrandChange = (brandId: string) => {
    const brand = filteredBrands.find(b => b.id === Number(brandId));
    setSelectedBrand(brandId);
    setSelectedProductName("");
    setSelectedProductId(null);
    setCascadeBatches([]);
    setSelectedCascadeBatchNo("");

    if (!brandId || !brand) {
      setProductSkus([]);
      return;
    }

    try {
      setCascadeLoading(true);
      getNamesByBrand(Number(brandId))
        .then((res) => {
          setProductSkus(res.data || []);
        })
        .catch((err) => {
          console.error("Failed to load product names:", err);
          setProductSkus([]);
        })
        .finally(() => setCascadeLoading(false));
    } catch (err) {
      console.error("Failed to load product names:", err);
      setProductSkus([]);
      setCascadeLoading(false);
    }
  };

  const handleProductChange = (sku: string) => {
    setSelectedProductName(sku);
    setCascadeBatches([]);
    setSelectedCascadeBatchNo("");

    if (!sku) {
      setSelectedProductId(null);
      return;
    }

    try {
      setCascadeLoading(true);
      getProductBySku(sku)
        .then((res) => {
          const product = res.data;
          if (product && product.id) {
            setSelectedProductId(product.id);

            // Load batches for this product
            return getBatches(product.id);
          }
          return Promise.reject("Product not found");
        })
        .then((res) => {
          setCascadeBatches(res.data || []);
          if (res.data && res.data.length > 0) {
            setSelectedCascadeBatchNo(res.data[0].batchNo);
          }
        })
        .catch((err) => {
          console.error("Failed to load product or batches:", err);
          setSelectedProductId(null);
          setCascadeBatches([]);
        })
        .finally(() => setCascadeLoading(false));
    } catch (err) {
      console.error("Failed to load product:", err);
      setSelectedProductId(null);
      setCascadeLoading(false);
    }
  };

  // ============================================
  // LIFECYCLE
  // ============================================

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        loadInventory(),
        loadBatches(),
        loadReservedItems(),
        loadCascadeCategories()
      ]);
      setLoading(false);
    };
    loadAllData();
  }, []);

  // ✅ Load reserved items when Release tab is selected
  useEffect(() => {
    if (selectedAction === "release") {
      loadReservedItems();
    }
  }, [selectedAction]);

  // ============================================
  // RENDER - LOADING STATE
  // ============================================

  if (loading && !inventory) {
    return (
      <div className="edit-inventory-loading">
        <div className="spinner">
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-text">{t('inventory.loading')}</p>
      </div>
    );
  }

  // ============================================
  // RENDER - MAIN
  // ============================================

  return (
    <div className="edit-inventory-container">
      <h2 className="edit-title">📦 {t('inventory.inventoryManagement')}</h2>

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

      {/* Inventory Stats */}
      {inventory && (
        <div className="inventory-stats">
          <div className="stat-card available">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h3 className="stat-label">{t('inventory.availableQuantity')}</h3>
              <p className="stat-value">{inventory.availableQty}</p>
              <p className="stat-description">{t('inventory.readyForDispatch')}</p>
            </div>
          </div>

          <div className="stat-card reserved">
            <div className="stat-icon">🔒</div>
            <div className="stat-content">
              <h3 className="stat-label">{t('inventory.reservedQuantity')}</h3>
              <p className="stat-value">{inventory.reservedQty}</p>
              <p className="stat-description">{t('inventory.currentlyReserved')}</p>
            </div>
          </div>

          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3 className="stat-label">{t('inventory.totalQuantity')}</h3>
              <p className="stat-value">{(inventory.availableQty || 0) + (inventory.reservedQty || 0)}</p>
              <p className="stat-description">{t('inventory.availablePlusReserved')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Tabs */}
      <div className="action-tabs">
        <button
          className={`action-tab ${selectedAction === "adjust" ? "active" : ""}`}
          onClick={() => {
            setSelectedAction("adjust");
            setError(null);
          }}
        >
          <span className="tab-icon">🔄</span>
          <span className="tab-label">{t('inventory.adjustInventory')}</span>
        </button>
        <button
          className={`action-tab ${selectedAction === "reserve" ? "active" : ""}`}
          onClick={() => {
            setSelectedAction("reserve");
            setError(null);
          }}
        >
          <span className="tab-icon">🔒</span>
          <span className="tab-label">{t('inventory.reserveStock')}</span>
        </button>
        <button
          className={`action-tab ${selectedAction === "release" ? "active" : ""}`}
          onClick={() => {
            setSelectedAction("release");
            setError(null);
            // ✅ Reload reserved items when clicking Release tab
            loadReservedItems();
          }}
        >
          <span className="tab-icon">🔓</span>
          <span className="tab-label">{t('inventory.releaseStock')}</span>
        </button>
      </div>

      {/* ADJUST ACTION */}
      {selectedAction === "adjust" && (
        <div className="action-form adjust-form">
          <div className="form-header">
            <h3>🔄 {t('inventory.adjustInventoryHeader')}</h3>
            <p className="form-description">{t('inventory.increaseDecreaseQuantity')}</p>
          </div>

          <form className="form-grid">
            <div className="form-group">
              <label htmlFor="qty-adjust" className="form-label">{t('inventory.quantity')} *</label>
              <input
                id="qty-adjust"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={t('inventory.enterQuantity')}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="remarks-adjust" className="form-label">{t('inventory.remarks')}</label>
              <input
                id="remarks-adjust"
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={t('inventory.remarksPlaceholder')}
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => handleAdjustInventory("IN")}
                disabled={loading || parseInt(quantity) <= 0}
                className="btn btn-success"
              >
                <span className="btn-icon">➕</span>
                <span className="btn-text">{t('inventory.addToStock')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleAdjustInventory("OUT")}
                disabled={loading || parseInt(quantity) <= 0}
                className="btn btn-danger"
              >
                <span className="btn-icon">➖</span>
                <span className="btn-text">{t('inventory.removeFromStock')}</span>
              </button>
            </div>
          </form>

          <div className="form-info">
            <div className="info-item">
              <span className="info-icon">ℹ️</span>
              <span className="info-text">{t('inventory.adjustNote')}</span>
            </div>
          </div>
        </div>
      )}

      {/* RESERVE ACTION */}
      {selectedAction === "reserve" && (
        <div className="action-form reserve-form">
          <div className="form-header">
            <h3>🔒 {t('inventory.reserveStockForOrder')}</h3>
            <p className="form-description">{t('inventory.reserveInventoryDesc')}</p>
          </div>

          {/* CASCADE DROPDOWN SECTION */}
          <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
            <h4 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 700 }}>📋 {t('inventory.selectProductCascade')}</h4>
            
            <form className="form-grid" style={{ gap: "1rem" }}>
              {/* CATEGORY DROPDOWN */}
              <div className="form-group">
                <label htmlFor="cascade-category" className="form-label">{t('inventory.category')} *</label>
                <select
                  id="cascade-category"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="form-input"
                  disabled={cascadeLoading || categories.length === 0}
                >
                  <option value="">{t('inventory.selectCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* BRAND DROPDOWN */}
              <div className="form-group">
                <label htmlFor="cascade-brand" className="form-label">{t('inventory.brand')} *</label>
                <select
                  id="cascade-brand"
                  value={selectedBrand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="form-input"
                  disabled={!selectedCategory || cascadeLoading || filteredBrands.length === 0}
                >
                  <option value="">{t('inventory.selectBrand')}</option>
                  {filteredBrands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* PRODUCT DROPDOWN */}
              <div className="form-group">
                <label htmlFor="cascade-product" className="form-label">{t('inventory.productName')} *</label>
                <select
                  id="cascade-product"
                  value={selectedProductName}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="form-input"
                  disabled={!selectedBrand || cascadeLoading || productSkus.length === 0}
                >
                  <option value="">{t('inventory.selectProduct')}</option>
                  {productSkus.map((sku, idx) => (
                    <option key={idx} value={sku}>
                      {sku}
                    </option>
                  ))}
                </select>
              </div>

              {/* LOADING INDICATOR */}
              {cascadeLoading && (
                <div style={{ padding: "0.5rem", color: "#666", fontSize: "0.9rem" }}>
                  ⏳ {t('inventory.loadingIndicator')}
                </div>
              )}
            </form>

            {/* Only Batch Dropdown - Product Details Removed */}
          </div>

          {/* BATCH SELECTION DROPDOWN ONLY */}
          {selectedProductId && (
            <>
              <form className="form-grid">
                <div className="form-group">
                  <label htmlFor="batch-reserve-cascade" className="form-label">{t('inventory.selectBatch')} *</label>
                  <select
                    id="batch-reserve-cascade"
                    value={selectedCascadeBatchNo}
                    onChange={(e) => setSelectedCascadeBatchNo(e.target.value)}
                    className="form-input"
                  >
                    <option value="">{t('inventory.chooseBatch')}</option>
                    {cascadeBatches.map((batch, index) => (
                      <option key={index} value={batch.batchNo}>
                        {batch.batchNo} (Available: {batch.availableQty}, Expiry: {typeof batch.expiryDate === 'string' ? batch.expiryDate : new Date(batch.expiryDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="qty-reserve-cascade" className="form-label">{t('inventory.quantityToReserve')} *</label>
                  <input
                    id="qty-reserve-cascade"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={t('inventory.enterQuantity')}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ref-reserve-cascade" className="form-label">{t('inventory.referenceId')} *</label>
                  <input
                    id="ref-reserve-cascade"
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder={t('inventory.referenceIdPlaceholder')}
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedProductId && selectedCascadeBatchNo) {
                        // Reserve using cascade values
                        reserveInventory(selectedProductId, parseInt(quantity), referenceId, selectedCascadeBatchNo)
                          .then(() => {
                            showMessage("success", t('inventory.reservedSuccessfully'));
                            setQuantity("0");
                            setReferenceId("");
                            setSelectedCategory("");
                            setSelectedBrand("");
                            setSelectedProductName("");
                            setSelectedProductId(null);
                            setSelectedCascadeBatchNo("");
                            setCascadeBatches([]);
                            Promise.all([loadInventory(), loadReservedItems()]);
                          })
                          .catch((err: any) => {
                            const errorMsg = err?.response?.data?.message || err?.message || "Failed to reserve inventory";
                            showMessage("error", errorMsg);
                          });
                      }
                    }}
                    disabled={loading || parseInt(quantity) <= 0 || !referenceId.trim() || !selectedCascadeBatchNo || !selectedProductId}
                    className="btn btn-primary"
                  >
                    <span className="btn-icon">🔒</span>
                    <span className="btn-text">{t('inventory.reserveNow')}</span>
                  </button>
                </div>
              </form>
            </>
          )}

          {/* FALLBACK: OLD RESERVE METHOD FOR FIXED PRODUCT */}
          {!selectedProductId && (
            <>
              <h4 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 700, marginTop: "2rem" }}>📦 {t('inventory.quickReserveFor')} {PRODUCT_ID}</h4>

              {batches.length > 0 ? (
                <div className="batches-info-container">
                  <h4 className="batches-title">📦 {t('inventory.availableBatches')} ({batches.filter(b => b.availableQty > 0).length} {t('inventory.withStock')})</h4>
                  <div className="batches-grid">
                    {batches.map((batch, index) => (
                      <div
                        key={index}
                        className={`batch-card ${selectedBatchNo === batch.batchNo ? "selected" : ""} ${batch.availableQty === 0 ? "no-stock" : ""}`}
                        onClick={() => batch.availableQty > 0 && setSelectedBatchNo(batch.batchNo)}
                        title={batch.availableQty === 0 ? t('inventory.noStockInBatch') : `${t('inventory.clickToSelect')} ${batch.batchNo}`}
                      >
                        <div className="batch-header">
                          <span className="batch-label">{t('inventory.batchLabel')}</span>
                          <span className="batch-value">{batch.batchNo}</span>
                        </div>
                        <div className="batch-details">
                          <div className="batch-detail-item">
                            <span className="detail-label">{t('inventory.availableTxt')}</span>
                            <span className="detail-value" style={{ color: batch.availableQty === 0 ? '#ef5350' : '#22c55e' }}>
                              {batch.availableQty}
                            </span>
                          </div>
                          <div className="batch-detail-item">
                            <span className="detail-label">{t('inventory.expiryTxt')}</span>
                            <span className="detail-value">
                              {typeof batch.expiryDate === 'string' ? batch.expiryDate : new Date(batch.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-reserved-items">
                  <p className="empty-icon">📭</p>
                  <p className="empty-text">{t('inventory.noBatchesFound')}</p>
                </div>
              )}

              <form className="form-grid">
                <div className="form-group">
                  <label htmlFor="batch-reserve" className="form-label">{t('inventory.selectBatch')} *</label>
                  <select
                    id="batch-reserve"
                    value={selectedBatchNo}
                    onChange={(e) => setSelectedBatchNo(e.target.value)}
                    className="form-input"
                  >
                    <option value="">{t('inventory.chooseBatch')}</option>
                    {batches.map((batch, index) => (
                      <option key={index} value={batch.batchNo}>
                        {batch.batchNo} (Available: {batch.availableQty}, Expiry: {typeof batch.expiryDate === 'string' ? batch.expiryDate : new Date(batch.expiryDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="qty-reserve" className="form-label">{t('inventory.quantityToReserve')} *</label>
                  <input
                    id="qty-reserve"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={t('inventory.enterQuantity')}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ref-reserve" className="form-label">{t('inventory.referenceId')} *</label>
                  <input
                    id="ref-reserve"
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder={t('inventory.referenceIdPlaceholder')}
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleReserveInventory}
                    disabled={loading || parseInt(quantity) <= 0 || !referenceId.trim() || !selectedBatchNo}
                    className="btn btn-primary"
                  >
                    <span className="btn-icon">🔒</span>
                    <span className="btn-text">{t('inventory.reserveNow')}</span>
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="form-info">
            <div className="info-item">
              <span className="info-icon">ℹ️</span>
              <span className="info-text">{t('inventory.reserveNote')}</span>
            </div>
          </div>
        </div>
      )}

      {/* RELEASE ACTION */}
      {selectedAction === "release" && (
        <div className="action-form release-form">
          <div className="form-header">
            <h3>🔓 {t('inventory.releaseReservedStock')}</h3>
            <p className="form-description">{t('inventory.releaseStockDesc')}</p>
          </div>

          {reservedItems.length > 0 ? (
            <form className="form-grid">
              <div className="form-group">
                <label htmlFor="release-item" className="form-label">{t('inventory.selectReservedProduct')} *</label>
                <select
                  id="release-item"
                  value={selectedReleaseItem}
                  onChange={(e) => {
                    const item = reservedItems.find(i => i.referenceId === e.target.value);
                    if (item) {
                      setSelectedReleaseItem(e.target.value);
                      setQuantity(item.quantity.toString());
                    }
                  }}
                  className="form-input"
                >
                  <option value="">{t('inventory.chooseReservedProduct')}</option>
                  {reservedItems.map((item, index) => (
                    <option key={index} value={item.referenceId}>
                     {item.sku} | {item.quantity} | {item.productId}
                    </option>
                  ))}
                </select>
              </div>

              {selectedReleaseItem && (
                <>
                  <div className="form-group">
                    <label htmlFor="qty-release" className="form-label">{t('inventory.quantityToRelease')} *</label>
                    <input
                      id="qty-release"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder={t('inventory.enterQuantity')}
                      className="form-input"
                      max={selectedReleaseItem ? reservedItems.find(i => i.referenceId === selectedReleaseItem)?.quantity : 0}
                    />
                  </div>
                </>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleReleaseInventory}
                  disabled={loading || parseInt(quantity) <= 0 || !selectedReleaseItem}
                  className="btn btn-warning"
                >
                  <span className="btn-icon">🔓</span>
                    <span className="btn-text">{t('inventory.releaseNow')}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="empty-reserved-items">
              <p className="empty-icon">📭</p>
              <p className="empty-text">{t('inventory.noReservedItems')}</p>
              <p className="empty-hint">
                💡 {t('inventory.releaseHint')}
              </p>
            </div>
          )}

          <div className="form-info">
            <div className="info-item">
              <span className="info-icon">ℹ️</span>
              <span className="info-text">Released stock will be added back to available inventory and can be sold again</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryEdit;
