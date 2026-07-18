import React, { useEffect, useState } from "react";
import {
  Badge,
  Form,
  InputGroup,
  Container,
  Modal
} from "react-bootstrap";
import ShopkeeperHeader from "../../components/ShopkeeperHeader";
import api from "../../services/api";
import "./Inventory.css";

/* =======================
   Interfaces
======================= */

interface Batch {
  batchNo: string;
  expiry: string;
  qty: number;
}

interface InventoryProduct {
  productId: string;
  productSku: string;
  productName: string;
  totalQty: number;
  batches: Batch[];
  barcode?: string;
}

/* =======================
   Constants
======================= */

const LOW_STOCK_LIMIT = 20;
const EXPIRY_WARNING_DAYS = 30;

/* =======================
   Component
======================= */

const Inventory: React.FC = () => {
  const [data, setData] = useState<InventoryProduct[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  /* =======================
     Load Inventory
  ======================= */

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const res = await api.get("/inventory");
        const inventoryData = res.data as InventoryProduct[];
        
        // Fetch product details including barcode for each product
        const enrichedData = await Promise.all(
          inventoryData.map(async (product) => {
            try {
              const productRes = await api.get(`/products/${product.productId}`);
              return {
                ...product,
                barcode: productRes.data?.barcode || undefined
              };
            } catch (error) {
              console.error(`Failed to fetch product ${product.productId}`, error);
              return product;
            }
          })
        );
        
        setData(enrichedData);
        setFilteredData(enrichedData);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  /* =======================
     Search Filter
  ======================= */

  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredData(
      data.filter(
        p =>
          p.productName.toLowerCase().includes(q) ||
          p.productSku.toLowerCase().includes(q)
      )
    );
  }, [search, data]);

  /* =======================
     Helpers
  ======================= */

  const getExpiryBadge = (expiry: string) => {
    const today = new Date();
    const exp = new Date(expiry);
    const diffDays =
      (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return <Badge bg="danger">Expired</Badge>;
    if (diffDays <= EXPIRY_WARNING_DAYS)
      return <Badge bg="warning">Near Expiry</Badge>;
    return <Badge bg="success">Valid</Badge>;
  };

  /* =======================
     Loading UI
  ======================= */

  if (loading) {
    return (
      <div className="inventory-loading-container">
        <div className="inventory-spinner"></div>
        <p>Loading inventory...</p>
      </div>
    );
  }

  /* =======================
     UI
  ======================= */

  return (
    <div className="inventory-page-container">
      <ShopkeeperHeader 
        title="📦 Inventory Overview"
        description="Check stock levels and batch information"
      />
      
      <Container className="inventory-content">
        {/* Search Header */}
        <div className="inventory-search-card">
          <div className="inventory-search-header">
            <h3 className="inventory-search-title">Inventory Search</h3>
          </div>
          <div className="inventory-search-body">
            <InputGroup className="inventory-search-input-group">
              <Form.Control
                placeholder="Search by SKU or Product Name"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="inventory-input"
              />
              <span className="inventory-search-icon">🔍</span>
            </InputGroup>
          </div>
        </div>

        {/* Products Grid */}
        <div className="inventory-products">
          {filteredData.map(product => (
            <div key={product.productId} className="inventory-product-card">
              <div className="inventory-product-header">
                <div className="inventory-product-info">
                  <h4 className="inventory-product-name">{product.productName}</h4>
                  <div className="inventory-product-sku-section">
                    <div className="inventory-product-sku">SKU: {product.productSku}</div>
                    {product.barcode && (
                      <div className="inventory-product-barcode">
                        <img
                          src={`data:image/png;base64,${product.barcode}`}
                          alt="barcode"
                          className="inventory-product-barcode-img"
                          onClick={() => { setBarcodePreview(product.barcode || null); setShowBarcodeModal(true); }}
                          title="Click to preview barcode"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <Badge className="inventory-total-qty-badge">
                  Total Qty: {product.totalQty}
                </Badge>
              </div>

              {/* Batch Table */}
              <div className="inventory-batches-wrapper">
                <table className="inventory-batches-table">
                  <thead>
                    <tr>
                      <th>Batch No</th>
                      <th>Expiry Date</th>
                      <th className="inventory-th-center">Quantity</th>
                      <th className="inventory-th-center">Expiry Status</th>
                      <th className="inventory-th-center">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.batches.map(batch => {
                      const isLowStock = batch.qty <= LOW_STOCK_LIMIT;

                      return (
                        <tr key={batch.batchNo} className={isLowStock ? "inventory-low-stock-row" : ""}>
                          <td className="inventory-batch-no">{batch.batchNo}</td>
                          <td className="inventory-expiry-date">
                            {new Date(batch.expiry).toLocaleDateString()}
                          </td>
                          <td className="inventory-quantity">{batch.qty}</td>
                          <td className="inventory-td-center">
                            {getExpiryBadge(batch.expiry)}
                          </td>
                          <td className="inventory-td-center">
                            {isLowStock ? (
                              <Badge className="inventory-badge-danger">Low Stock</Badge>
                            ) : (
                              <Badge className="inventory-badge-success">In Stock</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="inventory-empty-state">
            <div className="inventory-empty-icon">📭</div>
            <p className="inventory-empty-text">No inventory items found</p>
          </div>
        )}

        {/* Barcode Preview Modal */}
        <Modal show={showBarcodeModal} onHide={() => setShowBarcodeModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Barcode Preview</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            {barcodePreview ? (
              <>
                <img src={`data:image/png;base64,${barcodePreview}`} alt="barcode" style={{maxWidth: '100%'}} />
                <div className="mt-3">
                  <a href={`data:image/png;base64,${barcodePreview}`} download="barcode.png" className="btn btn-outline-primary btn-sm">📥 Download</a>
                </div>
              </>
            ) : (
              <div className="text-muted">No preview available</div>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
};

export default Inventory;
