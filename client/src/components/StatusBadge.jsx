import React from 'react';
import { Clock, CheckCircle2, Flame, BellRing, XCircle } from 'lucide-react';

export function getStatusConfig(status) {
  switch (status?.toLowerCase()) {
    case 'pending':
      return {
        label: 'Order Placed',
        bg: '#fef3c7',
        color: '#b45309',
        border: '#fde68a',
        icon: <Clock size={14} />
      };
    case 'accepted':
      return {
        label: 'Accepted',
        bg: '#eff6ff',
        color: '#1d4ed8',
        border: '#bfdbfe',
        icon: <CheckCircle2 size={14} />
      };
    case 'preparing':
      return {
        label: 'Preparing',
        bg: '#f3e8ff',
        color: '#7e22ce',
        border: '#e9d5ff',
        icon: <Flame size={14} />
      };
    case 'ready':
      return {
        label: 'Ready for Pickup',
        bg: '#ecfdf5',
        color: '#047857',
        border: '#a7f3d0',
        icon: <BellRing size={14} />,
        pulse: true
      };
    case 'completed':
      return {
        label: 'Collected',
        bg: '#f1f5f9',
        color: '#475569',
        border: '#cbd5e1',
        icon: <CheckCircle2 size={14} />
      };
    case 'rejected':
    case 'cancelled':
      return {
        label: status === 'rejected' ? 'Declined' : 'Cancelled',
        bg: '#ffe4e6',
        color: '#be123c',
        border: '#fecdd3',
        icon: <XCircle size={14} />
      };
    default:
      return {
        label: status || 'Unknown',
        bg: '#f1f5f9',
        color: '#64748b',
        border: '#e2e8f0',
        icon: null
      };
  }
}

export default function StatusBadge({ status, size = 'normal' }) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`badge ${config.pulse ? 'pulse-ready' : ''}`}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        borderColor: config.border,
        borderWidth: '1px',
        borderStyle: 'solid',
        padding: size === 'large' ? '0.45rem 0.9rem' : '0.25rem 0.65rem',
        fontSize: size === 'large' ? '0.85rem' : '0.75rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '9999px',
        fontWeight: 700
      }}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
