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

  // Join the restaurant / branch room once authenticated and socket is ready
  useEffect(() => {
    if (!socket || !connected || !restaurant?.id) return;

    socket.emit('join:restaurant', restaurant.id);
    socket.emit('join:branch', restaurant.id);
    console.log(`📡 Joined real-time room for restaurant/branch #${restaurant.id} (${restaurant.name} - ${restaurant.branch_name || ''})`);
  }, [socket, connected, restaurant?.id, restaurant?.name, restaurant?.branch_name]);

  // Global event listener for new orders
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      const order = data?.order || data;
      if (!order) return;
      const num = order.order_number || order.id || 'Live';
      const itemsCount = Array.isArray(order.items) ? order.items.length : 1;
      const amt = Number(order.total_amount || order.total || 0);
      const branchStr = order.branch_name || restaurant?.branch_name || '';

      notify({
        title: `🔔 New Order ${num}!`,
        message: `${branchStr ? `📍 ${branchStr} • ` : ''}${itemsCount} item${itemsCount > 1 ? 's' : ''} • ₹${amt}`,
        type: 'success'
      });
    };

    socket.on('order:created', handleNewOrder);

    return () => {
      socket.off('order:created', handleNewOrder);
    };
  }, [socket, notify, restaurant?.branch_name]);

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
