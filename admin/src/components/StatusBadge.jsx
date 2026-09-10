import React from 'react';
import { Clock, CheckCircle2, Flame, PackageCheck, AlertCircle, XCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const getBadgeConfig = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          icon: <Clock size={12} />,
          label: 'Pending',
          className: 'badge-pending'
        };
      case 'confirmed':
        return {
          icon: <CheckCircle2 size={12} />,
          label: 'Confirmed',
          className: 'badge-confirmed'
        };
      case 'preparing':
        return {
          icon: <Flame size={12} />,
          label: 'In Kitchen',
          className: 'badge-preparing'
        };
      case 'ready':
        return {
          icon: <PackageCheck size={12} />,
          label: 'Ready for Pickup',
          className: 'badge-ready'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 size={12} />,
          label: 'Completed',
          className: 'badge-completed'
        };
      case 'cancelled':
        return {
          icon: <XCircle size={12} />,
          label: 'Cancelled',
          className: 'badge-cancelled'
        };
      default:
        return {
          icon: <AlertCircle size={12} />,
          label: status || 'Unknown',
          className: 'badge-pending'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={`badge-status ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
