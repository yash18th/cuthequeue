/**
 * Utility to format scheduled pickup times consistently across the admin application.
 */
export function formatScheduledTime(timeStr) {
  if (!timeStr) return '';
  const trimmed = String(timeStr).trim();
  
  // Format "HH:mm" or "HH:mm:ss" like "14:30" or "09:15"
  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  // Already formatted like "02:30 PM"
  if (/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // ISO / date string
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return trimmed;
}

export function formatOrderNumber(orderNumber, id) {
  if (!orderNumber && !id) return '#';
  const val = String(orderNumber || id).trim();
  return val.startsWith('#') ? val : `#${val}`;
}
