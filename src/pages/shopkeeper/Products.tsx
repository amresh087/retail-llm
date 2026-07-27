import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Form,
  Modal
} from "react-bootstrap";
import ShopkeeperHeader from "../../components/ShopkeeperHeader";
import api from "../../services/api";
import {
  getAllProducts,
  getProductByBarcode,
  getBrandsByCategory,
  type Product,
  type Brand
} from "../../services/productService";
import "./Products.css";

interface Category {
  id: number;
  category: string;
  categoryHi?: string;
  isActive: boolean;
}

const Products: React.FC = () => {
  const { i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  /* 🔍 Filters & Pagination */
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const emptyProduct: Product = {
    sku: "",
    name: "",
    nameHi: "",
    description: "",
    category: "",
    categoryHi: "",
    brandName: "",
    brandNameHi: "",
    unit: "",
    price: 0,
    status: "ACTIVE",
    externalBarcode: ""
  };

  const [formData, setFormData] = useState<Product>(emptyProduct);
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  
  // Barcode scanner state
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Input mode: "manual" or "barcode"
  const [inputMode, setInputMode] = useState<"manual" | "barcode">("manual");

  const loadProducts = () => {
    setLoading(true);
    getAllProducts()
      .then(res => setProducts(res.data))
      .finally(() => setLoading(false));
  };

  const getLocalized = (en?: string, hi?: string): string => {
    const enText = en || '';
    const hiText = hi || '';
    const language = i18n.language || 'en';
    return language.startsWith('hi') ? (hiText || enText) : (enText || hiText);
  };

  const loadCategories = async () => {
    try {
      const response = await api.get("/products/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const loadBrandsByCategory = async (categoryName: string) => {
    if (!categoryName) {
      console.log('⚠️ No category selected, clearing brands');
      setBrands([]);
      setFilterBrand("");
      return;
    }

    try {
      setLoadingBrands(true);
      // Find category ID from category name
      const categoryObj = categories.find(cat => cat.category === categoryName);
      if (!categoryObj || !categoryObj.id) {
        console.warn('⚠️ Category ID not found');
        setBrands([]);
        return;
      }

      const categoryId = categoryObj.id;
      console.log('📡 Loading brands for categoryId:', categoryId);
      
      const response = await getBrandsByCategory(categoryId);
      console.log('✅ Brands loaded:', response.data?.length);
      setBrands(response.data || []);
    } catch (error) {
      console.error("Failed to load brands:", error);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const openModal = (product?: Product) => {
    setEditing(product || null);
    setFormData(product ?? emptyProduct);
    setInputMode("manual"); // Reset to manual when opening modal
    setBarcodeInput("");
    setScanError(null);
    setShow(true);
  };

  /**
   * Handle barcode scanning - searches for product by SKU or external barcode
   */
  const handleBarcodeScan = async () => {
    if (!barcodeInput.trim()) {
      setScanError("Please enter a barcode");
      return;
    }

    setBarcodeScanning(true);
    setScanError(null);

    try {
      const response = await getProductByBarcode(barcodeInput.trim());
      const product = response.data;

      // Pre-fill the form with scanned product data
      setFormData({
        ...product,
        sku: product.sku || "",
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        brandName: product.brandName || "",
        unit: product.unit || "",
        price: product.price || 0,
        discountAmount: product.discountAmount || 0,
        status: product.status || "ACTIVE",
        externalBarcode: product.externalBarcode || ""
      });

      setBarcodeInput("");
      setScanError(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Product not found";
      setScanError(`❌ ${errorMessage}. Create a new product instead.`);
    } finally {
      setBarcodeScanning(false);
    }
  };

  /* 🔎 Filter logic */
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const normalizedSearch = search.toLowerCase();
      const matchSearch = [
        p.name,
        p.nameHi,
        p.category,
        p.categoryHi,
        p.brandName,
        p.brandNameHi,
        p.sku,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchCategory = !filterCategory || p.category === filterCategory;
      const matchBrand = !filterBrand || p.brandId?.toString() === filterBrand;

      return matchSearch && matchCategory && matchBrand;
    });
  }, [products, search, filterCategory, filterBrand]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, filterBrand]);

  /* 📄 Pagination logic */
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <div className="products-loading-container">
        <div className="products-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="products-page-container">
      <div className="products-content">
        <ShopkeeperHeader 
          title="Product Management"
          description="Browse and manage all products in your store"
        />

        {/* Search & Filters Card */}
        <div className="products-search-card">
          <div className="products-search-header">
            <h3 className="products-search-title">🔍 Search & Filter Products</h3>
            
            <div className="products-count-badge">
              Showing {paginatedProducts.length} of {filteredProducts.length}
            </div>
          </div>
          <div className="products-search-body">
            {/* Search Input */}
            <div className="products-search-input-group">
              <Form.Control
                placeholder="Search by SKU or Product Name"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="products-input"
              />
              <span className="products-search-icon">🔎</span>
            </div>

            {/* Category & Brand Filters */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginTop: "12px"
            }}>
              {/* Category Filter */}
              <Form.Group className="mb-0">
                <Form.Label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                  📁 Category
                </Form.Label>
                <Form.Select
                  value={filterCategory}
                  onChange={e => {
                    const categoryName = e.target.value;
                    console.log('📌 Category selected:', categoryName);
                    setFilterCategory(categoryName);
                    setFilterBrand(""); // Reset brand when category changes
                    loadBrandsByCategory(categoryName);
                  }}
                  style={{ fontSize: "13px", padding: "8px 12px" }}
                >
                  <option value="">All Categories</option>
                  {categories
                    .filter(cat => cat.isActive)
                    .map(cat => (
                      <option key={cat.id} value={cat.category}>
                        {getLocalized(cat.category, cat.categoryHi)}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>

              {/* Brand Filter */}
              <Form.Group className="mb-0">
                <Form.Label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                  🏷️ Brand
                </Form.Label>
                <Form.Select
                  value={filterBrand}
                  onChange={e => {
                    console.log('📌 Brand selected:', e.target.value);
                    setFilterBrand(e.target.value);
                  }}
                  disabled={!filterCategory || loadingBrands}
                  style={{ fontSize: "13px", padding: "8px 12px" }}
                >
                  <option value="">
                    {!filterCategory ? 'Select Category First' : loadingBrands ? 'Loading...' : 'All Brands'}
                  </option>
                  {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {getLocalized(brand.brand, brand.nameHi)}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </div>

            {/* Active Filters Display */}
            {(filterCategory || filterBrand) && (
              <div style={{
                marginTop: "10px",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap"
              }}>
                {filterCategory && (
                  <span style={{
                    background: "#e7f3ff",
                    border: "1px solid #91d5ff",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    color: "#0050b3"
                  }}>
                    📁 {getLocalized(categories.find(cat => cat.category === filterCategory)?.category, categories.find(cat => cat.category === filterCategory)?.categoryHi) || filterCategory}
                    <span 
                      onClick={() => setFilterCategory("")}
                      style={{ marginLeft: "6px", cursor: "pointer", fontWeight: "bold" }}
                    >
                      ✕
                    </span>
                  </span>
                )}
                {filterBrand && (
                  <span style={{
                    background: "#f6e7ff",
                    border: "1px solid #b37feb",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    color: "#531dab"
                  }}>
                    🏷️ {getLocalized(brands.find(b => b.id.toString() === filterBrand)?.brand, brands.find(b => b.id.toString() === filterBrand)?.nameHi) || ""}
                    <span 
                      onClick={() => setFilterBrand("")}
                      style={{ marginLeft: "6px", cursor: "pointer", fontWeight: "bold" }}
                    >
                      ✕
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {paginatedProducts.map(p => (
            <div key={p.id} className="product-card">
              <div className="product-card-header">
                <div className="product-card-title-section">
                  <h4 className="product-name">{getLocalized(p.name, p.nameHi)}</h4>
                  <div className="product-sku">SKU: {p.sku}</div>
                </div>
                <Badge 
                  className={`product-status-badge ${p.status === "ACTIVE" ? "badge-active" : "badge-inactive"}`}
                >
                  {p.status}
                </Badge>
              </div>

              <div className="product-card-body">
                <div className="product-info-grid">
                  <div className="product-info-item">
                    <span className="info-label">Category</span>
                    <span className="info-value">{getLocalized(p.category, p.categoryHi) || "N/A"}</span>
                  </div>
                  <div className="product-info-item">
                    <span className="info-label">Brand</span>
                    <span className="info-value">{getLocalized(p.brandName, p.brandNameHi) || "N/A"}</span>
                  </div>
                  <div className="product-info-item">
                    <span className="info-label">Unit</span>
                    <span className="info-value">{p.unit || "N/A"}</span>
                  </div>
                  <div className="product-info-item">
                    <span className="info-label">Price</span>
                    <span className="info-value price">₹{p.price}</span>
                  </div>
                </div>

                {p.discountAmount ? (
                  <div className="product-discount-section">
                    <span className="discount-label">Discount</span>
                    <span className="discount-value">₹{p.discountAmount}</span>
                  </div>
                ) : null}

                {p.barcode && (
                  <div className="product-barcode-section">
                    <img
                      src={`data:image/png;base64,${p.barcode}`}
                      alt="barcode"
                      className="product-barcode-img"
                      onClick={() => { setBarcodePreview(p.barcode || null); setShowBarcodeModal(true); }}
                    />
                  </div>
                )}

                {p.description && (
                  <div className="product-description">
                    <p>{p.description}</p>
                  </div>
                )}
              </div>

              <div className="product-card-footer">
                <button 
                  className="product-btn product-btn-edit"
                  onClick={() => openModal(p)}
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="products-empty-state">
            <div className="products-empty-icon">📭</div>
            <p className="products-empty-text">No products found</p>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > itemsPerPage && (
          <div className="products-pagination">
            <button
              className="products-pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            
            <div className="products-pagination-info">
              <span className="pagination-page-number">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <span className="pagination-total">
                Total: <strong>{filteredProducts.length}</strong> products
              </span>
            </div>
            
            <button
              className="products-pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? "Edit Product" : "Add Product"}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Input Mode Toggle - Only for Adding New Products */}
          {!editing && (
            <div className="mb-4 p-3 border rounded bg-primary bg-opacity-10">
              <h6 className="mb-3">Choose Input Method</h6>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  label="✏️ Manual Entry (Enter all details)"
                  name="inputMode"
                  id="manual-mode"
                  checked={inputMode === "manual"}
                  onChange={() => {
                    setInputMode("manual");
                    setScanError(null);
                    setBarcodeInput("");
                  }}
                />
                <Form.Check
                  type="radio"
                  label="📱 Barcode Scan (Scan or enter barcode)"
                  name="inputMode"
                  id="barcode-mode"
                  checked={inputMode === "barcode"}
                  onChange={() => {
                    setInputMode("barcode");
                    setScanError(null);
                  }}
                />
              </div>
            </div>
          )}

          {/* Barcode Scanner Section */}
          {!editing && inputMode === "barcode" && (
            <div className="mb-4 p-3 border rounded bg-light">
              <h6 className="mb-3">📱 Barcode Scanner</h6>
              <Form.Group className="mb-2">
                <Form.Label>Scan or Enter External Barcode</Form.Label>
                <Form.Control
                  placeholder="Scan barcode here..."
                  value={barcodeInput}
                  onChange={(e) => {
                    setBarcodeInput(e.target.value);
                    setScanError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleBarcodeScan();
                    }
                  }}
                  disabled={barcodeScanning}
                  autoFocus
                />
                <small className="form-text text-muted">
                  Press Enter to scan or search by SKU/external barcode
                </small>
              </Form.Group>

              <button
                className="btn btn-primary btn-sm"
                onClick={handleBarcodeScan}
                disabled={!barcodeInput || barcodeScanning}
              >
                {barcodeScanning ? "Scanning..." : "🔍 Search Barcode"}
              </button>

              {scanError && (
                <div className="alert alert-warning mt-2 mb-0">
                  {scanError}
                </div>
              )}
            </div>
          )}

          {Object.keys(emptyProduct).map(key =>
            key !== "status" && key !== "externalBarcode" ? (
              // Show all fields in manual mode or when editing
              (editing || inputMode === "manual") && (
                <Form.Group className="mb-2" key={key}>
                  <Form.Control
                    placeholder={key.toUpperCase()}
                    value={(formData as any)[key]}
                    onChange={e =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                  />
                </Form.Group>
              )
            ) : null
          )}

          {/* External Barcode Field */}
          <Form.Group className="mb-2">
            <Form.Label>External Barcode</Form.Label>
            <Form.Control
              placeholder="External Barcode Number (optional)"
              value={formData.externalBarcode || ""}
              onChange={e =>
                setFormData({ ...formData, externalBarcode: e.target.value })
              }
            />
            <small className="form-text text-muted">
              Unique barcode number for quick lookup (e.g., manufacturer barcode)
            </small>
          </Form.Group>

          <Form.Select
            value={formData.status}
            onChange={e =>
              setFormData({ ...formData, status: e.target.value as any })
            }
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </Form.Select>
        </Modal.Body>

        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => setShow(false)}
          >
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              // Save product logic here
              console.log("Save product:", formData);
              setShow(false);
            }}
          >
            {editing ? "Update Product" : "Save Product"}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Barcode preview modal */}
      <Modal show={showBarcodeModal} onHide={() => setShowBarcodeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Barcode Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {barcodePreview ? (
            <>
              <img src={`data:image/png;base64,${barcodePreview}`} alt="barcode" style={{maxWidth: '100%'}} />
              <div className="mt-3">
                <a href={`data:image/png;base64,${barcodePreview}`} download="barcode.png" className="btn btn-outline-primary btn-sm">Download</a>
              </div>
            </>
          ) : (
            <div className="text-muted">No preview available</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Products;
