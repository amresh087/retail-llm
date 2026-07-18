import api from "./api";

export interface Product {
  id?: number;
  sku: string;
  name: string;
  nameHi?: string;
  description: string;
  category: string;
  categoryHi?: string;
  brandId?: number;
  brandName?: string;
  brandNameHi?: string;
  unit: string;
  price: number;
  discountAmount?: number;
  status: "ACTIVE" | "INACTIVE";
  externalBarcode?: string;
  barcode?: string;
  loose?: boolean; // true = sold loose/bulk
  packetSize?: number;
  packetUnit?: string;
  productSize?: number;
}

export interface Category {
  id: number;
  category: string;
  categoryHi?: string;
  isActive: boolean;
}

export interface Brand {
  id: number;
  brand: string;
  nameHi?: string;
  isActive: boolean;
}

// GET all products
export const getAllProducts = (page?: number, limit?: number) => {
  if (page !== undefined && limit !== undefined) {
    return api.get<Product[]>("/products", { params: { page, limit } });
  }
  return api.get<Product[]>("/products");
};

// GET categories → returns Category[] (includes inactive for admin)
export const getCategories = () => api.get<Category[]>("/products/categories");

// GET only active categories → returns Category[] (for dropdowns)
export const getActiveCategories = () => api.get<Category[]>("/products/categories/active");

// GET all active brands → returns Brand[] (for dropdowns)
export const getActiveBrands = () => api.get<Brand[]>("/products/brands/active");

// GET brands by category ID → returns Brand[]
export const getBrandsByCategory = (categoryId: number) =>
  api.get<Brand[]>(`/products/categories/${categoryId}/brands`);

// GET brands by category name (legacy) → returns string[]
export const getBrandsByCategoryName = (category: string) =>
  api.get<string[]>(`/products/brands/category/${category}`);

// GET product names by brand ID → returns string[]
export const getNamesByBrand = (brandId: number) =>
  api.get<string[]>("/products/search/brand", { params: { brandId } });

// GET products by category and brand → returns Product[]
export const getProductsByBrand = (brand: string) =>
  api.get<Product[]>("/products/search/brand-name", { params: { brand } });

// GET product by sku → returns Product
export const getProductBySku = (sku: string) =>
  api.get<Product>("/products/search/sku", { params: { sku } });

// GET product by barcode (works for both SKU and external barcode) → returns Product
export const getProductByBarcode = (barcode: string) =>
  api.get<Product>("/products/search/barcode", { params: { barcode } });

// ==============================
// CATEGORY-BRAND MAPPING
// ==============================

// Map a brand to a category
export const mapBrandToCategory = (categoryId: number, brandId: number) =>
  api.post("/products/categories/brands/map", { categoryId, brandId });

// Unmap a brand from a category
export const unmapBrandFromCategory = (categoryId: number, brandId: number) =>
  api.delete("/products/categories/brands/unmap", {
    data: { categoryId, brandId }
  });

// Check if brand is mapped to a category
export const isBrandMappedToCategory = (categoryId: number, brandId: number) =>
  api.get<boolean>(`/products/categories/${categoryId}/brands/${brandId}`);

// ==============================
// FILTER PRODUCTS (Customer Shopping)
// ==============================

// Filter products by category, brand, and search term
export const filterProducts = (
  categoryId?: number | null,
  brandId?: number | null,
  searchTerm?: string | null
) => {
  const params = new URLSearchParams();
  if (categoryId) params.append('categoryId', String(categoryId));
  if (brandId) params.append('brandId', String(brandId));
  if (searchTerm) params.append('searchTerm', searchTerm);
  
  const queryString = params.toString();
  const url = queryString ? `/products/filter?${queryString}` : '/products/filter';
  
  return api.get<Product[]>(url);
};

// ==============================
// CREATE/UPDATE/DELETE
// ==============================

// CREATE product
export const createProduct = (product: Product) =>
  api.post("/products", product);

// UPDATE product
export const updateProduct = (id: number, product: Product) =>
  api.put(`/products/${id}`, product);

// DELETE product
export const deleteProduct = (id: number) =>
  api.delete(`/products/${id}`);
