import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "react-bootstrap";
import api from "../../services/api";
import {
  getActiveCategories,
  getBrandsByCategory,
  type Brand
} from "../../services/productService";
import "./AdminInventoryList.css";

/* =======================
   Interfaces
======================= */

interface Category {
  id: number;
  category: string;
  isActive: boolean;
}

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
  category?: string;
  brandId?: number;
}

/* =======================
   Constants
======================= */

const LOW_STOCK_LIMIT = 20;
const EXPIRY_WARNING_DAYS = 30;

/* =======================
   Component
======================= */

const InventoryList: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  
  // Categories and Brands
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  
  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStockStatus, setFilterStockStatus] = useState<"all" | "low" | "in-stock">("all");
  const [filterExpiryStatus, setFilterExpiryStatus] = useState<"all" | "valid" | "near-expiry" | "expired">("all");

  /* =======================
     Load Categories on Mount
  ======================= */

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getActiveCategories();
        setCategories(res.data || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadCategories();
  }, []);

  /* =======================
     Load Brands by Category
  ======================= */

  const loadBrandsByCategory = async (categoryName: string) => {
    if (!categoryName) {
      console.log('⚠️ No category selected, clearing brands');
      setBrands([]);
      setFilterBrand("");
      return;
    }

    try {
      setLoadingBrands(true);
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

  /* =======================
     Handle Category Change
  ======================= */

  const handleCategoryChange = (categoryName: string) => {
    console.log('📌 Category selected:', categoryName);
    setFilterCategory(categoryName);
    setFilterBrand(''); // Reset brand when category changes
    setCurrentPage(1);
    loadBrandsByCategory(categoryName);
  };

  const loadInventory = async (page: number, searchTerm: string, category: string, brand: string, stockStatus: string, expiryStatus: string, pageSize?: number) => {
    try {
      setLoading(true);
      
      const finalPageSize = pageSize || itemsPerPage;

      // Build query parameters to send to API
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", finalPageSize.toString());
      
      // Add filter parameters to API
      if (stockStatus && stockStatus !== "all") {
        params.append("stockStatus", stockStatus);
      }
      if (expiryStatus && expiryStatus !== "all") {
        params.append("expiryStatus", expiryStatus);
      }
      
      const queryString = params.toString();
      const fullUrl = `/inventory?${queryString}`;
      
      console.log('📡 API URL:', fullUrl);
      console.log('📡 Filters being sent to API:', {
        stockStatus: stockStatus || "all",
        expiryStatus: expiryStatus || "all"
      });

      const res = await api.get(fullUrl);
      console.log('📩 RAW API Response:', res);
      
      // Handle different response formats
      let inventoryData = [];
      if (res.data?.data && Array.isArray(res.data.data)) {
        inventoryData = res.data.data;
        console.log('✅ Found data in res.data.data');
      } else if (Array.isArray(res.data)) {
        inventoryData = res.data;
        console.log('✅ Found data in res.data (direct array)');
      } else if (res.data?.content && Array.isArray(res.data.content)) {
        inventoryData = res.data.content;
        console.log('✅ Found data in res.data.content');
      }
      
      console.log('📦 Total items from API:', inventoryData.length);
      console.log('📦 Sample item structure:', inventoryData[0]);

      // Fetch product details to get category and brand for each product
      console.log('🔄 Enriching data with product category and brand info...');
      const enrichedData = await Promise.all(
        inventoryData.map(async (product: any) => {
          try {
            const productId = product.productId || product.id;
            if (!productId) {
              console.warn('⚠️ No productId found in:', product);
              return product;
            }
            
            const productRes = await api.get(`/products/${productId}`);
            return {
              productId: productId,
              productSku: product.productSku || product.sku || '',
              productName: product.productName || product.name || '',
              totalQty: product.totalQty || product.qty || 0,
              batches: product.batches || [],
              category: productRes.data?.category || product.category,
              brandId: productRes.data?.brandId || product.brandId,
              barcode: productRes.data?.barcode || undefined
            };
          } catch (error) {
            console.error(`Failed to fetch product ${product.productId || product.id}:`, error);
            return {
              productId: product.productId || product.id,
              productSku: product.productSku || product.sku || '',
              productName: product.productName || product.name || '',
              totalQty: product.totalQty || product.qty || 0,
              batches: product.batches || [],
              category: product.category,
              brandId: product.brandId
            };
          }
        })
      );
      
      console.log('✅ Enriched data with category/brand:', enrichedData);

      // NOW apply CLIENT-SIDE filters for category and brand (since backend doesn't support them)
      console.log('🔍 Applying CLIENT-SIDE filters:', {
        search: searchTerm,
        category,
        brand
      });
      
      let filteredData = enrichedData;
      
      // Search filter (client-side)
      if (searchTerm) {
        filteredData = filteredData.filter((product: any) => {
          const term = searchTerm.toLowerCase();
          const productName = (product.productName || '').toLowerCase();
          const productSku = (product.productSku || '').toLowerCase();
          return productName.includes(term) || productSku.includes(term);
        });
      }
      
      // Category filter (client-side)
      if (category && category !== "all") {
        filteredData = filteredData.filter((product: any) => {
          console.log(`Checking product ${product.productId}: category="${product.category}" vs filter="${category}"`);
          return product.category === category;
        });
      }
      
      // Brand filter (client-side)
      if (brand && brand !== "all") {
        filteredData = filteredData.filter((product: any) => {
          console.log(`Checking product ${product.productId}: brandId="${product.brandId}" vs filter="${brand}"`);
          return product.brandId?.toString() === brand;
        });
      }
      
      console.log('✅ After filtering:', filteredData.length, 'items');
      
      // For client-side filtering on category/brand, calculate total on filtered data
      const total = filteredData.length;
      const totalPages = Math.ceil(total / finalPageSize);
      
      console.log('📄 Pagination (on all filtered data):', {
        total,
        totalPages,
        currentPage: page,
        itemsPerPage: finalPageSize
      });

      setData(filteredData);
      setTotalRecords(total);
      setTotalPages(totalPages);
    } catch (error) {
      console.error("❌ Failed to load inventory:", error);
      setData([]);
      setTotalRecords(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     Trigger Load on Filter/Page Change
  ======================= */

  useEffect(() => {
    // Reset to page 1 if itemsPerPage changes
    setCurrentPage(1);
  }, [itemsPerPage]);

  useEffect(() => {
    loadInventory(currentPage, search, filterCategory, filterBrand, filterStockStatus, filterExpiryStatus, itemsPerPage);
  }, [currentPage, search, filterCategory, filterBrand, filterStockStatus, filterExpiryStatus, itemsPerPage]);

  /* =======================
     Helpers
  ======================= */

  const getExpiryBadge = (expiry: string) => {
    const today = new Date();
    const exp = new Date(expiry);
    const diffDays = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return <span className="badge badge-danger">{t('inventory.expired')}</span>;
    if (diffDays <= EXPIRY_WARNING_DAYS) return <span className="badge badge-warning">{t('inventory.nearExpiry')}</span>;
    return <span className="badge badge-success">{t('inventory.valid')}</span>;
  };

  /* =======================
     Loading UI
  ======================= */

  if (loading) {
    return (
      <div className="inventory-loading">
        <div className="spinner">
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-text">{t('inventory.loading')}</p>
      </div>
    );
  }

  return (
    <div className="inventory-list-container">
      {/* Filter Panel */}
      <div className="filter-panel">
        <div className="filter-panel-header">
          <h2 className="filter-panel-title">🔍 {t('inventory.filters')}</h2>
          {(search || filterCategory || filterBrand || filterStockStatus !== "all" || filterExpiryStatus !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setFilterCategory("");
                setFilterBrand("");
                setFilterStockStatus("all");
                setFilterExpiryStatus("all");
                setBrands([]);
                setCurrentPage(1);
              }}
              className="clear-filters-btn"
            >
              ✕ {t('inventory.clearFilters')}
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="search-bar-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t('inventory.searchBySkuProduct')}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input-large"
          />
        </div>

        {/* Filter Grid */}
        <div className="filter-grid">
          {/* Category Filter */}
          <div className="filter-item">
            <label className="filter-item-label">📁 {t('inventory.category')}</label>
            <select
              value={filterCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="filter-item-select"
              disabled={loading}
            >
              <option value="">{t('inventory.allCategories')}</option>
              {categories
                .filter(cat => cat.isActive)
                .map(cat => (
                  <option key={cat.id} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="filter-item">
            <label className="filter-item-label">🏷️ {t('inventory.brand')}</label>
            <select
              value={filterBrand}
              onChange={(e) => {
                console.log('📌 Brand selected:', e.target.value);
                setFilterBrand(e.target.value);
                setCurrentPage(1);
              }}
              disabled={!filterCategory || loadingBrands}
              className="filter-item-select"
            >
              <option value="">
                {!filterCategory ? t('inventory.selectCategoryFirst') : loadingBrands ? t('inventory.loadingBrands') : t('inventory.allBrands')}
              </option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id.toString()}>
                  {brand.brand}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="filter-item">
            <label className="filter-item-label">📦 {t('inventory.stockStatus')}</label>
            <select
              value={filterStockStatus}
              onChange={(e) => {
                setFilterStockStatus(e.target.value as "all" | "low" | "in-stock");
                setCurrentPage(1);
              }}
              className="filter-item-select"
            >
              <option value="all">{t('inventory.allStock')}</option>
              <option value="in-stock">✅ {t('inventory.inStock')}</option>
              <option value="low">⚠️ {t('inventory.lowStock')}</option>
            </select>
          </div>

          {/* Expiry Status Filter */}
          <div className="filter-item">
            <label className="filter-item-label">⏰ {t('inventory.expiryStatus')}</label>
            <select
              value={filterExpiryStatus}
              onChange={(e) => {
                setFilterExpiryStatus(e.target.value as "all" | "valid" | "near-expiry" | "expired");
                setCurrentPage(1);
              }}
              className="filter-item-select"
            >
              <option value="all">{t('inventory.allItems')}</option>
              <option value="valid">✅ {t('inventory.valid')}</option>
              <option value="near-expiry">🔔 {t('inventory.nearExpiry')}</option>
              <option value="expired">❌ {t('inventory.expired')}</option>
            </select>
          </div>

          {/* Items Per Page */}
          <div className="filter-item">
            <label className="filter-item-label">📄 {t('inventory.itemsPerPage')}</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="filter-item-select"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(search || filterCategory || filterBrand || filterStockStatus !== "all" || filterExpiryStatus !== "all") && (
          <div className="active-filters">
            <span className="active-filters-label">{t('inventory.activeFilters')}:</span>
            {search && <span className="filter-badge">🔍 {search}</span>}
            {filterCategory && <span className="filter-badge">📁 {filterCategory}</span>}
            {filterBrand && <span className="filter-badge">🏷️ {t('inventory.brand')}: {filterBrand}</span>}
            {filterStockStatus !== "all" && <span className="filter-badge">📦 {filterStockStatus.replace('-', ' ').toUpperCase()}</span>}
            {filterExpiryStatus !== "all" && <span className="filter-badge">⏰ {filterExpiryStatus.replace('-', ' ').toUpperCase()}</span>}
          </div>
        )}
      </div>

      {/* Results Information */}
      {totalRecords > 0 && (
        <div className="results-summary">
          <div className="summary-left">
            <span className="summary-stat">
              <strong>{totalRecords}</strong> {t('inventory.productsFound')}
            </span>
            <span className="summary-divider">•</span>
            <span className="summary-stat">
              {t('inventory.showing')} <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> {t('inventory.to')}{" "}
              <strong>{Math.min(currentPage * itemsPerPage, totalRecords)}</strong>
            </span>
          </div>
          <div className="summary-right">
            <span className="summary-page">
              {t('inventory.page')} <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Product Cards */}
      {data.length > 0 ? (
        <>
          <div className="inventory-products">
            {data.map((product) => (
                <div key={product.productId} className="product-card">
                  {/* Product Header */}
                  <div className="product-header">
                    <div className="product-info">
                      <h3 className="product-name">{product.productName}</h3>
                      <div className="product-sku-section">
                        <div className="product-sku">
                          {t('inventory.sku')}: <strong>{product.productSku}</strong>
                        </div>
                        {product.barcode && (
                          <div className="product-sku-barcode">
                            <img
                              src={`data:image/png;base64,${product.barcode}`}
                              alt="barcode"
                              className="product-sku-barcode-img"
                              onClick={() => {
                                setBarcodePreview(product.barcode || null);
                                setShowBarcodeModal(true);
                              }}
                              title="Click to preview barcode"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="product-qty-badge">
                      {t('inventory.totalQty')}: <strong>{product.totalQty}</strong>
                    </div>
                  </div>

                  {/* Batch Table (Desktop) */}
                  <div className="batches-desktop">
                    <table className="batches-table">
                      <thead>
                        <tr>
                          <th>{t('inventory.batchNo')}</th>
                          <th>{t('inventory.expiryDate')}</th>
                          <th className="text-center">{t('inventory.quantity')}</th>
                          <th className="text-center">{t('inventory.expiryStatusColumn')}</th>
                          <th className="text-center">{t('inventory.stockStatusColumn')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.batches.map((batch) => {
                          const isLowStock = batch.qty <= LOW_STOCK_LIMIT;
                          return (
                            <tr key={batch.batchNo} className={isLowStock ? "low-stock" : ""}>
                              <td className="batch-no">{batch.batchNo}</td>
                              <td className="expiry-date">
                                {new Date(batch.expiry).toLocaleDateString()}
                              </td>
                              <td className="qty-cell">{batch.qty}</td>
                              <td className="status-cell">{getExpiryBadge(batch.expiry)}</td>
                              <td className="stock-status">
                                {isLowStock ? (
                                  <span className="badge badge-danger">{t('inventory.lowStock')}</span>
                                ) : (
                                  <span className="badge badge-success">{t('inventory.inStock')}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Batch Stacked View (Mobile) */}
                  <div className="batches-mobile">
                    {product.batches.map((batch) => {
                      const isLowStock = batch.qty <= LOW_STOCK_LIMIT;
                      return (
                        <div key={batch.batchNo} className="batch-item">
                          <div className="batch-header">
                            <div className="batch-no">{batch.batchNo}</div>
                            <div className="batch-date">
                              {new Date(batch.expiry).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="batch-body">
                            <div className="batch-qty">
                              {t('inventory.qty')}: <strong>{batch.qty}</strong>
                            </div>
                            <div className="batch-badges">
                              <div>{getExpiryBadge(batch.expiry)}</div>
                              {isLowStock ? (
                                <span className="badge badge-danger">{t('inventory.lowStock')}</span>
                              ) : (
                                <span className="badge badge-success">{t('inventory.inStock')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>

          {/* Pagination */}
          {totalRecords > 0 && (
            <div className="pagination-container" style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              marginTop: "20px",
              padding: "16px",
              background: "#f9f9f9",
              borderRadius: "4px"
            }}>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="pagination-btn pagination-prev"
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  background: currentPage === 1 ? "#f0f0f0" : "#fff",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "13px"
                }}
              >
                ← {t('inventory.previous')}
              </button>
              
              <div className="pagination-info" style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                fontSize: "13px"
              }}>
                <span>{t('inventory.page')}</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                    setCurrentPage(page);
                  }}
                  style={{
                    width: "50px",
                    padding: "6px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    textAlign: "center"
                  }}
                />
                <span>{t('inventory.of')} <strong>{totalPages}</strong></span>
              </div>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="pagination-btn pagination-next"
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  background: currentPage === totalPages ? "#f0f0f0" : "#fff",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "13px"
                }}
              >
                {t('inventory.next')} →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3 className="empty-title">{t('inventory.noInventoryItemsFound')}</h3>
          <p className="empty-message">
            {search ? `${t('inventory.noInventoryMatches')} "${search}"` : (filterCategory || filterBrand || filterStockStatus !== "all" || filterExpiryStatus !== "all") ? t('inventory.noItemsMatchFilters') : t('inventory.startByAddingFirst')}
          </p>
        </div>
      )}

      {/* Barcode Preview Modal */}
      <Modal show={showBarcodeModal} onHide={() => setShowBarcodeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('inventory.barcodePreview')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {barcodePreview ? (
            <>
              <img
                src={`data:image/png;base64,${barcodePreview}`}
                alt="barcode"
                style={{ maxWidth: "100%" }}
              />
              <div className="mt-3">
                <a
                  href={`data:image/png;base64,${barcodePreview}`}
                  download="barcode.png"
                  className="btn btn-outline-primary btn-sm"
                >
                  📥 {t('inventory.download')}
                </a>
              </div>
            </>
          ) : (
            <div className="text-muted">{t('inventory.noPreviewAvailable')}</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default InventoryList;
