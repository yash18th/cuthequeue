import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio chime unsupported or blocked:', e);
    }
  }, [soundEnabled]);

  const notify = useCallback(({ title, message, type = 'info' }) => {
    playChime();
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, [playChime]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify, soundEnabled, setSoundEnabled }}>
      {children}
      {/* Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px'
        }}
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              background: '#0B352D',
              color: '#F8F1DF',
              border: '1px solid #C49A52',
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              animation: 'modalPop 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#C49A52', fontSize: '0.9rem' }}>{n.title}</strong>
              <button
                type="button"
                onClick={() => removeNotification(n.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#F8F1DF',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
            {n.message && <p style={{ fontSize: '0.82rem', opacity: 0.9 }}>{n.message}</p>}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
