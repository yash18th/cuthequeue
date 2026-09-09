import React from 'react';
import { Clock, CheckCircle2, Flame, BellRing, XCircle } from 'lucide-react';

export function getStatusConfig(status) {
  switch (status?.toLowerCase()) {
    case 'pending':
      return {
        label: 'Order Placed',
        bg: '#FEF6EC',
        color: '#92400E',
        border: '#E8DDC8',
        icon: <Clock size={14} />
      };
    case 'accepted':
      return {
        label: 'Accepted',
        bg: '#EEF6F4',
        color: '#123C32',
        border: '#C7DED7',
        icon: <CheckCircle2 size={14} />
      };
    case 'preparing':
      return {
        label: 'Preparing',
        bg: '#FEF6EC',
        color: '#A98242',
        border: '#E4CE9D',
        icon: <Flame size={14} />
      };
    case 'ready':
      return {
        label: 'Ready for Pickup',
        bg: '#EEF6F4',
        color: '#0B2923',
        border: '#A8CFC4',
        icon: <BellRing size={14} />,
        pulse: true
      };
    case 'completed':
      return {
        label: 'Collected',
        bg: '#F5EDE1',
        color: '#57534E',
        border: '#DDD2C0',
        icon: <CheckCircle2 size={14} />
      };
    case 'rejected':
    case 'cancelled':
      return {
        label: status === 'rejected' ? 'Declined' : 'Cancelled',
        bg: '#FAECEB',
        color: '#641F27',
        border: '#E8C4C2',
        icon: <XCircle size={14} />
      };
    default:
      return {
        label: status || 'Unknown',
        bg: '#F5EDE1',
        color: '#8C827A',
        border: '#E8DDC8',
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
