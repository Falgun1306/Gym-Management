import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * usePWAInstall — Hook to manage Progressive Web App install prompts,
 * native Chrome `beforeinstallprompt` events, and direct 1-click app installation.
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(
    typeof window !== 'undefined' ? window.deferredPWAInstallPrompt || null : null
  );
  const [isInstallable, setIsInstallable] = useState(
    typeof window !== 'undefined' ? Boolean(window.deferredPWAInstallPrompt) : false
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState({
    isIOS: false,
    isAndroid: false,
    isDesktop: true,
    isChrome: false,
  });

  const promptRef = useRef(
    typeof window !== 'undefined' ? window.deferredPWAInstallPrompt || null : null
  );

  useEffect(() => {
    // 1. Detect standalone / installed state
    const isStandaloneMode =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) {
      setIsInstalled(true);
    }

    // 2. Detect platform & browser
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /Android/i.test(ua);
    const isDesktop = !isIOS && !isAndroid;
    const isChrome = /Chrome|Chromium|CriOS/i.test(ua) && !/Edg|OPR|Brave/i.test(ua);

    setPlatform({ isIOS, isAndroid, isDesktop, isChrome });

    // Check if early listener in index.html already captured the prompt
    if (window.deferredPWAInstallPrompt) {
      promptRef.current = window.deferredPWAInstallPrompt;
      setDeferredPrompt(window.deferredPWAInstallPrompt);
      setIsInstallable(true);
    }

    // 3. Listen for Chrome's native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPWAInstallPrompt = e;
      promptRef.current = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // 4. Listen for app installed event
    const handleAppInstalled = () => {
      window.deferredPWAInstallPrompt = null;
      promptRef.current = null;
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      toast.success('Vajra Fitness App installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Directly triggers the native Chrome install / download prompt.
   */
  const installApp = useCallback(async () => {
    // If already installed
    if (isStandalone || isInstalled) {
      toast.success('Vajra Fitness is already installed on this device!');
      return { outcome: 'already_installed', triggered: false };
    }

    const promptEvent = promptRef.current || deferredPrompt || window.deferredPWAInstallPrompt;

    if (promptEvent) {
      try {
        // Direct native browser install dialog
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          toast.success('App download and installation started!');
        }
        
        promptRef.current = null;
        window.deferredPWAInstallPrompt = null;
        setDeferredPrompt(null);
        return { outcome: choiceResult.outcome, triggered: true };
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }

    // Direct tip if the browser needs manual click on Chrome's omnibox icon
    toast('Click the Install icon (⬇️) in Chrome’s address bar or ⋮ → Install app', {
      icon: '💻',
      duration: 4000,
    });
    return { outcome: 'manual_icon', triggered: false };
  }, [deferredPrompt, isInstalled, isStandalone]);

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    platform,
    hasNativePrompt: Boolean(deferredPrompt || promptRef.current || (typeof window !== 'undefined' && window.deferredPWAInstallPrompt)),
    installApp,
  };
}
