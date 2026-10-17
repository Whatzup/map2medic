import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global prompt cache to persist across re-renders and multiple component listeners
let cachedPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    cachedPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener(cachedPrompt));
    console.log('Map2Medic: Native PWA installation prompt is ready and cached.');
  });

  window.addEventListener('appinstalled', () => {
    cachedPrompt = null;
    promptListeners.forEach((listener) => listener(null));
    console.log('Map2Medic: App successfully installed to device home screen.');
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(cachedPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already running as installed app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Platform detection
    const ua = window.navigator.userAgent.toLowerCase();
    setIsAndroid(/android/.test(ua));
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    // Listen for prompt updates
    const handlePromptChange = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
    };

    promptListeners.add(handlePromptChange);

    // If cachedPrompt was already captured, sync it
    if (cachedPrompt && !deferredPrompt) {
      setDeferredPrompt(cachedPrompt);
    }

    return () => {
      promptListeners.delete(handlePromptChange);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    const promptToUse = deferredPrompt || cachedPrompt;
    if (!promptToUse) return false;

    try {
      await promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        cachedPrompt = null;
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Install prompt error:', err);
      return false;
    }
  };

  const openInAndroidChrome = () => {
    const url = window.location.href;
    const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
    // Android Intent URI to force opening in real Google Chrome browser
    const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
  };

  return {
    isInstallable: !!(deferredPrompt || cachedPrompt),
    isInstalled,
    isAndroid,
    isIOS,
    install,
    openInAndroidChrome,
  };
}
