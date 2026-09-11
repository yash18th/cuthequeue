import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useBranch } from './BranchContext';
import { useNotification } from './NotificationContext';
import { getBaseUrl } from '../utils/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const { selectedBranch, isSuperAdmin } = useBranch();
  const { notify } = useNotification();

  const currentRoomRef = useRef(null);

  // Initialize socket client with robust reconnection settings
  useEffect(() => {
    const socketUrl = getBaseUrl();
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    s.on('connect', () => {
      setConnected(true);
      console.log('⚡ Admin Console connected to Real-Time Server:', s.id);

      // Re-join active branch room on reconnect
      if (currentRoomRef.current) {
        s.emit('join:branch', currentRoomRef.current);
        s.emit('join:restaurant', currentRoomRef.current);
        console.log(`📡 Rejoined room for branch #${currentRoomRef.current}`);
      }
      if (isSuperAdmin) {
        s.emit('join:super');
      }
    });

    s.on('reconnect', (attempt) => {
      setConnected(true);
      console.log(`⚡ Reconnected on attempt #${attempt}`);
      if (currentRoomRef.current) {
        s.emit('join:branch', currentRoomRef.current);
        s.emit('join:restaurant', currentRoomRef.current);
      }
    });

    s.on('disconnect', (reason) => {
      setConnected(false);
      console.log('❌ Admin Console disconnected from Real-Time Server:', reason);
    });

    s.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection warning:', err.message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isSuperAdmin]);

  // Dynamically switch Socket.IO room when selected branch changes
  useEffect(() => {
    if (!socket || !connected || !selectedBranch?.id) return;

    const branchId = selectedBranch.id;

    // Leave previous room if changed
    if (currentRoomRef.current && currentRoomRef.current !== branchId) {
      socket.emit('leave:branch', currentRoomRef.current);
      socket.emit('leave:restaurant', currentRoomRef.current);
      console.log(`🚪 Left real-time room for branch #${currentRoomRef.current}`);
    }

    // Join new branch room
    socket.emit('join:branch', branchId);
    socket.emit('join:restaurant', branchId);
    currentRoomRef.current = branchId;

    console.log(`📡 Joined real-time room for branch #${branchId} (${selectedBranch.name || selectedBranch.branch_name})`);
  }, [socket, connected, selectedBranch?.id, selectedBranch?.name, selectedBranch?.branch_name]);

  // Global event listener for new orders targeting the active branch
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      const order = data?.order || data;
      if (!order) return;

      const orderBranchId = order.branch_id || order.restaurant_id;
      // If super admin or order belongs to current selected branch, notify!
      if (isSuperAdmin || !selectedBranch?.id || Number(orderBranchId) === Number(selectedBranch.id)) {
        const num = order.order_number || order.id || 'Live';
        const itemsCount = Array.isArray(order.items) ? order.items.length : 1;
        const amt = Number(order.total_amount || order.total || 0);
        const branchStr = order.branch_name || selectedBranch?.branch_name || '';

        notify({
          title: `🔔 New Order ${num}!`,
          message: `${branchStr ? `📍 ${branchStr} • ` : ''}${itemsCount} item${itemsCount > 1 ? 's' : ''} • ₹${amt}`,
          type: 'success'
        });
      }
    };

    socket.on('order:created', handleNewOrder);

    return () => {
      socket.off('order:created', handleNewOrder);
    };
  }, [socket, notify, selectedBranch?.id, selectedBranch?.branch_name, isSuperAdmin]);

  return (
    <SocketContext.Provider value={{ socket, connected, currentBranchId: selectedBranch?.id }}>
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
