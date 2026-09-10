import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { getBaseUrl } from '../utils/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { restaurant } = useAuth();
  const { notify } = useNotification();

  useEffect(() => {
    const socketUrl = getBaseUrl();
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      setConnected(true);
      console.log('⚡ Admin Console connected to Real-Time Server');
    });

    s.on('disconnect', () => {
      setConnected(false);
      console.log('❌ Admin Console disconnected from Real-Time Server');
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Join the restaurant room once authenticated and socket is ready
  useEffect(() => {
    if (!socket || !connected || !restaurant?.id) return;

    socket.emit('join:restaurant', restaurant.id);
    console.log(`📡 Joined real-time room for restaurant #${restaurant.id} (${restaurant.name})`);
  }, [socket, connected, restaurant?.id]);

  // Global event listener for new orders
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order) => {
      notify({
        title: `🔔 New Order #${order.order_number || order.id}!`,
        message: `${order.items?.length || 1} items • ₹${order.total_amount || 0}`,
        type: 'success'
      });
    };

    socket.on('order:created', handleNewOrder);

    return () => {
      socket.off('order:created', handleNewOrder);
    };
  }, [socket, notify]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
