import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from './config';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserHome from './pages/UserHome';
import AdminHome from './pages/AdminHome';
import AdminUsers from './pages/AdminUsers';
import AdminAddUser from './pages/AdminAddUser';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminCompanies from './pages/AdminCompanies';
import AdminCompanyForm from './pages/AdminCompanyForm';
import ContractorHome from './pages/ContractorHome';
import CompanyForm from './pages/CompanyForm';
import LandingPage from './pages/landingpage';
// Import new Kanban board pages
import BoardsPage from './pages/BoardsPage';
import BoardDetailPage from './pages/BoardDetailPage';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          {/* Set landing page as the default route */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route 
            path="/user" 
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserHome />
              </ProtectedRoute>
            } 
          />
          
          {/* Kanban board routes */}
          <Route 
            path="/boards" 
            element={
              <ProtectedRoute allowedRoles={['user', 'admin', 'contractor', 'store_owner']}>
                <BoardsPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/boards/:boardId" 
            element={
              <ProtectedRoute allowedRoles={['user', 'admin', 'contractor', 'store_owner']}>
                <BoardDetailPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminHome />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/stores" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCompanies />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/stores/new" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCompanyForm />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/users/new" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAddUser />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/users/:id" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUserDetail />
              </ProtectedRoute>
            } 
          />
          
          {/* Store Owner routes */}
          <Route 
            path="/owner" 
            element={
              <ProtectedRoute allowedRoles={['contractor', 'store_owner']}>
                <ContractorHome />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/owner/store/new" 
            element={
              <ProtectedRoute allowedRoles={['contractor', 'store_owner']}>
                <CompanyForm />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route - redirect to landing page instead of login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;