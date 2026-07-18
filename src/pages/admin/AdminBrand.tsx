import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import AdminHeader from '../../components/AdminHeader';
import './AdminBrand.css';

interface Brand {
  id: number;
  brand: string;
  nameHi?: string;
  isActive: boolean;
}

interface BrandFormData {
  brand: string;
  nameHi?: string;
}

const AdminBrand: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getLocalized = (en?: string, hi?: string): string => {
    const enText = en || '';
    const hiText = hi || '';
    const language = i18n.language || 'en';
    return language.startsWith('hi') ? (hiText || enText) : (enText || hiText);
  };

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<BrandFormData>({
    brand: '',
    nameHi: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Load brands
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/products/brands');
      setBrands(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('brands.failedToSave'));
      console.error('Error loading brands:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ brand: '', nameHi: '' });
    setShowModal(true);
  };

  const openEditModal = (brand: Brand) => {
    setIsEditing(true);
    setEditingId(brand.id);
    setFormData({ brand: brand.brand, nameHi: (brand as any).nameHi || '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ brand: '', nameHi: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.brand.trim()) {
      setError(`❌ ${t('brands.nameRequired')}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing && editingId) {
        // Update brand
        await api.put(`/products/brand/${editingId}`, {
          brand: formData.brand,
          nameHi: formData.nameHi
        });
        setSuccess(`✅ ${t('brands.updatedSuccessfully')}`);
      } else {
        // Create new brand
        await api.post('/products/brand', {
          brand: formData.brand,
          nameHi: formData.nameHi
        });
        setSuccess(`✅ ${t('brands.createdSuccessfully')}`);
      }

      loadBrands();
      closeModal();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('brands.failedToSave');
      setError(`❌ ${errorMsg}`);
      console.error('Error saving brand:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      setLoading(true);
      setError(null);

      await api.put(`/products/brand/${id}/toggle`);
      const successKey = currentStatus ? 'deactivatedSuccessfully' : 'activatedSuccessfully';
      setSuccess(`✅ ${t(`brands.${successKey}`)}`);
      loadBrands();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('brands.failedToToggle');
      setError(`❌ ${errorMsg}`);
      console.error('Error toggling brand:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('brands.confirmDelete'))) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.delete(`/products/brand/${id}`);
      setSuccess(`✅ ${t('brands.deletedSuccessfully')}`);
      loadBrands();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('brands.failedToDelete');
      setError(`❌ ${errorMsg}`);
      console.error('Error deleting brand:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pagination with search filter
  const filteredBrands = brands.filter(brand =>
    getLocalized(brand.brand, brand.nameHi).toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.id.toString().includes(searchTerm)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBrands = filteredBrands.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);

  if (loading && brands.length === 0) {
    return (
      <div className="admin-brand-container">
        <div className="loading-container">
          <div className="spinner">
            <div className="spinner-ring"></div>
          </div>
          <p className="loading-text">{t('brands.loadingBrands')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-brand-container">
      <AdminHeader 
        title={t('brands.brandManagement')}
        description={t('brands.manageDesc')}
      />
      
      <div className="brand-wrapper">
        <div className="brand-controls">
          <div className="controls-header">
            <div className="header-content">
              <h1 className="page-title">{t('brands.title')}</h1>
              <p className="page-subtitle">{t('brands.subtitle')}</p>
            </div>
            <button onClick={openCreateModal} className="add-brand-btn">
              <span className="btn-icon">➕</span>
              {t('brands.addBrand')}
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder={t('brands.searchPlaceholder')}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>
            {searchTerm && (
              <div className="search-results-info">
                {t('brands.showing')} {filteredBrands.length} {filteredBrands.length !== 1 ? t('brands.results') : t('brands.result')}
              </div>
            )}
          </div>
        </div>

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

        {/* Brands Grid */}
        <div className="brands-container">
          {currentBrands.length > 0 ? (
            <>
              <div className="brands-count">
                {t('brands.showing')} <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> {t('brands.to')} <strong>{Math.min(currentPage * itemsPerPage, filteredBrands.length)}</strong> {t('brands.of')} <strong>{filteredBrands.length}</strong> {filteredBrands.length !== 1 ? t('brands.brands') : t('brands.brand')}
              </div>
              <div className="brands-grid">
                {currentBrands.map((brand) => (
                  <div key={brand.id} className="brand-card">
                    <div className="card-header">
                      <h3 className="brand-name">{getLocalized(brand.brand, brand.nameHi)}</h3>
                      <span className={`status-badge ${brand.isActive ? 'active' : 'inactive'}`}>
                        {brand.isActive ? t('brands.active') : t('brands.inactive')}
                      </span>
                    </div>
                    <div className="card-body">
                      <div className="brand-info">
                        <span className="info-label">{t('brands.id')}</span>
                        <span className="info-value">#{brand.id}</span>
                      </div>
                    </div>
                    <div className="card-footer">
                      <button
                        onClick={() => openEditModal(brand)}
                        className="edit-btn"
                      >
                        {t('brands.edit')}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(brand.id, brand.isActive)}
                        className={`toggle-status-btn ${brand.isActive ? 'active' : ''}`}
                      >
                        {brand.isActive ? t('brands.deactivate') : t('brands.activate')}
                      </button>
                      <button
                        onClick={() => handleDelete(brand.id)}
                        className="delete-btn"
                      >
                        {t('brands.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏷️</div>
              <h3 className="empty-title">{t('brands.noBrands')}</h3>
              <p className="empty-message">
                {searchTerm ? `${t('brands.noBrandsFound')} "${searchTerm}"` : t('brands.startByAdding')}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn pagination-prev"
            >
              {t('brands.previous')}
            </button>
            <div className="pagination-info">
              {t('brands.page')} <span className="current-page">{currentPage}</span> {t('brands.of')} <span className="total-pages">{totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn pagination-next"
            >
              {t('brands.next')}
            </button>
          </div>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {isEditing ? `✏️ ${t('brands.editBrand')}` : `➕ ${t('brands.addBrand')}`}
              </h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="brand-name" className="form-label">{t('brands.brandNameLabel')}</label>
                <input
                  id="brand-name"
                  type="text"
                  placeholder={t('brands.enterBrandName')}
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="form-input"
                  required
                  autoFocus
                />
                {formData.brand === '' && (
                  <span className="form-error">{t('brands.nameRequired')}</span>
                )}
                <label htmlFor="brand-name-hi" className="form-label mt-2">{t('brands.brandHindiLabel')}</label>
                <input
                  id="brand-name-hi"
                  type="text"
                  placeholder={t('brands.enterBrandNameHindi')}
                  value={formData.nameHi || ''}
                  onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-cancel"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.brand === ''}
                  className="btn-submit"
                >
                  {loading ? (
                    <>
                      <span className="spinner-mini"></span>
                      {t('brands.saving')}
                    </>
                  ) : isEditing ? (
                    t('brands.update')
                  ) : (
                    t('brands.create')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrand;
