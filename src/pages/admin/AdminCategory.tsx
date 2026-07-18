import React, { useEffect, useState } from 'react';import { useTranslation } from 'react-i18next';import api from '../../services/api';
import AdminHeader from '../../components/AdminHeader';
import './AdminCategory.css';

interface Category {
  id: number;
  category: string;
  categoryHi?: string;
  isActive: boolean;
}

interface CategoryFormData {
  category: string;
  categoryHi?: string;
}

const AdminCategory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [formData, setFormData] = useState<CategoryFormData>({
    category: '',
    categoryHi: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Load categories
  useEffect(() => {
    loadCategories(1, itemsPerPage);
  }, []);

  // Reload on page/itemsPerPage change
  useEffect(() => {
    if (currentPage > 0) {
      loadCategories(currentPage, itemsPerPage);
    }
  }, [currentPage, itemsPerPage]);

  const loadCategories = async (page: number = 1, limit: number = itemsPerPage) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📡 Loading categories: page=${page}, limit=${limit}`);
      const response = await api.get('/products/categories', {
        params: { page, limit }
      });
      
      // Handle both direct array and paginated response
      let categoriesData = [];
      let total = 0;
      
      if (Array.isArray(response.data)) {
        // Direct array response
        categoriesData = response.data;
        total = response.data.length;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Paginated response with data wrapper
        categoriesData = response.data.data;
        total = response.data.total || categoriesData.length;
      } else if (response.data?.content && Array.isArray(response.data.content)) {
        // Spring Data page response
        categoriesData = response.data.content;
        total = response.data.totalElements || categoriesData.length;
      }
      
      console.log(`✅ Categories loaded: ${categoriesData.length} items, total: ${total}`);
      setCategories(categoriesData);
      setTotalRecords(total);
      setTotalPages(Math.ceil(total / limit));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load categories';
      setError(errorMsg);
      console.error('Error loading categories:', err);
      setCategories([]);
      setTotalRecords(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ category: '', categoryHi: '' });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setIsEditing(true);
    setEditingId(category.id);
    setFormData({ category: category.category, categoryHi: (category as any).categoryHi || '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ category: '', categoryHi: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category.trim()) {
      setError(`❌ ${t('categories.nameRequired')}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing && editingId) {
        // Update category
        console.log(`✏️ Updating category: ${formData.category} (ID: ${editingId})`);
        await api.put(`/products/categories/${editingId}`, {
          category: formData.category,
          categoryHi: formData.categoryHi
        });
        setSuccess(`✅ ${t('categories.updatedSuccessfully', { name: formData.category })}`);
      } else {
        // Create new category
        console.log(`➕ Creating new category: ${formData.category}`);
        await api.post('/products/category', {
          category: formData.category,
          categoryHi: formData.categoryHi
        });
        setSuccess(`✅ ${t('categories.createdSuccessfully', { name: formData.category })}`);
      }

      setCurrentPage(1); // Reset to page 1
      loadCategories(1, itemsPerPage);
      closeModal();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('categories.failedToSave');
      setError(`❌ ${errorMsg}`);
      console.error('Error saving category:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const categoryToUpdate = categories.find(cat => cat.id === id);
    const categoryName = getLocalized(categoryToUpdate?.category, categoryToUpdate?.categoryHi) || 'Unknown';
    const newStatus = currentStatus ? 'deactivated' : 'activated';
    
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} category: ${categoryName} (ID: ${id})`);

      await api.put(`/products/categories/${id}/toggle`);
      const successKey = newStatus === 'activated' ? 'activatedSuccessfully' : 'deactivatedSuccessfully';
      setSuccess(`✅ ${t(`categories.${successKey}`, { name: categoryName })}`);
      console.log(`✅ Category "${categoryName}" ${newStatus}`);
      loadCategories(currentPage, itemsPerPage);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const failKey = newStatus === 'activated' ? 'failedToActivate' : 'failedToDeactivate';
      const errorMsg = err.response?.data?.message || t(`categories.${failKey}`);
      setError(`❌ ${errorMsg}`);
      console.error(`Error ${newStatus} category:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    // Find the category name for confirmation
    const categoryToDelete = categories.find(cat => cat.id === id);
    const categoryName = getLocalized(categoryToDelete?.category, categoryToDelete?.categoryHi) || 'Unknown';
    
    if (!window.confirm(
      t('categories.confirmDelete', { name: categoryName })
    )) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`🗑️ Deleting category: ${categoryName} (ID: ${id})`);
      
      // Delete is just deactivate
      await api.put(`/products/categories/${id}/toggle`);
      setSuccess(`✅ ${t('categories.deletedSuccessfully', { name: categoryName })}`);
      console.log(`✅ Category "${categoryName}" deleted`);
      loadCategories(currentPage, itemsPerPage);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('categories.failedToDelete');
      setError(`❌ ${errorMsg}`);
      console.error('Error deleting category:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pagination with search filter (client-side filtering on server-side paginated data)
  const filteredCategories = categories.filter(cat =>
    getLocalized(cat.category, cat.categoryHi).toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.id.toString().includes(searchTerm)
  );

  // Use server-paginated data directly
  const currentCategories = categories;

  return (
    <div className="admin-category-container">
      <AdminHeader 
        title={t('categories.categoryManagement')}
        description={t('categories.manageDesc')}
      />
      
      <div className="category-wrapper">
        <div className="category-controls">
          <div className="controls-header">
            <div className="header-content">
              <h1 className="page-title">{t('categories.title')}</h1>
              <p className="page-subtitle">{t('categories.subtitle')}</p>
            </div>
            <button onClick={openCreateModal} className="add-category-btn">
              <span className="btn-icon">➕</span>
              {t('categories.addCategory')}
            </button>
          </div>

          {/* Search Bar & Items Per Page */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder={t('categories.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>
            
            {/* Items Per Page Selector */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563", marginBottom: 0 }}>
                📄 {t('categories.perPage')}
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
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

        {/* Loading State */}
        {loading && currentCategories.length === 0 ? (
          <div className="loading-container">
            <div className="spinner">
              <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">{t('categories.loadingCategories')}</p>
          </div>
        ) : (
          <>
            {/* Categories Grid/Table */}
            <div className="categories-container">
              {currentCategories.length > 0 ? (
                <>
            {/* Categories Count & Pagination Info */}
            {currentCategories.length > 0 && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.03) 100%)",
                border: "1px solid rgba(102, 126, 234, 0.1)",
                borderRadius: "12px",
                marginBottom: "16px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#4b5563"
              }}>
                <div>
                  <strong style={{ color: "#667eea" }}>{totalRecords}</strong> {t('categories.totalCategories')}
                </div>
                <div style={{ fontSize: "13px", color: "#999" }}>
                  {t('categories.page')} <strong style={{ color: "#667eea" }}>{currentPage}</strong> {t('categories.of')} <strong style={{ color: "#667eea" }}>{totalPages}</strong>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "12px",
                marginTop: "24px",
                padding: "16px",
                background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.03) 100%)",
                border: "1px solid rgba(102, 126, 234, 0.1)",
                borderRadius: "12px",
                flexWrap: "wrap"
              }}>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
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
                  {t('categories.previous')}
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

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
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
                  {t('categories.next')}
                </button>

                <div style={{
                  marginLeft: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#667eea",
                  paddingLeft: "12px",
                  borderLeft: "2px solid rgba(102, 126, 234, 0.2)"
                }}>
                  {t('categories.page')} <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
                </div>
              </div>
            )}
                  <div className="categories-grid">
                    {currentCategories.map((category) => (
                      <div key={category.id} className="category-card">
                        <div className="card-header">
                          <h3 className="category-name">{getLocalized(category.category, category.categoryHi)}</h3>
                          <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                            {category.isActive ? t('categories.active') : t('categories.inactive')}
                          </span>
                        </div>
                        <div className="card-body">
                          <div className="category-info">
                            <span className="info-label">{t('categories.id')}</span>
                            <span className="info-value">#{category.id}</span>
                          </div>
                        </div>
                        <div className="card-footer">
                          <button
                            onClick={() => handleToggleStatus(category.id, category.isActive)}
                            className={`toggle-status-btn ${category.isActive ? 'active' : ''}`}
                            title={category.isActive ? t('categories.deactivateTooltip') : t('categories.activateTooltip')}
                          >
                            {category.isActive ? t('categories.deactivate') : t('categories.activate')}
                          </button>
                          <button
                            onClick={() => openEditModal(category)}
                            className="edit-btn"
                            title={t('categories.editTooltip')}
                          >
                            {t('categories.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="delete-btn"
                            title={t('categories.deleteTooltip')}
                          >
                            {t('categories.delete')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <h3 className="empty-title">{t('categories.noCategories')}</h3>
                  <p className="empty-message">
                    {searchTerm ? `${t('categories.noCategoriesFound')} "${searchTerm}"` : t('categories.startByAdding')}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Container - Old one, needs to be removed */}
            {totalPages > 1 && (
              <div className="pagination-container" style={{ display: "none" }}>
                {/* This is replaced by the new pagination above */}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {isEditing ? `✏️ ${t('categories.editCategory')}` : `➕ ${t('categories.addCategory')}`}
              </h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="category-name" className="form-label">{t('categories.categoryNameLabel')}</label>
                <input
                  id="category-name"
                  type="text"
                  placeholder={t('categories.enterCategoryName')}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                  required
                />
                {formData.category === '' && (
                  <span className="form-error">{t('categories.nameRequired')}</span>
                )}
                <label htmlFor="category-name-hi" className="form-label mt-2">{t('categories.categoryHindiLabel')}</label>
                <input
                  id="category-name-hi"
                  type="text"
                  placeholder={t('categories.enterCategoryNameHindi')}
                  value={formData.categoryHi || ''}
                  onChange={(e) => setFormData({ ...formData, categoryHi: e.target.value })}
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
                  disabled={loading || formData.category === ''}
                  className="btn-submit"
                >
                  {loading ? (
                    <>
                      <span className="spinner-mini"></span>
                      {t('categories.saving')}
                    </>
                  ) : isEditing ? (
                    t('categories.update')
                  ) : (
                    t('categories.create')
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

export default AdminCategory;
