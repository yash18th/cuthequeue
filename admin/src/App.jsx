import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';

import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AdminNavbar from './components/AdminNavbar';
import QRScannerModal from './components/QRScannerModal';

import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminMenuPage from './pages/AdminMenuPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

function AdminLayout() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AdminNavbar onOpenScanner={() => setIsScannerOpen(true)} />
      
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={<AdminDashboardPage onOpenScanner={() => setIsScannerOpen(true)} />}
          />
          <Route path="/orders" element={<AdminOrdersPage />} />
          <Route path="/menu" element={<AdminMenuPage />} />
          <Route path="/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/settings" element={<AdminSettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <SocketProvider>
              <Routes>
                {/* Public Login Route */}
                <Route path="/login" element={<AdminLoginPage />} />

                {/* Protected Restaurant Admin Console Routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </SocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
