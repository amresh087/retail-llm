import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import RequireAuth from '../auth/RequireAuth';
import AdminLayout from '../components/layout/AdminLayout';

import AdminDashboard from '../pages/admin/AdminDashboard';
import TenantList from '../pages/admin/TenantList';
import UserList from '../pages/admin/UserList';
import DocumentList from '../pages/admin/DocumentList';
import EDITransform from '../pages/admin/EDITransform';
import Transactions from '../pages/admin/Transactions';
import AISettings from '../pages/admin/AISettings';
import PromptTemplates from '../pages/admin/PromptTemplates';
import AdminSettings from '../pages/admin/AdminSettings';
import TransactionTypes from '../pages/admin/TransactionTypes';
import Profile from '../pages/admin/Profile';
import JobsList from '../pages/admin/JobsList';
import LogsList from '../pages/admin/LogsList';
import Reports from '../pages/admin/Reports';
import FromPurchase from '../pages/admin/FromPurchase';
import AdminProduct from '../pages/admin/AdminProduct';
import AdminInventory from '../pages/admin/AdminInventory';
import AdminCategory from '../pages/admin/AdminCategory';
import AdminBrand from '../pages/admin/AdminBrand';
import AdminRewards from '../pages/admin/AdminRewards';

import ShopkeeperDashboard from '../pages/shopkeeper/ShopkeeperDashboard';
import Products from '../pages/shopkeeper/Products';
import Inventory from '../pages/shopkeeper/Inventory';
import Billing from '../pages/shopkeeper/Billing';
import ShopkeeperRewards from '../pages/shopkeeper/ShopkeeperRewards';

import CustomerDashboard from '../pages/customer/CustomerDashboard';
import ProductList from '../pages/customer/ProductList';
import Cart from '../pages/customer/Cart';
import Orders from '../pages/customer/Orders';
import Rewards from '../pages/customer/Rewards';

import LoginPage from '../pages/LoginPage';

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Default redirect */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* Public */}
    <Route path="/login" element={<LoginPage />} />

    {/* Admin Routes with Layout */}
    <Route
      path="/admin"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/tenants"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <TenantList />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/users"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <UserList />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/documents"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <DocumentList />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/edi-transform"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <EDITransform />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/transactions"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <Transactions />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/transaction-types"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <TransactionTypes />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/ai-settings"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <AISettings />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/prompts"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <PromptTemplates />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/reports"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <Reports />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/logs"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <LogsList />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/settings"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <AdminSettings />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/profile"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <Profile />
          </AdminLayout>
        </RequireAuth>
      }
    />
    <Route
      path="/admin/jobs"
      element={
        <RequireAuth roles={['ADMIN']}>
          <AdminLayout>
            <JobsList />
          </AdminLayout>
        </RequireAuth>
      }
    />

    {/* Shopkeeper */}
    <Route
      path="/shopkeeper"
      element={
        <RequireAuth roles={['SHOPKEEPER']}>
          <ShopkeeperDashboard />
        </RequireAuth>
      }
    />
    <Route
      path="/shopkeeper/products"
      element={
        <RequireAuth roles={['SHOPKEEPER']}>
          <Products />
        </RequireAuth>
      }
    />
    <Route
      path="/shopkeeper/inventory"
      element={
        <RequireAuth roles={['SHOPKEEPER']}>
          <Inventory />
        </RequireAuth>
      }
    />
    <Route
      path="/shopkeeper/billing"
      element={
        <RequireAuth roles={['SHOPKEEPER']}>
          <Billing />
        </RequireAuth>
      }
    />
    <Route
      path="/shopkeeper/rewards"
      element={
        <RequireAuth roles={['SHOPKEEPER']}>
          <ShopkeeperRewards />
        </RequireAuth>
      }
    />

    {/* Customer */}
    <Route
      path="/customer"
      element={
        <RequireAuth roles={['CUSTOMER']}>
          <CustomerDashboard />
        </RequireAuth>
      }
    />
    <Route
      path="/customer/products"
      element={
        <RequireAuth roles={['CUSTOMER']}>
          <ProductList />
        </RequireAuth>
      }
    />
    <Route
      path="/customer/cart"
      element={
        <RequireAuth roles={['CUSTOMER']}>
          <Cart />
        </RequireAuth>
      }
    />
    <Route
      path="/customer/orders"
      element={
        <RequireAuth roles={['CUSTOMER']}>
          <Orders />
        </RequireAuth>
      }
    />
    <Route
      path="/customer/rewards"
      element={
        <RequireAuth roles={['CUSTOMER']}>
          <Rewards />
        </RequireAuth>
      }
    />

    {/* Fallback */}
    <Route path="*" element={<h3>Page Not Found</h3>} />
  </Routes>
);

export default AppRoutes;
