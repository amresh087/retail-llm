import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ListGroup,
  Spinner,
  Alert,
  Badge
} from 'react-bootstrap';
import AdminHeader from '../../components/AdminHeader';
import {
  getCategories,
  getActiveBrands,
  getBrandsByCategory,
  mapBrandToCategory,
  unmapBrandFromCategory,
  type Category,
  type Brand
} from '../../services/productService';
import './CategoryBrandMapping.css';

/* =======================
   Interfaces
======================= */

interface Category {
  id: number;
  category: string;
  isActive: boolean;
}

interface Brand {
  id: number;
  brand: string;
  isActive: boolean;
}

/* =======================
   Component
======================= */

const CategoryBrandMapping: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [mappedBrands, setMappedBrands] = useState<Brand[]>([]);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* =======================
     Load Categories & Brands
  ======================= */

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesRes, brandsRes] = await Promise.all([
        getCategories(),
        getActiveBrands()
      ]);

      setCategories(categoriesRes.data);
      setAllBrands(brandsRes.data);

      // Set first category as selected if available
      if (categoriesRes.data.length > 0) {
        setSelectedCategory(categoriesRes.data[0].id);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || t('categoryBrandMapping.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     Load Mapped Brands
  ======================= */

  useEffect(() => {
    if (!selectedCategory) return;

    const loadMappedBrands = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const response = await getBrandsByCategory(selectedCategory);
        const mapped = Array.isArray(response.data) ? response.data : [];
        setMappedBrands(mapped);

        // Calculate available brands (not mapped yet)
        const mappedIds = mapped.map(b => b.id);
        const available = allBrands.filter(b => !mappedIds.includes(b.id));
        setAvailableBrands(available);

        setSelectedBrand(null);
      } catch (err: any) {
        console.log('Brands not yet mapped for this category', err?.message);
        setMappedBrands([]);
        setAvailableBrands(allBrands);
      } finally {
        setLoading(false);
      }
    };

    loadMappedBrands();
  }, [selectedCategory, allBrands, categories]);

  /* =======================
     Add Brand Mapping
  ======================= */

  const handleAddMapping = async () => {
    if (!selectedCategory || !selectedBrand) {
      setError(t('categoryBrandMapping.pleaseSelectCategory'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await mapBrandToCategory(selectedCategory, selectedBrand);

      setSuccess(`✅ ${t('categoryBrandMapping.mapped')}`);
      setSelectedBrand(null);

      // Reload mapped brands
      const response = await getBrandsByCategory(selectedCategory);
      const mapped = Array.isArray(response.data) ? response.data : [];
      setMappedBrands(mapped);

      const mappedIds = mapped.map(b => b.id);
      const available = allBrands.filter(b => !mappedIds.includes(b.id));
      setAvailableBrands(available);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('categoryBrandMapping.failedToAdd'));
      console.error('Add mapping error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     Remove Brand Mapping
  ======================= */

  const handleRemoveMapping = async (brandId: number) => {
    if (!selectedCategory) return;

    if (!window.confirm(t('categoryBrandMapping.confirmRemove'))) return;

    try {
      setLoading(true);
      setError(null);

      await unmapBrandFromCategory(selectedCategory, brandId);

      setSuccess(`✅ ${t('categoryBrandMapping.unmapped')}`);

      // Reload mapped brands
      const response = await getBrandsByCategory(selectedCategory);
      const mapped = Array.isArray(response.data) ? response.data : [];
      setMappedBrands(mapped);

      const mappedIds = mapped.map(b => b.id);
      const available = allBrands.filter(b => !mappedIds.includes(b.id));
      setAvailableBrands(available);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('categoryBrandMapping.failedToRemove'));
      console.error('Remove mapping error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     Get Category Name
  ======================= */

  const getCategoryName = () => {
    return categories.find(c => c.id === selectedCategory)?.category || 'N/A';
  };

  /* =======================
     Render
  ======================= */

  if (loading && categories.length === 0) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <div className="text-muted mt-2">{t('categoryBrandMapping.loading')}</div>
      </div>
    );
  }

  return (
    <div className="category-brand-mapping-page">
      <AdminHeader />

      <Container className="mt-4 mb-5">
        <h2 className="text-center mb-4">
          📋 {t('categoryBrandMapping.pageTitle')}
        </h2>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Row className="g-4">
          {/* =======================
             LEFT: Category Selection
          ======================= */}

          <Col lg={4}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-primary text-white">
                <Card.Title className="mb-0">
                  {t('categoryBrandMapping.selectCategories')}
                </Card.Title>
              </Card.Header>

              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t('categoryBrandMapping.selectCategoryLabel')}</Form.Label>
                  <Form.Select
                    value={selectedCategory || ''}
                    onChange={e => setSelectedCategory(Number(e.target.value))}
                  >
                    <option value="">{t('categoryBrandMapping.selectCategoryPlaceholder')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.category}
                        {!cat.isActive && ` (${t('categoryBrandMapping.inactive')})`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {selectedCategory && (
                  <Alert variant="info" className="mb-0">
                    <strong>{t('categoryBrandMapping.selected')}</strong> {getCategoryName()}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* =======================
             CENTER: Add Brand Mapping
          ======================= */}

          <Col lg={4}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-success text-white">
                <Card.Title className="mb-0">
                  {t('categoryBrandMapping.addBrandMapping')}
                </Card.Title>
              </Card.Header>

              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">{t('categoryBrandMapping.availableBrands')}</Form.Label>
                  <Form.Select
                    value={selectedBrand || ''}
                    onChange={e => setSelectedBrand(Number(e.target.value) || null)}
                    disabled={!selectedCategory || availableBrands.length === 0}
                  >
                    <option value="">{t('categoryBrandMapping.selectBrand')}</option>
                    {availableBrands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.brand}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {!selectedCategory && (
                  <Alert variant="warning" className="small mb-3">
                    {t('categoryBrandMapping.pleaseSelectCategory')}
                  </Alert>
                )}

                {selectedCategory && availableBrands.length === 0 && (
                  <Alert variant="info" className="small mb-3">
                    {t('categoryBrandMapping.allBrandsMapped')}
                  </Alert>
                )}

                <Button
                  variant="success"
                  className="w-100"
                  disabled={!selectedCategory || !selectedBrand || loading}
                  onClick={handleAddMapping}
                >
                  {loading ? t('categoryBrandMapping.adding') : t('categoryBrandMapping.addMapping')}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* =======================
             RIGHT: Mapped Brands
          ======================= */}

          <Col lg={4}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-info text-white">
                <Card.Title className="mb-0">
                  ✓ {t('categoryBrandMapping.mappedBrands')} ({mappedBrands.length})
                </Card.Title>
              </Card.Header>

              <Card.Body className="p-0">
                {mappedBrands.length === 0 ? (
                  <div className="p-3 text-muted text-center">
                    <small>{t('categoryBrandMapping.noBrandsMapped')}</small>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {mappedBrands.map(brand => (
                      <ListGroup.Item 
                        key={brand.id}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <div className="fw-semibold">{brand.brand}</div>
                          {!brand.isActive && (
                            <Badge bg="warning" className="small">
                              {t('categoryBrandMapping.inactive')}
                            </Badge>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveMapping(brand.id)}
                          disabled={loading}
                          title={t('categoryBrandMapping.removeMapping')}
                        >
                          ✕
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* =======================
           Summary Section
        ======================= */}

        <Card className="mt-4 shadow-sm border-0 bg-light">
          <Card.Body>
            <Row className="text-center">
              <Col md={3}>
                <div className="fs-5 fw-bold text-primary">
                  {categories.length}
                </div>
                <small className="text-muted">{t('categoryBrandMapping.totalCategories')}</small>
              </Col>
              <Col md={3}>
                <div className="fs-5 fw-bold text-success">
                  {allBrands.length}
                </div>
                <small className="text-muted">{t('categoryBrandMapping.totalBrands')}</small>
              </Col>
              <Col md={3}>
                <div className="fs-5 fw-bold text-info">
                  {mappedBrands.length}
                </div>
                <small className="text-muted">
                  {t('categoryBrandMapping.brandsInCategory')} {getCategoryName()}
                </small>
              </Col>
              <Col md={3}>
                <div className="fs-5 fw-bold text-warning">
                  {availableBrands.length}
                </div>
                <small className="text-muted">{t('categoryBrandMapping.availableToMap')}</small>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default CategoryBrandMapping;
