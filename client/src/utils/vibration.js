// Safe Vibration API helper with graceful fallback
export function triggerVibration(pattern = [200, 100, 200, 100, 300]) {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      const success = navigator.vibrate(pattern);
      if (success) {
        console.log('📳 Device vibration triggered successfully:', pattern);
        return true;
      }
    }
    console.log('ℹ️ Vibration API not supported or ignored by this device/browser.');
    return false;
  } catch (err) {
    console.warn('Vibration failed:', err);
    return false;
  }
}

export function isVibrationSupported() {
  return typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function';
}
