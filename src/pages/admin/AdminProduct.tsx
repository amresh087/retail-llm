import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Modal,
  Form,
  Spinner
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import AdminHeader from "../../components/AdminHeader";
import api from "../../services/api";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getBrandsByCategory,
  getProductByBarcode,
  type Product,
  type Brand
} from "../../services/productService";
import "./AdminProduct.css";

interface Category {
  id: number;
  category: string;
  categoryHi?: string;
  isActive: boolean;
}

const UNIT_OPTIONS = [
  { value: 'G', label: 'Gram (G)' },
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'MG', label: 'Milligram (MG)' },
  { value: 'L', label: 'Liter (L)' },
  { value: 'ML', label: 'Milliliter (ML)' },
  { value: 'PC', label: 'Piece (PC)' },
  { value: 'Packet', label: 'Packet' },
  { value: 'Dozen', label: 'Dozen' }
];

const AdminProducts: React.FC = () => {
  const { t, i18n } = useTranslation();

  const getLocalized = (en?: string, hi?: string): string => {
    const enText = en || '';
    const hiText = hi || '';
    const language = i18n.language || 'en';
    return language.startsWith('hi') ? (hiText || enText) : (enText || hiText);
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);

  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  /* 🔍 Filters */
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");

  /* 📄 Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const emptyProduct: Product = {
    sku: "",
    name: "",
    nameHi: "",
    description: "",
    category: "",
    categoryHi: "",
    brandId: undefined,
    brandName: "",
    brandNameHi: "",
    unit: "",
    price: 0,
    discountAmount: 0,
    status: "ACTIVE",
    externalBarcode: "",
    loose: false,
    packetSize: 0,
    packetUnit: "",
    productSize: 0
  };


  const [formData, setFormData] = useState<Product>(emptyProduct);
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);

  const getProductName = (product: Product) => getLocalized(product.name, product.nameHi);
  const getProductCategory = (product: Product) => getLocalized(product.category, product.categoryHi);
  const getProductBrand = (product: Product) => getLocalized(product.brandName, product.brandNameHi);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  // Barcode scanner state
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Input mode: "manual" or "barcode"
  const [inputMode, setInputMode] = useState<"manual" | "barcode">("manual");

  const loadProducts = (page: number = 1, limit: number = itemsPerPage) => {
    setLoading(true);
    console.log(`📡 Loading products: page=${page}, limit=${limit}`);
    getAllProducts(page, limit)
      .then(res => {
        console.log('✅ Products loaded:', res.data);
        setProducts(res.data);
      })
      .catch(err => {
        console.error('❌ Failed to load products:', err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  };

  const loadCategories = async () => {
    try {
      const response = await api.get("/products/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const loadBrandsByCategory = async (categoryId: number) => {
    try {
      setLoadingBrands(true);
      console.log("Loading brands for category ID:", categoryId);
      const response = await getBrandsByCategory(categoryId);
      console.log("Mapped brands:", response.data);
      setBrands(response.data || []);
    } catch (error) {
      console.error("Failed to load brands:", error);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    loadCategories(); // Only load categories on mount
  }, []);

  // Load products when page or itemsPerPage changes (including on initial render)
  useEffect(() => {
    console.log(`📡 Loading products: page=${currentPage}, itemsPerPage=${itemsPerPage}`);
    loadProducts(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  // Load brands when category changes in form
  useEffect(() => {
    if (formData.category) {
      // Find the category ID from the category name
      const categoryObj = categories.find(cat => cat.category === formData.category);
      if (categoryObj) {
        loadBrandsByCategory(categoryObj.id);
      }
    } else {
      setBrands([]);
    }
  }, [formData.category, categories]);

  const openModal = (product?: Product) => {
    setEditing(product || null);
    const productToEdit = product ?? emptyProduct;
    setFormData({
      ...productToEdit,
      loose: (productToEdit as any).loose ?? false,
      productSize: (productToEdit as any).productSize ?? undefined,
      packetSize: (productToEdit as any).packetSize ?? undefined,
      packetUnit: (productToEdit as any).packetUnit ?? undefined,
      nameHi: productToEdit.nameHi || "",
      categoryHi: (productToEdit as any).categoryHi || "",
      brandNameHi: (productToEdit as any).brandNameHi || ""
    } as Product);
    setInputMode("manual"); // Reset to manual when opening modal
    setBarcodeInput("");
    setScanError(null);
    
    // Load brands for the selected category
    if (productToEdit.category) {
      const categoryObj = categories.find(cat => cat.category === productToEdit.category);
      if (categoryObj) {
        loadBrandsByCategory(categoryObj.id);
      }
    } else {
      setBrands([]);
    }
    
    // Clear externalBarcode when opening modal in manual mode (for new products)
    if (!editing) {
      setFormData(prev => ({ ...prev, externalBarcode: "" }));
    }
    
    setShow(true);
  };

  /**
   * Handle barcode scanning - searches for product by SKU or external barcode
   */
  const handleBarcodeScan = async () => {
    if (!barcodeInput.trim()) {
      setScanError("❌ " + t('validation.required'));
      return;
    }

    setBarcodeScanning(true);
    setScanError(null);

    try {
      const response = await getProductByBarcode(barcodeInput.trim());
      const product = response.data;

      // Product found - show "already exists" message
      setFormData({
        ...product,
        sku: product.sku || "",
        name: product.name || "",
        nameHi: product.nameHi || "",
        description: product.description || "",
        category: product.category || "",
        categoryHi: product.categoryHi || "",
        brandId: product.brandId || undefined,
        brandName: product.brandName || "",
        brandNameHi: product.brandNameHi || "",
        unit: product.unit || "",
        price: product.price || 0,
        discountAmount: product.discountAmount || 0,
        status: product.status || "ACTIVE",
        externalBarcode: product.externalBarcode || "",
        productSize: product.productSize || undefined,
        packetSize: product.packetSize ?? undefined,
        packetUnit: product.packetUnit ?? undefined
      });

      setBarcodeInput("");
      setScanError(`✅ Product already exists! Found: ${product.name} (SKU: ${product.sku})`);
      // Keep in barcode mode to show the message
      setInputMode("barcode");
    } catch (error: any) {
      // Product not found - set external barcode and switch to manual mode
      const scannedBarcode = barcodeInput.trim();
      
      // Pre-fill with external barcode and empty form
      setFormData({
        ...emptyProduct,
        externalBarcode: scannedBarcode
      });

      setScanError(`✅ Barcode "${scannedBarcode}" not found. Let's create a new product with this barcode!`);
      
      // Switch to manual mode so user can fill details
      setInputMode("manual");
      setBarcodeInput("");
    } finally {
      setBarcodeScanning(false);
    }
  };

  const saveProduct = () => {
    // Generate dummy unique barcode if not provided (when creating new product)
    const dataToSave = !editing && !formData.externalBarcode
      ? {
          ...formData,
          externalBarcode: `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        }
      : formData;

    const apiCall = editing
      ? updateProduct(editing.id!, dataToSave)
      : createProduct(dataToSave);

    apiCall.then(() => {
      if (editing) {
        loadProducts(currentPage, itemsPerPage);
      } else {
        setCurrentPage(1); // Reset to page 1 after creating a new product
        loadProducts(1, itemsPerPage);
      }
      setShow(false);
    });
  };

  const removeProduct = (id?: number) => {
    if (!id) return;
    if (window.confirm(t('products.deleteProduct') + "?")) {
      deleteProduct(id).then(() => {
        setCurrentPage(1); // Reset to page 1 after deletion
        loadProducts(1, itemsPerPage);
      });
    }
  };

  /* brand/category filters removed */

  /* 🔎 Filter logic */
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const term = search.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(term) ||
        p.nameHi?.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.categoryHi?.toLowerCase().includes(term) ||
        p.brandName?.toLowerCase().includes(term) ||
        p.brandNameHi?.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term);

      const matchCategory = !filterCategory || p.category === filterCategory;
      const matchBrand = !filterBrand || p.brandId?.toString() === filterBrand;

      return matchSearch && matchCategory && matchBrand;
    });
  }, [products, search, filterCategory, filterBrand]);

  // Reset to page 1 when filters change
  useEffect(() => {
    console.log('🔄 Filters changed, resetting to page 1');
    setCurrentPage(1);
  }, [search, filterCategory, filterBrand]);

  // Trigger API call when page or itemsPerPage changes
  useEffect(() => {
    console.log(`📡 Pagination changed: page=${currentPage}, itemsPerPage=${itemsPerPage}`);
    loadProducts(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  // Pagination calculations
  // Note: This is client-side pagination on the already-paginated server results
  // combined with client-side filtering
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="admin-product-loading-container">
        <div className="admin-product-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="admin-product-page-container">
      <div className="admin-product-content">
        <AdminHeader 
          title={t('products.management')}
          description={t('products.manageDesc')}
        />

        {/* Search & Filters Section */}
        <div className="admin-product-toolbar">
          <div className="admin-product-search-card">
            <div className="admin-product-search-header">
              <h3 className="admin-product-search-title">🔍 {t('products.search')}</h3>
              <div className="admin-product-count-badge">
                {filteredProducts.length} {t('admin.products')}
              </div>
            </div>
            <div className="admin-product-search-body">
              {/* Search Input */}
              <div className="admin-product-search-input-group">
                <Form.Control
                  placeholder={t('products.searchPlaceholder')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="admin-product-input"
                />
                <span className="admin-product-search-icon">🔎</span>
              </div>

              {/* Category & Brand Filters */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
                marginTop: "12px"
              }}>
                {/* Category Filter */}
                <Form.Group className="mb-0">
                  <Form.Label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                    📁 {t('products.category')}
                  </Form.Label>
                  <Form.Select
                    value={filterCategory}
                    onChange={e => {
                      setFilterCategory(e.target.value);
                      setFilterBrand(""); // Reset brand when category changes
                      // Load brands for selected category
                      const categoryObj = categories.find(cat => cat.category === e.target.value);
                      if (categoryObj) {
                        loadBrandsByCategory(categoryObj.id);
                      } else {
                        setBrands([]);
                      }
                    }}
                    style={{ fontSize: "13px", padding: "8px 12px" }}
                  >
                    <option value="">{t('common.language')} {t('admin.categories')}</option>
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
                    🏷️ {t('products.brand')}
                  </Form.Label>
                  <Form.Select
                    value={filterBrand}
                    onChange={e => setFilterBrand(e.target.value)}
                    disabled={!filterCategory}
                    style={{ fontSize: "13px", padding: "8px 12px" }}
                  >
                    <option value="">{t('common.language')} {t('products.brand')}s</option>
                    {brands
                      .map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {getLocalized(brand.brand, brand.nameHi)}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>

                {/* Items Per Page Filter */}
                <Form.Group className="mb-0">
                  <Form.Label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                    📄 {t('products.itemsPerPage')}
                  </Form.Label>
                  <Form.Select
                    value={itemsPerPage}
                    onChange={e => setItemsPerPage(Number(e.target.value))}
                    style={{ fontSize: "13px", padding: "8px 12px" }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </Form.Select>
                </Form.Group>
              </div>

              {/* Active Filters Display */}
              {(filterCategory || filterBrand) && (
                <div style={{
                  marginTop: "10px",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  alignItems: "center"
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
                      📁 {categories.find(cat => cat.category === filterCategory)?.categoryHi ? getLocalized(filterCategory, categories.find(cat => cat.category === filterCategory)?.categoryHi) : filterCategory}
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
                      🏷️ {getLocalized(brands.find(b => b.id.toString() === filterBrand)?.brand || "", brands.find(b => b.id.toString() === filterBrand)?.nameHi || "")}
                      <span 
                        onClick={() => setFilterBrand("")}
                        style={{ marginLeft: "6px", cursor: "pointer", fontWeight: "bold" }}
                      >
                        ✕
                      </span>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setFilterCategory("");
                      setFilterBrand("");
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    style={{
                      background: "rgba(255, 107, 107, 0.1)",
                      border: "1px solid rgba(255, 107, 107, 0.3)",
                      color: "#ff6b6b",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 107, 107, 0.2)";
                      e.currentTarget.style.borderColor = "rgba(255, 107, 107, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 107, 107, 0.1)";
                      e.currentTarget.style.borderColor = "rgba(255, 107, 107, 0.3)";
                    }}
                  >
                    ✕ Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            className="admin-product-add-btn"
            onClick={() => openModal()}
          >
            <span className="add-icon">+</span>
            <span className="add-text">{t('products.addProduct')}</span>
          </button>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.03) 100%)",
            border: "1px solid rgba(102, 126, 234, 0.1)",
            borderRadius: "12px",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#4b5563"
          }}>
            <div>
              <strong style={{ color: "#667eea" }}>{filteredProducts.length}</strong> products found
            </div>
            <div style={{ fontSize: "13px", color: "#999" }}>
              {t('products.page')} <strong style={{ color: "#667eea" }}>{currentPage}</strong> {t('products.of')} <strong style={{ color: "#667eea" }}>{totalPages}</strong>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="admin-product-grid">
          {paginatedProducts.map(p => (
            <div key={p.id} className="admin-product-card">
              <div className="admin-product-card-header">
                <div className="admin-product-card-title-section">
                  <h4 className="admin-product-name">{getProductName(p)}</h4>
                  <div className="admin-product-sku">{t('products.sku')}: {p.sku}</div>
                </div>
                <Badge 
                  className={`admin-product-status-badge ${p.status === "ACTIVE" ? "badge-active" : "badge-inactive"}`}
                >
                  {p.status}
                </Badge>
              </div>

              <div className="admin-product-card-body">
                <div className="admin-product-info-grid">
                  <div className="admin-product-info-item">
                    <span className="info-label">ID</span>
                    <span className="info-value">{p.id}</span>
                  </div>
                  <div className="admin-product-info-item">
                    <span className="info-label">{t('products.category')}</span>
                    <span className="info-value">{getProductCategory(p) || "N/A"}</span>
                  </div>
                  <div className="admin-product-info-item">
                    <span className="info-label">{t('products.brand')}</span>
                    <span className="info-value">{getProductBrand(p) || "N/A"}</span>
                  </div>

{/*
                  <div className="admin-product-info-item">
                    <span className="info-label">{t('products.unit')}</span>
                    <span className="info-value">{p.unit || "N/A"}</span>
                  </div>
*/}

                  <div className="admin-product-info-item">
                    <span className="info-label">{t('Is sold Loose?')}</span>
                    <span className="info-value">{p.loose ? 'Yes' : 'No'}</span>
                  </div>

              <div className="admin-product-info-item">
                 <span className="info-label">
                  {p.loose ? t('products.size') : t('products.packet')}
                </span>
                <span className="info-value">
                  {p.loose ? (p.productSize ? `${p.productSize} ${p.unit || ''}` : 'N/A') : (p.packetSize ? `${p.packetSize} ${p.packetUnit || ''}` : 'N/A') }
                </span>
             </div>


                </div>

                <div className="admin-product-pricing-section">
                  <div className="price-item">
                    <span className="price-label">{t('products.price')}</span>
                    <span className="price-value">₹{p.price}</span>
                  </div>
                  {p.discountAmount ? (
                    <div className="discount-item">
                      <span className="discount-label">{t('products.discount')}</span>
                      <span className="discount-value">₹{p.discountAmount}</span>
                    </div>
                  ) : null}
                </div>

                {p.barcode && (
                  <div className="admin-product-barcode-section">
                    <img
                      src={`data:image/png;base64,${p.barcode}`}
                      alt="barcode"
                      className="admin-product-barcode-img"
                      onClick={() => { setBarcodePreview(p.barcode || null); setShowBarcodeModal(true); }}
                    />
                  </div>
                )}

                {p.description && (
                  <div className="admin-product-description">
                    <p>{p.description}</p>
                  </div>
                )}
              </div>

              <div className="admin-product-card-footer">
                <button 
                  className="admin-product-btn admin-product-btn-edit"
                  onClick={() => openModal(p)}
                >
                  ✏️ {t('products.edit')}
                </button>
                <button 
                  className="admin-product-btn admin-product-btn-delete"
                  onClick={() => removeProduct(p.id)}
                >
                  🗑️ {t('products.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="admin-product-empty-state">
            <div className="admin-product-empty-icon">📭</div>
            <p className="admin-product-empty-text">{t('products.noProducts')}</p>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredProducts.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginTop: "32px",
            padding: "20px",
            background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.03) 100%)",
            border: "1px solid rgba(102, 126, 234, 0.1)",
            borderRadius: "12px",
            flexWrap: "wrap"
          }}>
            {/* Results Summary */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              fontSize: "14px",
              color: "#4b5563",
              fontWeight: "500",
              flex: "1 1 auto"
            }}>
              <span>
                {t('products.showing')} <strong style={{ color: "#667eea" }}>{startIndex + 1}</strong> {t('products.to')}{" "}
                <strong style={{ color: "#667eea" }}>{Math.min(endIndex, filteredProducts.length)}</strong> {t('products.of')}{" "}
                <strong style={{ color: "#667eea" }}>{filteredProducts.length}</strong> {t('admin.products')}
              </span>
            </div>

            {/* Navigation Buttons */}
            <div style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap"
            }}>
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 16px",
                  background: currentPage === 1 ? "#e9ecef" : "white",
                  color: currentPage === 1 ? "#999" : "#667eea",
                  border: currentPage === 1 ? "1px solid #e9ecef" : "2px solid #667eea",
                  borderRadius: "8px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                  transition: "all 0.3s ease"
                }}
              >
                ← {t('products.previous')}
              </button>

              {/* Page Numbers */}
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        padding: "8px 12px",
                        background: currentPage === page ? "#667eea" : "white",
                        color: currentPage === page ? "white" : "#333",
                        border: currentPage === page ? "none" : "1px solid #ddd",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: currentPage === page ? "600" : "500",
                        fontSize: "13px",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span style={{ color: "#999" }}>...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      style={{
                        padding: "8px 12px",
                        background: currentPage === totalPages ? "#667eea" : "white",
                        color: currentPage === totalPages ? "white" : "#333",
                        border: currentPage === totalPages ? "none" : "1px solid #ddd",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: currentPage === totalPages ? "600" : "500",
                        fontSize: "13px"
                      }}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 16px",
                  background: currentPage === totalPages ? "#e9ecef" : "white",
                  color: currentPage === totalPages ? "#999" : "#667eea",
                  border: currentPage === totalPages ? "1px solid #e9ecef" : "2px solid #667eea",
                  borderRadius: "8px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "13px",
                  transition: "all 0.3s ease"
                }}
              >
                {t('products.next')} →
              </button>

              {/* Page Info */}
              <div style={{
                marginLeft: "8px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#667eea",
                paddingLeft: "12px",
                borderLeft: "2px solid rgba(102, 126, 234, 0.2)"
              }}>
                {t('products.page')} <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <Modal show={show} onHide={() => setShow(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editing ? t('products.editProduct') : t('products.addProduct')}</Modal.Title>
        </Modal.Header>

        <Modal.Body className="admin-product-modal-body">
          {/* Input Mode Selection - Compact */}
          {!editing && (
            <div className="mb-2">
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "8px 12px",
                borderRadius: "6px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
                color: "white"
              }}>
                {/* Manual Entry Option */}
                <div
                  onClick={() => {
                    setInputMode("manual");
                    setScanError(null);
                    setBarcodeInput("");
                    // Clear externalBarcode when switching to manual mode
                    setFormData(prev => ({ ...prev, externalBarcode: "" }));
                  }}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background: inputMode === "manual" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                    border: inputMode === "manual" ? "1px solid white" : "1px solid transparent",
                    fontSize: "12px",
                    fontWeight: "500",
                    textAlign: "center",
                    transition: "all 0.2s ease"
                  }}
                >
                  ✏️ {t('products.manualMode')}
                </div>

                {/* Barcode Scan Option */}
                <div
                  onClick={() => {
                    setInputMode("barcode");
                    setScanError(null);
                  }}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background: inputMode === "barcode" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                    border: inputMode === "barcode" ? "1px solid white" : "1px solid transparent",
                    fontSize: "12px",
                    fontWeight: "500",
                    textAlign: "center",
                    transition: "all 0.2s ease"
                  }}
                >
                  📱 {t('products.scanMode')}
                </div>
              </div>
            </div>
          )}

          {/* Barcode Scanner Section - Enhanced UI */}
          {!editing && inputMode === "barcode" && (
            <div className="mb-4" style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)"
            }}>
              {/* Header */}
              <div style={{
                color: "white",
                marginBottom: "16px"
              }}>
                <h5 style={{ margin: 0, fontWeight: 600, fontSize: "16px" }}>📱 {t('products.scanBarcode')}</h5>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                  {t('products.scanDesc')}
                </p>
              </div>

              {/* Input Section */}
              <div style={{
                background: "white",
                padding: "16px",
                borderRadius: "10px",
                marginBottom: "12px"
              }}>
                <Form.Group className="mb-0">
                  <Form.Control
                    placeholder={t('products.enterOrScan')}
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
                    style={{
                      fontSize: "14px",
                      padding: "12px 14px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      height: "44px",
                      fontWeight: "500"
                    }}
                  />
                </Form.Group>

                {/* Action Button */}
                <button
                  className="btn w-100"
                  onClick={handleBarcodeScan}
                  disabled={!barcodeInput || barcodeScanning}
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: barcodeInput && !barcodeScanning ? "pointer" : "not-allowed",
                    opacity: barcodeInput && !barcodeScanning ? 1 : 0.6,
                    marginTop: "10px",
                    transition: "all 0.3s ease"
                  }}
                >
                  {barcodeScanning ? (
                    <>
                      <Spinner animation="border" size="sm" style={{ width: "14px", height: "14px", marginRight: "8px" }} />
                      {t('products.searching')}
                    </>
                  ) : (
                    "🔍 " + t('products.searchProduct')
                  )}
                </button>
              </div>

              {/* Status Message */}
              {scanError && (
                <div style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: scanError.includes("already exists") ? "#cfe2ff" : scanError.includes("✅") ? "#d4edda" : scanError.includes("❌") ? "#f8d7da" : "#fff3cd",
                  border: `2px solid ${scanError.includes("already exists") ? "#b6d4fe" : scanError.includes("✅") ? "#c3e6cb" : scanError.includes("❌") ? "#f5c6cb" : "#ffeeba"}`,
                  color: scanError.includes("already exists") ? "#084298" : scanError.includes("✅") ? "#155724" : scanError.includes("❌") ? "#721c24" : "#856404",
                  fontSize: "13px",
                  fontWeight: "500"
                }}>
                  <div style={{ marginBottom: "8px" }}>{scanError}</div>
                  {scanError.includes("already exists") && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn btn-sm flex-grow-1"
                        onClick={() => {
                          setBarcodeInput("");
                          setScanError(null);
                          setInputMode("barcode");
                        }}
                        style={{
                          background: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        🔄 {t('products.scanAnother')}
                      </button>
                      <button
                        className="btn btn-sm flex-grow-1"
                        onClick={() => {
                          setInputMode("manual");
                          // Clear externalBarcode when switching from barcode to manual mode
                          setFormData(prev => ({ ...prev, externalBarcode: "" }));
                        }}
                        style={{
                          background: "#0d6efd",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        👁️ {t('products.viewDetails')}
                      </button>
                    </div>
                  )}
                  {scanError.includes("not found") && (
                    <button
                      className="btn btn-sm w-100"
                      onClick={() => setInputMode("manual")}
                      style={{
                        background: "#667eea",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}
                    >
                      ➕ {t('products.createNew')}
                    </button>
                  )}
                </div>
              )}

              {/* Helper Text */}
              {!scanError && (
                <div style={{
                  color: "rgba(255, 255, 255, 0.85)",
                  fontSize: "12px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center"
                }}>
                  <span>💡</span>
                  <span>{t('products.helperText')}</span>
                </div>
              )}
            </div>
          )}

          {/* Form Fields - Only show in manual mode or when editing */}
          {editing || inputMode === "manual" ? (
            <>
          {/* Category */}
          <Form.Group className="mb-3">
            <Form.Label className="admin-product-form-label">{t('products.category')} *</Form.Label>
            <Form.Select
              value={formData.category}
              onChange={e => {
                const selectedCategory = e.target.value;
                const selectedCategoryObj = categories.find(cat => cat.category === selectedCategory);
                setFormData(prev => ({
                  ...prev,
                  category: selectedCategory,
                  categoryHi: selectedCategoryObj?.categoryHi || "",
                  brandId: undefined,
                  brandName: undefined,
                  brandNameHi: ""
                }));
              }}
              className="admin-product-form-select"
            >
              <option value="">{t('products.selectCategory')}</option>
              {categories
                .filter(cat => cat.isActive)
                .map(cat => (
                  <option key={cat.id} value={cat.category}>
                    {getLocalized(cat.category, cat.categoryHi)}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>

          {/* Brand */}
          <Form.Group className="mb-3">
            <Form.Label className="admin-product-form-label">🏷️ {t('products.brand')} *</Form.Label>
            {!formData.category ? (
              <Form.Select disabled className="admin-product-form-select">
                <option value="">{t('products.selectCategoryFirst')}</option>
              </Form.Select>
            ) : loadingBrands ? (
              <div className="admin-product-loading-info">
                <Spinner animation="border" size="sm" className="me-2" />
                {t('products.loadingBrands')}
              </div>
            ) : brands.length > 0 ? (
              <Form.Select
                value={formData.brandId ?? ""}
                onChange={e => {
                  const selectedId = e.target.value ? Number(e.target.value) : undefined;
                  const selectedBrand = brands.find(b => b.id === selectedId);
                  setFormData({ 
                    ...formData, 
                    brandId: selectedId,
                    brandName: selectedBrand?.brand || "",
                    brandNameHi: selectedBrand?.nameHi || ""
                  })
                }}
                className="admin-product-form-select"
              >
                <option value="">{t('products.selectBrand')}</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {getLocalized(brand.brand, brand.nameHi)}
                  </option>
                ))}
              </Form.Select>
            ) : (
              <div className="admin-product-warning-info">
                {t('products.noBrandsMapped')}
              </div>
            )}
          </Form.Group>

          {/* Product Name */}
          <Form.Group className="mb-3">
            <Form.Label className="admin-product-form-label">{t('products.name')} *</Form.Label>
            <Form.Control
              placeholder={t('products.name')}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="admin-product-form-input"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="admin-product-form-label">{t('products.nameHindi')}</Form.Label>
            <Form.Control
              placeholder={t('products.nameHindi')}
              value={formData.nameHi || ""}
              onChange={e => setFormData({ ...formData, nameHi: e.target.value })}
              className="admin-product-form-input"
            />
          </Form.Group>

          {/* Unit — show only when sold loose */}
          {formData.loose && (
            <Form.Group className="mb-3">
              <Form.Label className="admin-product-form-label">{t('products.unit')} *</Form.Label>
              <Form.Select
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="admin-product-form-select"
              >
                <option value="">Select Product Unit</option>
                {UNIT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          {/* Sold Loose Checkbox */}
          <Form.Group className="mb-3 d-flex align-items-center">
            <Form.Check
              type="checkbox"
              id="product-loose"
              label={t('Is sold Loose?')}
              checked={!!formData.loose}
              onChange={e => setFormData({ ...formData, loose: e.target.checked })}
            />
          </Form.Group>

          {/* Product size/unit — only when sold loose */}
          {formData.loose && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <Form.Group className="mb-3">
                <Form.Label className="admin-product-form-label">{t('ProductSize')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('ProductSize')}
                    value={formData.productSize ?? ''}
                    onChange={e => setFormData({ ...formData, productSize: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                  />
              </Form.Group>
            </div>
          )}
          {/* Packet size/unit — only when not loose */}
          {!formData.loose && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Form.Group className="mb-3">
                <Form.Label className="admin-product-form-label">{t('PacketSize')}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t('PacketSize')}
                  value={formData.packetSize ?? ''}
                  onChange={e => setFormData({ ...formData, packetSize: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                />
              </Form.Group>

            <Form.Group className="mb-3">
            <Form.Label className="admin-product-form-label">{t('PacketUnit')} *</Form.Label>
            <Form.Select
              value={formData.packetUnit}
              onChange={e => setFormData({ ...formData, packetUnit: e.target.value })}
              className="admin-product-form-select"
            >
              <option value="">Select Packet Unit</option>
              {UNIT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
             
            </div>
          )}

          {/* Price */}
          <Form.Group className="mb-3">
            <Form.Label className="admin-product-form-label">{t('products.price')} (₹) *</Form.Label>
            <Form.Control
              type="text"
              placeholder={t('products.price')}
              value={formData.price || ""}
              onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="admin-product-form-input"
            />
          </Form.Group>

          {/* Discount */}
          <Form.Group className="mb-3">
            <Form.Label className="admin-product-form-label">{t('products.discount')} (₹)</Form.Label>
            <Form.Control
              type="text"
              placeholder={t('products.discount')}
              value={formData.discountAmount || ""}
              onChange={e => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
              className="admin-product-form-input"
            />
          </Form.Group>

          {/* Status */}
          <Form.Group className="mb-3">
            <Form.Label className="admin-product-form-label">{t('products.status')}</Form.Label>
            <Form.Select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="admin-product-form-select"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </Form.Select>
          </Form.Group>

          {/* External Barcode Field - Show for both creating and editing */}
          <Form.Group className="mb-3">
            <Form.Label className="admin-product-form-label">{t('products.externalBarcode')}</Form.Label>
            <Form.Control
              placeholder={t('products.externalBarcode')}
              value={formData.externalBarcode || ""}
              onChange={e =>
                setFormData({ ...formData, externalBarcode: e.target.value })
              }
              className="admin-product-form-input"
            />
            <small className="form-text text-muted">
              {editing 
                ? t('products.editBarcode')
                : t('products.barcodeInfo')
              }
            </small>
          </Form.Group>
            </>
          ) : null}
        </Modal.Body>

        <Modal.Footer className="admin-product-modal-footer">
          <button 
            className="admin-product-modal-btn admin-product-modal-btn-cancel"
            onClick={() => setShow(false)}
          >
            {t('products.cancel')}
          </button>
          <button 
            className="admin-product-modal-btn admin-product-modal-btn-save"
            onClick={saveProduct}
          >
            {editing ? '💾 ' + t('products.update') : '➕ ' + t('products.create')}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Barcode Preview Modal */}
      <Modal show={showBarcodeModal} onHide={() => setShowBarcodeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('products.barcodePreview')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {barcodePreview ? (
            <>
              <img src={`data:image/png;base64,${barcodePreview}`} alt="barcode" style={{maxWidth: '100%'}} />
              <div className="mt-3">
                <a href={`data:image/png;base64,${barcodePreview}`} download="barcode.png" className="btn btn-outline-primary btn-sm">{t('products.download')}</a>
              </div>
            </>
          ) : (
            <div className="text-muted">{t('products.noProducts')}</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminProducts;
