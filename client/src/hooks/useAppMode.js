import { useState, useEffect } from 'react';

/**
 * checkIsAppMode — Synchronously inspects the runtime environment
 * to determine if the application is running in an installed PWA,
 * standalone display mode, Android TWA/WebView/APK, or iOS home screen web app.
 *
 * @returns {boolean}
 */
export function checkIsAppMode() {
  if (typeof window === 'undefined') return false;

  // 1. Check URL parameters for explicit app / PWA / APK launch flags
  try {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source')?.toLowerCase();
    const mode = params.get('mode')?.toLowerCase();
    const isAppFlag = params.get('app') === 'true' || params.get('pwa') === 'true' || params.get('apk') === 'true';

    if (
      ['pwa', 'apk', 'twa', 'app', 'mobile', 'installed'].includes(source) ||
      ['standalone', 'pwa', 'app', 'apk', 'fullscreen'].includes(mode) ||
      isAppFlag
    ) {
      sessionStorage.setItem('vajra_is_app_mode', 'true');
      return true;
    }
  } catch {
    // Ignore URL parsing errors
  }

  // 2. Check CSS Display Mode media queries (Chrome, Edge, Samsung Internet, Android WebAPK, Desktop PWA)
  try {
    if (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.matchMedia?.('(display-mode: fullscreen)').matches ||
      window.matchMedia?.('(display-mode: minimal-ui)').matches ||
      window.matchMedia?.('(display-mode: window-controls-overlay)').matches
    ) {
      sessionStorage.setItem('vajra_is_app_mode', 'true');
      return true;
    }
  } catch {
    // Ignore matchMedia errors
  }

  // 3. Check iOS Safari standalone mode (Add to Home Screen)
  if (window.navigator?.standalone === true) {
    sessionStorage.setItem('vajra_is_app_mode', 'true');
    return true;
  }

  // 4. Check Android Trusted Web Activity (TWA) or Android App referrer
  if (
    typeof document !== 'undefined' &&
    document.referrer &&
    (document.referrer.startsWith('android-app://') || document.referrer.includes('android-app://'))
  ) {
    sessionStorage.setItem('vajra_is_app_mode', 'true');
    return true;
  }

  // 5. Check WebView, Capacitor, Cordova, or Native Bridge user agents / globals
  const ua = navigator.userAgent || '';
  if (
    /;\s*wv/.test(ua) || // Android WebView identifier
    (/Android/i.test(ua) && /Version\/[0-9.]+/i.test(ua) && /Chrome\/[0-9.]+/i.test(ua)) || // Classic Android WebView
    /Capacitor|Cordova|Electron/i.test(ua) ||
    Boolean(window.Android || window.Capacitor || window.cordova)
  ) {
    sessionStorage.setItem('vajra_is_app_mode', 'true');
    return true;
  }

  // 6. Check persisted session storage flag (retains standalone state throughout in-app navigation)
  try {
    if (sessionStorage.getItem('vajra_is_app_mode') === 'true') {
      return true;
    }
  } catch {
    // Ignore storage access errors
  }

  return false;
}

/**
 * useAppMode — React hook that provides dynamic detection of PWA / Standalone / APK mode.
 * Automatically updates if the display mode changes dynamically.
 *
 * @returns {boolean} isAppMode
 */
export function useAppMode() {
  const [isAppMode, setIsAppMode] = useState(() => checkIsAppMode());

  useEffect(() => {
    // Initial check
    const currentMode = checkIsAppMode();
    setIsAppMode(currentMode);

    // Listen for display mode media query changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const standaloneQuery = window.matchMedia('(display-mode: standalone)');
      const fullscreenQuery = window.matchMedia('(display-mode: fullscreen)');
      const minimalUiQuery = window.matchMedia('(display-mode: minimal-ui)');

      const handleChange = () => {
        setIsAppMode(checkIsAppMode());
      };

      try {
        standaloneQuery.addEventListener('change', handleChange);
        fullscreenQuery.addEventListener('change', handleChange);
        minimalUiQuery.addEventListener('change', handleChange);

        return () => {
          standaloneQuery.removeEventListener('change', handleChange);
          fullscreenQuery.removeEventListener('change', handleChange);
          minimalUiQuery.removeEventListener('change', handleChange);
        };
      } catch {
        // Fallback for older browsers
        standaloneQuery.addListener?.(handleChange);
        return () => {
          standaloneQuery.removeListener?.(handleChange);
        };
      }
    }
  }, []);

  return isAppMode;
}
