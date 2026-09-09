import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CustomerHome from './pages/CustomerHome';
import RestaurantPage from './pages/RestaurantPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RestaurantMenuManagement from './pages/RestaurantMenuManagement';
import RestaurantSettings from './pages/RestaurantSettings';
import RestaurantAnalytics from './pages/RestaurantAnalytics';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

function MainApp() {
  const { user, isRestaurantAdmin, isSuperAdmin } = useAuth();

  // Page routing state
  const [activePage, setActivePage] = useState('landing');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(1); // Default Campus Cafe
  const [trackedOrderId, setTrackedOrderId] = useState(2); // Default active preparing order #CQ1042
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [ordersInitialTab, setOrdersInitialTab] = useState('browse');

  // Render current page component
  const renderContent = () => {
    switch (activePage) {
      case 'landing':
        return (
          <LandingPage
            setActivePage={setActivePage}
            onOpenCart={() => setIsCartOpen(true)}
          />
        );

      case 'auth':
        return <AuthPage setActivePage={setActivePage} />;

      case 'home':
        return (
          <CustomerHome
            setActivePage={setActivePage}
            setSelectedRestaurantId={setSelectedRestaurantId}
          />
        );

      case 'restaurant-menu-view':
        return (
          <RestaurantPage
            restaurantId={selectedRestaurantId}
            setActivePage={setActivePage}
            onOpenCart={() => setIsCartOpen(true)}
          />
        );

      case 'checkout':
        return (
          <CheckoutPage
            setActivePage={setActivePage}
            setTrackedOrderId={setTrackedOrderId}
          />
        );

      case 'order-tracking':
        return (
          <OrderTrackingPage
            orderId={trackedOrderId}
            setActivePage={setActivePage}
          />
        );

      case 'orders':
        return (
          <OrderHistoryPage
            setActivePage={setActivePage}
            setTrackedOrderId={setTrackedOrderId}
            setSelectedRestaurantId={setSelectedRestaurantId}
            initialTab={ordersInitialTab}
          />
        );

      case 'profile':
        return <CustomerProfilePage setActivePage={setActivePage} />;

      // Restaurant Admin Pages
      case 'restaurant-dashboard':
        return <RestaurantDashboard setActivePage={setActivePage} />;

      case 'restaurant-menu':
        return <RestaurantMenuManagement />;

      case 'restaurant-settings':
        return <RestaurantSettings />;

      case 'restaurant-analytics':
        return <RestaurantAnalytics />;

      // Super Admin Pages
      case 'superadmin':
        return <SuperAdminDashboard />;

      default:
        return (
          <CustomerHome
            setActivePage={setActivePage}
            setSelectedRestaurantId={setSelectedRestaurantId}
          />
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        ordersInitialTab={ordersInitialTab}
        setOrdersInitialTab={setOrdersInitialTab}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {renderContent()}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        setActivePage={setActivePage}
      />

      <BottomNav
        activePage={activePage}
        setActivePage={setActivePage}
        ordersInitialTab={ordersInitialTab}
        setOrdersInitialTab={setOrdersInitialTab}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {activePage !== 'order-tracking' && <Footer setActivePage={setActivePage} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SocketProvider>
          <CartProvider>
            <MainApp />
          </CartProvider>
        </SocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
