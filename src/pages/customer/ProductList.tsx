import { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Form } from 'react-bootstrap';
import {
  getActiveCategories,
  getBrandsByCategory,
  getNamesByBrand
} from '../../services/productService';
import './ProductList.css';

const ProductList = () => {
  /* ======================
     State
  ====================== */
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ======================
     LOAD CATEGORIES ON MOUNT
  ====================== */
  useEffect(() => {
    console.log('📥 Loading categories on mount');
    setLoading(true);
    getActiveCategories()
      .then(res => {
        console.log('✅ Categories loaded:', res.data?.length);
        setCategories(res.data || []);
      })
      .catch(err => {
        console.error('❌ Failed to load categories:', err);
        setError('Failed to load categories');
      })
      .finally(() => setLoading(false));
  }, []);

  /* ======================
     LOAD BRANDS BY CATEGORY
  ====================== */
  const loadBrandsByCategory = (categoryName: string) => {
    if (!categoryName) {
      console.log('⚠️ No category selected, clearing brands');
      setBrands([]);
      setFilterBrand('');
      return;
    }

    console.log('🔄 Category changed:', categoryName);
    setLoadingBrands(true);
    
    // Find category ID from category name
    const categoryObj = categories.find((c: any) => c.category === categoryName);
    if (!categoryObj || !categoryObj.id) {
      console.warn('⚠️ Category ID not found');
      setBrands([]);
      setLoadingBrands(false);
      return;
    }

    const categoryId = categoryObj.id;
    console.log('📡 Loading brands for categoryId:', categoryId);
    
    getBrandsByCategory(categoryId)
      .then(res => {
        console.log('✅ Brands loaded:', res.data?.length);
        setBrands(res.data || []);
      })
      .catch(err => {
        console.error('❌ Error loading brands:', err);
        setBrands([]);
      })
      .finally(() => setLoadingBrands(false));
  };

  /* ======================
     HANDLE CATEGORY CHANGE
  ====================== */
  const handleCategoryChange = (categoryName: string) => {
    console.log('📌 Category selected:', categoryName);
    setFilterCategory(categoryName);
    setFilterBrand(''); // Reset brand when category changes
    loadBrandsByCategory(categoryName);
  };

  /* ======================
     LOAD PRODUCTS BY BRAND
  ====================== */
  useEffect(() => {
    if (!filterBrand) {
      console.log('⚠️ No brand selected');
      setProducts([]);
      return;
    }

    console.log('🔄 Brand changed:', filterBrand);
    setLoading(true);
    
    getNamesByBrand(Number(filterBrand))
      .then(res => {
        console.log('✅ Products loaded:', res.data?.length);
        setProducts(res.data || []);
      })
      .catch(err => {
        console.error('❌ Error loading products:', err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [filterBrand]);

  /* ======================
     Filter displayed products
  ====================== */
  const getFilteredProducts = useMemo(() => {
    let filtered = products || [];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p: any) =>
        (p.name?.toLowerCase().includes(term)) ||
        (p.sku?.toLowerCase().includes(term)) ||
        (p.description?.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  }, [products, searchTerm]);

  /* =======================
     Add to cart handler
  ======================= */

  const handleAddToCart = (product: any) => {
    console.log('🛒 Add to cart:', product);
    alert(`${product.name} added to cart!`);
  };

  /* =======================
     Render product card
  ======================= */

  const renderProductCard = (product: any) => (
    <Col md={6} lg={4} key={product.id || product.sku} className="mb-4">
      <Card className="h-100 shadow-sm hover-card product-card">
        <Card.Body className="d-flex flex-column">
          <div className="mb-2">
            {filterCategory && <span className="badge bg-primary me-2">{filterCategory}</span>}
            {filterBrand && (
              <span className="badge bg-success">
                {brands.find((b: any) => b.id.toString() === filterBrand)?.brand || 'Brand'}
              </span>
            )}
          </div>
          <Card.Title className="mt-2">{product.name || product.sku}</Card.Title>
          <Card.Text className="text-muted small flex-grow-1">
            SKU: {product.sku || 'N/A'}
            <br />
            {product.loose ? (
              <span className="text-primary">Sold loose / bulk</span>
            ) : (
              <span>Pack: {product.packetSize ? `${product.packetSize} ${product.packetUnit || product.unit}` : 'N/A'}</span>
            )}
          </Card.Text>
          <div className="mt-auto">
            <div className="d-flex justify-content-between align-items-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddToCart(product)}
              >
                🛒 Add
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  /* =======================
     Render
  ======================= */

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h2 className="mb-1">🛍️ Shop Products</h2>
        <p className="text-muted small">Select category and brand to browse products</p>
      </div>

      {/* FILTERS SECTION */}
      <Card className="mb-4 bg-light border-0">
        <Card.Body>
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">🔍 Search & Filter Products</h5>
              <span style={{
                background: "#e6f7ff",
                border: "1px solid #91d5ff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#0050b3"
              }}>
                {getFilteredProducts.length} Products
              </span>
            </div>

            {/* Search Input */}
            <div style={{
              position: "relative",
              marginBottom: "12px"
            }}>
              <Form.Control
                placeholder="Search by SKU or Product Name"
                value={searchTerm}
                onChange={e => {
                  console.log('🔍 Search term:', e.target.value);
                  setSearchTerm(e.target.value);
                }}
                style={{
                  paddingRight: "36px",
                  fontSize: "13px",
                  padding: "8px 12px"
                }}
              />
              <span style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "16px"
              }}>
                🔎
              </span>
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
                  onChange={e => handleCategoryChange(e.target.value)}
                  style={{ fontSize: "13px", padding: "8px 12px" }}
                  disabled={loading}
                >
                  <option value="">All Categories</option>
                  {categories
                    .filter((cat: any) => cat.isActive)
                    .map((cat: any) => (
                      <option key={cat.id} value={cat.category}>
                        {cat.category}
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
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.brand}
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
                    📁 {filterCategory}
                    <span 
                      onClick={() => handleCategoryChange("")}
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
                    🏷️ {brands.find((b: any) => b.id.toString() === filterBrand)?.brand || ""}
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
        </Card.Body>
      </Card>

      {/* ERROR STATE */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* LOADING STATE */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="mb-2">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Loading products...</p>
        </div>
      )}

      {/* PRODUCTS GRID */}
      {!loading && getFilteredProducts.length > 0 ? (
        <div>
          <Row className="mb-3">
            <Col>
              <p className="text-muted">
                Showing <strong>{getFilteredProducts.length}</strong> product{getFilteredProducts.length !== 1 ? 's' : ''}
              </p>
            </Col>
          </Row>
          <Row>
            {getFilteredProducts.map((product: any) => renderProductCard(product))}
          </Row>
        </div>
      ) : !loading ? (
        <Alert variant="info" className="text-center py-5">
          <h5>📦 No products found</h5>
          <p className="text-muted mb-0">
            {!filterCategory ? 'Select a category to see products' : !filterBrand ? 'Select a brand to see products' : 'No products match your search'}
          </p>
        </Alert>
      ) : null}
    </Container>
  );
};

export default ProductList;
