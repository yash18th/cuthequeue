import React, { createContext, useContext, useState, useEffect } from 'react';
import { playReadyChime, playNewOrderChime, playSuccessChime } from '../utils/sound';
import { triggerVibration, isVibrationSupported } from '../utils/vibration';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm;
    }
    return 'denied';
  };

  const addToast = ({ title, message, type = 'info', duration = 5000, actionLabel, onAction }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type, actionLabel, onAction }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Trigger rich notification (In-app toast + Audio Chime + Device Vibration + System Notification)
  const notify = ({
    title,
    message,
    type = 'info',
    sound = true,
    vibrate = true,
    soundType = 'ready', // 'ready', 'new_order', 'success'
    actionLabel,
    onAction
  }) => {
    // 1. In-app toast
    addToast({ title, message, type, actionLabel, onAction });

    // 2. Audio Chime
    if (sound) {
      if (soundType === 'ready') playReadyChime();
      else if (soundType === 'new_order') playNewOrderChime();
      else playSuccessChime();
    }

    // 3. Device Vibration
    if (vibrate) {
      triggerVibration([200, 100, 200, 100, 300]);
    }

    // 4. Browser System Push/Desktop Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          vibrate: [200, 100, 200]
        });
      } catch (e) {
        console.warn('Browser system notification failed:', e);
      }
    }
  };

  const value = {
    toasts,
    addToast,
    removeToast,
    notify,
    requestNotificationPermission,
    notificationPermission: permission,
    isVibrationSupported: isVibrationSupported()
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Toast Alert Banner Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: 'calc(100% - 40px)',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: toast.type === 'ready' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#0f172a',
              color: '#ffffff',
              borderRadius: '14px',
              padding: '14px 18px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              border: toast.type === 'ready' ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
              animation: 'slideUp 0.25s ease-out',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <strong style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {toast.type === 'ready' ? '🔔' : toast.type === 'error' ? '⚠️' : '✨'} {toast.title}
              </strong>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1', padding: '0 4px' }}
              >
                &times;
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: '4px 0 0 0', lineHeight: 1.4 }}>
              {toast.message}
            </p>
            {toast.actionLabel && toast.onAction && (
              <button
                onClick={() => {
                  toast.onAction();
                  removeToast(toast.id);
                }}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '8px',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                {toast.actionLabel} &rarr;
              </button>
            )}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
