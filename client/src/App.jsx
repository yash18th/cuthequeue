import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CustomerHome from './pages/CustomerHome';
import BrandDetailPage from './pages/BrandDetailPage';
import RestaurantPage from './pages/RestaurantPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Scroll to top automatically on route changes
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function MainApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Selected state for compatibility with existing modals & callbacks
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(1);
  const [trackedOrderId, setTrackedOrderId] = useState(2);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Backward-compatibility bridge for any child component calling setActivePage
  const setActivePage = (page, meta) => {
    switch (page) {
      case 'landing':
        navigate('/');
        break;
      case 'home':
      case 'browse':
      case 'restaurants':
        navigate('/restaurants');
        break;
      case 'brand-detail': {
        const target = meta?.brandSlug || meta?.brandId || '';
        navigate(`/restaurants/${target}`);
        break;
      }
      case 'branch-detail': {
        const brandSlug = meta?.brandSlug || 'brand';
        const branchId = meta?.branchId || meta?.restaurantId;
        navigate(`/restaurants/${brandSlug}/branches/${branchId}`);
        break;
      }
      case 'orders':
        navigate('/orders');
        break;
      case 'cart':
        navigate('/cart');
        break;
      case 'checkout':
        navigate('/checkout');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'auth':
        navigate('/login');
        break;
      case 'restaurant-menu-view': {
        const id = meta?.restaurantId || selectedRestaurantId;
        navigate(`/restaurant/${id}`);
        break;
      }
      case 'order-tracking': {
        const id = meta?.orderId || trackedOrderId;
        navigate(`/orders/${id}`);
        break;
      }
      case 'queue': {
        const id = meta?.orderId || trackedOrderId;
        navigate(`/orders/${id}`);
        break;
      }
      default:
        break;
    }
  };

  const hideFooter = location.pathname.startsWith('/orders/') || location.pathname.startsWith('/queue/') || location.pathname === '/order-tracking';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScrollToTop />

      <Navbar
        setActivePage={setActivePage}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Restaurant Discovery Flow */}
          <Route
            path="/"
            element={
              <LandingPage
                setActivePage={setActivePage}
                onOpenCart={() => setIsCartOpen(true)}
              />
            }
          />
          <Route
            path="/restaurants"
            element={
              <CustomerHome
                setActivePage={setActivePage}
                setSelectedRestaurantId={setSelectedRestaurantId}
              />
            }
          />
          <Route
            path="/browse"
            element={
              <CustomerHome
                setActivePage={setActivePage}
                setSelectedRestaurantId={setSelectedRestaurantId}
              />
            }
          />
          <Route
            path="/restaurants/:brandIdOrSlug"
            element={
              <BrandDetailPage
                setActivePage={setActivePage}
                setSelectedRestaurantId={setSelectedRestaurantId}
              />
            }
          />
          <Route
            path="/restaurants/:brandIdOrSlug/branches/:restaurantId"
            element={
              <RestaurantPage
                setActivePage={setActivePage}
                onOpenCart={() => setIsCartOpen(true)}
              />
            }
          />
          <Route
            path="/restaurant/:restaurantId"
            element={
              <RestaurantPage
                setActivePage={setActivePage}
                onOpenCart={() => setIsCartOpen(true)}
              />
            }
          />
          <Route
            path="/restaurant/:restaurantId/menu"
            element={
              <RestaurantPage
                setActivePage={setActivePage}
                onOpenCart={() => setIsCartOpen(true)}
              />
            }
          />

          {/* Customer Pre-order Flow */}
          <Route
            path="/cart"
            element={<CartPage setActivePage={setActivePage} />}
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CheckoutPage
                  setActivePage={setActivePage}
                  setTrackedOrderId={setTrackedOrderId}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrderConfirmationPage setActivePage={setActivePage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrderHistoryPage
                  setActivePage={setActivePage}
                  setTrackedOrderId={setTrackedOrderId}
                  setSelectedRestaurantId={setSelectedRestaurantId}
                  initialTab="orders"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrderTrackingPage setActivePage={setActivePage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order/:orderId"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrderTrackingPage setActivePage={setActivePage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/queue/:orderId"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrderTrackingPage setActivePage={setActivePage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-tracking"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrderTrackingPage orderId={trackedOrderId} setActivePage={setActivePage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerProfilePage setActivePage={setActivePage} />
              </ProtectedRoute>
            }
          />

          {/* Authentication */}
          <Route path="/signin" element={<AuthPage setActivePage={setActivePage} />} />
          <Route path="/auth" element={<AuthPage setActivePage={setActivePage} />} />
          <Route path="/login" element={<AuthPage setActivePage={setActivePage} />} />
          <Route path="/register" element={<AuthPage setActivePage={setActivePage} initialMode="register" />} />

          {/* 404 / Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        setActivePage={setActivePage}
      />

      <BottomNav
        setActivePage={setActivePage}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {!hideFooter && <Footer setActivePage={setActivePage} />}
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
              <CartProvider>
                <MainApp />
              </CartProvider>
            </SocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
