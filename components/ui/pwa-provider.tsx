"use client";
import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // iOS detection
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // Listen for install prompt (Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("pwa_banner_dismissed");
      if (!dismissed) setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show iOS banner if not dismissed
    if (ios) {
      const dismissed = localStorage.getItem("pwa_banner_dismissed");
      if (!dismissed) setShowBanner(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa_banner_dismissed", "1");
  };

  if (isStandalone) return <>{children}</>;

  return (
    <>
      {children}

      {/* Install Banner */}
      {showBanner && (
        <div className="fixed bottom-20 md:bottom-auto md:top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[60] animate-in slide-in-from-bottom md:slide-in-from-top">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-blue-500/10">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 p-2 rounded-xl flex-shrink-0">
                <span className="font-bold text-white text-sm">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Installér Anki Pro</p>
                {isIOS ? (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    Tryk <Share className="w-3 h-3 inline" /> og &quot;Føj til hjemmeskærm&quot;
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Få den fulde app-oplevelse</p>
                )}
              </div>
              <button onClick={dismiss} className="text-gray-500 hover:text-white transition p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Download App
              </button>
            )}
          </div>
        </div>
      )}

      {/* PC Header Install Button (small, in top-right if prompt available) */}
      {!showBanner && deferredPrompt && (
        <button
          onClick={handleInstall}
          className="hidden md:flex fixed top-4 right-4 z-[55] items-center gap-2 px-3 py-2 bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:border-blue-500/30 transition-all"
          title="Installér Anki Pro"
        >
          <Download className="w-3.5 h-3.5" />
          Installér
        </button>
      )}
    </>
  );
}
