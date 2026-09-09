import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, restaurant } = useAuth();
  const { notify } = useNotification();

  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      setConnected(true);
      console.log('⚡ Connected to Cut the Queue Real-Time Server');
    });

    s.on('disconnect', () => {
      setConnected(false);
      console.log('❌ Disconnected from Real-Time Server');
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Manage room subscriptions based on active authentication
  useEffect(() => {
    if (!socket || !connected) return;

    if (user?.role === 'customer') {
      socket.emit('join:customer', user.id);
    }

    if (user?.role === 'restaurant_admin' && restaurant?.id) {
      socket.emit('join:restaurant', restaurant.id);
    }
  }, [socket, connected, user, restaurant]);

  // Global Real-Time listeners for notifications
  useEffect(() => {
    if (!socket) return;

    // Customer order ready notification
    const handleOrderReady = (data) => {
      notify({
        title: 'Your order is ready! 🔔',
        message: data.notification?.message || `Order ${data.order_number} is ready for pickup at ${data.restaurant_name}!`,
        type: 'ready',
        sound: true,
        vibrate: true,
        soundType: 'ready',
        duration: 8000
      });
    };

    // Restaurant incoming new order alert
    const handleNewOrder = (data) => {
      notify({
        title: 'NEW ORDER 🔔',
        message: `Incoming order ${data.order?.order_number} for ₹${data.order?.total}!`,
        type: 'info',
        sound: true,
        vibrate: true,
        soundType: 'new_order',
        duration: 6000
      });
    };

    socket.on('order:ready', handleOrderReady);
    socket.on('order:created', handleNewOrder);

    return () => {
      socket.off('order:ready', handleOrderReady);
      socket.off('order:created', handleNewOrder);
    };
  }, [socket, notify]);

  const joinOrderRoom = (orderId) => {
    if (socket && orderId) {
      socket.emit('join:order', orderId);
    }
  };

  const leaveOrderRoom = (orderId) => {
    if (socket && orderId) {
      socket.emit('leave:order', orderId);
    }
  };

  const value = {
    socket,
    connected,
    joinOrderRoom,
    leaveOrderRoom
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
