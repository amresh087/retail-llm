import React, { useEffect, useState } from 'react';
import { Form, Spinner, Alert } from 'react-bootstrap';
import {
  getActiveCategories,
  getActiveBrands,
  getBrandsByCategory,
  type Category,
  type Brand
} from '../../services/productService';

/* =======================
   Props Interface
======================= */

interface CategoryBrandSelectorProps {
  selectedCategory: string | null;
  selectedBrand: number | null;
  onCategoryChange: (categoryId: string | null) => void;
  onBrandChange: (brandId: number | null) => void;
  showBrandFilter?: boolean;
  disabled?: boolean;
  layout?: 'horizontal' | 'vertical';
  error?: string | null;
}

/* =======================
   Component
======================= */

const CategoryBrandSelector: React.FC<CategoryBrandSelectorProps> = ({
  selectedCategory,
  selectedBrand,
  onCategoryChange,
  onBrandChange,
  showBrandFilter = true,
  disabled = false,
  layout = 'vertical',
  error = null
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [mappedBrands, setMappedBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);

  // Debug: Log when component receives props
  useEffect(() => {
    if (selectedCategory) {
      console.log('📨 CategoryBrandSelector received props: selectedCategory =', selectedCategory, '| type:', typeof selectedCategory);
    }
  }, [selectedCategory]);

  /* =======================
     Load Categories Only (NOT all brands)
  ======================= */

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        console.log('📥 Loading categories...');
        const res = await getActiveCategories();
        console.log('✅ Categories loaded:', res.data);
        setCategories(res.data);
        
        // Load all brands for reference, but DON'T display them
        console.log('📥 Loading all brands for reference...');
        const brandsRes = await getActiveBrands();
        console.log('✅ Brands loaded (reference only):', brandsRes.data?.length, 'brands');
        setBrands(brandsRes.data);
      } catch (err) {
        console.error('❌ Failed to load categories/brands', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  /* =======================
     Load Brands by Category
  ======================= */

  useEffect(() => {
    console.log('⚡ useEffect triggered with selectedCategory:', selectedCategory);
    
    if (!selectedCategory) {
      console.log('⚠️ selectedCategory is falsy, resetting brands');
      setMappedBrands([]);
      onBrandChange(null);
      return;
    }

    console.log('✅ selectedCategory is valid, calling loadBrandsByCategory');

    const loadBrandsByCategory = async () => {
      try {
        console.log('🚀 loadBrandsByCategory function started');
        setLoading(true);
        
        // Validate selectedCategory
        if (!selectedCategory || selectedCategory === '') {
          console.warn('selectedCategory is empty or invalid');
          setMappedBrands([]);
          return;
        }

        // Convert selectedCategory to number for API call
        const categoryId = typeof selectedCategory === 'string' 
          ? parseInt(selectedCategory, 10) 
          : selectedCategory;
        
        // Validate categoryId
        if (isNaN(categoryId) || categoryId <= 0) {
          console.error('Invalid categoryId:', categoryId, 'from selectedCategory:', selectedCategory);
          setMappedBrands([]);
          return;
        }

        console.log('🔍 Loading brands for categoryId:', categoryId, '| selectedCategory:', selectedCategory);
        console.log('📡 API URL will be:', `/products/categories/${categoryId}/brands`);
        const res = await getBrandsByCategory(categoryId);
        
        console.log('📦 API response data:', res.data);
        console.log('📦 API response type:', typeof res.data);
        console.log('📦 Is array?', Array.isArray(res.data));
        console.log('📦 Is empty?', res.data?.length === 0);

        // The API returns Brand[] objects from mapping
        if (Array.isArray(res.data)) {
          if (res.data.length > 0) {
            // Successfully got mapped brands
            console.log('✅ Found', res.data.length, 'mapped brands:', res.data);
            setMappedBrands(res.data as Brand[]);
          } else {
            // No brands mapped to this category
            console.warn('⚠️ No brands mapped to category:', categoryId);
            setMappedBrands([]);
          }
        } else {
          console.error('❌ Unexpected API response format (not array):', res.data);
          setMappedBrands([]);
        }

        onBrandChange(null); // Reset selected brand
      } catch (err) {
        console.error('❌ Error caught in catch block:', err);
        console.error('❌ Error message:', (err as any)?.message);
        console.error('❌ Full error object:', err);
        setMappedBrands([]);
      } finally {
        setLoading(false);
      }
    };

    loadBrandsByCategory();
  }, [selectedCategory]);

  /* =======================
     Get Category Name
  ======================= */

  const getCategoryName = () => {
    return categories.find(c => c.id.toString() === selectedCategory)?.category || '';
  };

  const getBrandName = () => {
    const brandObj = mappedBrands.find(b => b.id === selectedBrand);
    return brandObj?.brand || '';
  };

  /* =======================
     Render
  ======================= */

  const containerClasses = layout === 'horizontal' ? 'd-flex gap-3' : '';

  return (
    <div className={containerClasses}>
      {error && <Alert variant="danger" className="w-100 mb-3">{error}</Alert>}

      {/* CATEGORY SELECT */}
      <Form.Group className={layout === 'horizontal' ? 'flex-grow-1' : 'mb-3'}>
        <Form.Label className="fw-semibold mb-2 d-flex align-items-center gap-2">
          <span>📁 Category</span>
          {loading && <Spinner animation="border" size="sm" />}
        </Form.Label>

        <Form.Select
          value={selectedCategory || ''}
          onChange={e => onCategoryChange(e.target.value || null)}
          disabled={disabled || loading}
          isInvalid={error ? true : false}
        >
          <option value="">-- Select Category --</option>
          {categories.map(cat => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.category}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* BRAND SELECT */}
      {showBrandFilter && (
        <Form.Group className={layout === 'horizontal' ? 'flex-grow-1' : 'mb-3'}>
          <Form.Label className="fw-semibold mb-2 d-flex align-items-center gap-2">
            <span>🏷️ Brand</span>
            {loading && <Spinner animation="border" size="sm" />}
            <span className="badge bg-secondary" style={{fontSize: '0.7rem'}}>
              {mappedBrands.length} mapped
            </span>
          </Form.Label>

          <Form.Select
            value={selectedBrand || ''}
            onChange={e => onBrandChange(Number(e.target.value) || null)}
            disabled={disabled || !selectedCategory || mappedBrands.length === 0 || loading}
            isInvalid={error ? true : false}
          >
            <option value="">
              {!selectedCategory 
                ? '-- Select Category First --' 
                : mappedBrands.length === 0 
                  ? '-- No brands mapped --'
                  : '-- Select Brand --'}
            </option>
            {mappedBrands.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.brand}
              </option>
            ))}
          </Form.Select>

          {/* DEBUG: Show what brands are in mappedBrands */}
          {selectedCategory && (
            <div style={{fontSize: '0.8rem', marginTop: '4px', color: '#666'}}>
              <small>
                Category: <strong>{selectedCategory}</strong> | Brands in state: <strong>{mappedBrands.length}</strong>
                {mappedBrands.length > 0 && (
                  <div style={{marginTop: '4px'}}>
                    [{mappedBrands.map(b => `${b.brand}(${b.id})`).join(', ')}]
                  </div>
                )}
              </small>
            </div>
          )}

          {!selectedCategory && (
            <Form.Text className="text-info mt-1 d-block">
              👆 Select a category first to see available brands
            </Form.Text>
          )}

          {selectedCategory && mappedBrands.length === 0 && !loading && (
            <Form.Text className="text-warning mt-1 d-block">
              ⚠️ No brands mapped to this category
            </Form.Text>
          )}
        </Form.Group>
      )}
    </div>
  );
};

export default CategoryBrandSelector;
