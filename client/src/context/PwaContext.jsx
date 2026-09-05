import React, { createContext, useContext, useState, useEffect } from 'react';

const PwaContext = createContext();

export const checkIsStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://') ||
    localStorage.getItem('eduflow_app_downloaded') === 'true'
  );
};

export const PwaProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => checkIsStandalone());
  const [showModal, setShowModal] = useState(false);
  const [platformInfo, setPlatformInfo] = useState({ isIOS: false, isAndroid: false, isDesktop: true });

  useEffect(() => {
    // Detect device platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isDesktop = !isIOS && !isAndroid;
    setPlatformInfo({ isIOS, isAndroid, isDesktop });

    // Check standalone mode on resize/change
    const matchMedia = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        localStorage.setItem('eduflow_app_downloaded', 'true');
      }
    };
    if (matchMedia.addEventListener) {
      matchMedia.addEventListener('change', handleDisplayModeChange);
    }

    // Capture PWA install prompt in Chromium browsers
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Fired when the app is successfully installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem('eduflow_app_downloaded', 'true');
      setDeferredPrompt(null);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (matchMedia.removeEventListener) {
        matchMedia.removeEventListener('change', handleDisplayModeChange);
      }
    };
  }, []);

  const triggerDownload = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('eduflow_app_downloaded', 'true');
        setDeferredPrompt(null);
        setShowModal(false);
      }
    } else {
      // If browser doesn't support beforeinstallprompt (e.g. iOS Safari, Firefox, or already prompted), show helper modal
      setShowModal(true);
    }
  };

  const downloadDesktopShortcut = () => {
    const currentUrl = window.location.origin;
    const fileContent = `[InternetShortcut]\r\nURL=${currentUrl}/\r\nIconIndex=0\r\nIconFile=${currentUrl}/favicon.png\r\n`;
    const blob = new Blob([fileContent], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'EduFlow.url';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    // Mark as downloaded so shortcut button is removed once downloaded
    setIsInstalled(true);
    localStorage.setItem('eduflow_app_downloaded', 'true');
    setShowModal(false);
  };

  const markAsInstalled = () => {
    setIsInstalled(true);
    localStorage.setItem('eduflow_app_downloaded', 'true');
    setShowModal(false);
  };

  return (
    <PwaContext.Provider value={{
      isInstalled,
      canInstall: !isInstalled,
      deferredPrompt,
      showModal,
      setShowModal,
      platformInfo,
      triggerDownload,
      downloadDesktopShortcut,
      markAsInstalled
    }}>
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = () => useContext(PwaContext);
