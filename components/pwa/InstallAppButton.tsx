"use client";

import { useEffect, useState } from "react";
import {
  Download,
  CheckCircle2,
  Monitor,
  X,
  Smartphone,
  Laptop,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallAppButton({ className = "" }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if app is already running in standalone (installed) mode
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success("Devanu-Lenvanu installed as desktop application!");
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          toast.success("Installing application...");
          setDeferredPrompt(null);
        } else {
          toast.info("Installation cancelled.");
        }
      } catch (err) {
        console.error("Install prompt error:", err);
        setIsModalOpen(true);
      }
    } else {
      // If browser doesn't support direct prompt or beforeinstallprompt hasn't fired yet
      setIsModalOpen(true);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Sidebar Install Card / Button */}
      <div className={`px-3 py-2 ${className}`}>
        {isInstalled ? (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-emerald-700 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="leading-tight">
              <p className="font-bold">Desktop App</p>
              <p className="text-[10px] text-emerald-600/80 font-normal">
                Installed & Active
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full group flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 hover:from-blue-100/80 hover:via-indigo-100/70 hover:to-blue-100/80 border border-blue-200/80 text-blue-900 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] text-left"
            title="Install as Desktop Application"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Download className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-slate-900 truncate">
                  Install Desktop App
                </p>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  Fast 1-click launch
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shrink-0 shadow-2xs">
              Install
            </span>
          </button>
        )}
      </div>

      {/* Interactive Guidance Modal for browsers that require address bar click */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Install Devanu-Lenvanu App
                </h3>
                <p className="text-xs text-slate-500">
                  Run as a standalone desktop application
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 mb-6">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <p className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                  <Monitor className="w-4 h-4 text-blue-600" />
                  On Google Chrome / Microsoft Edge (Desktop):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed pl-1">
                  <li>
                    Look at the <strong>right side of your browser URL address bar</strong> (top right).
                  </li>
                  <li>
                    Click the <strong>Install icon (💻 or 📥)</strong> in the URL bar.
                  </li>
                  <li>
                    Click <strong>Install</strong> to add the app directly to your Windows Desktop and Taskbar.
                  </li>
                </ol>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <p className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  On Mobile Browsers:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                  <li>
                    <strong>Android (Chrome):</strong> Tap the 3 dots <strong>⋮</strong> &rarr; <strong>Install app</strong> / <strong>Add to Home screen</strong>.
                  </li>
                  <li>
                    <strong>iPhone (Safari):</strong> Tap <strong>Share (📤)</strong> &rarr; <strong>Add to Home Screen</strong>.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
