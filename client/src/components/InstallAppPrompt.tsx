import { useEffect, useMemo, useState } from "react";
import { X, Share2, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const DISMISSED_UNTIL_KEY = "shp_install_prompt_dismissed_until";
const INSTALLED_KEY = "shp_app_installed";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isMobileDevice() {
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod/i.test(ua);
}

function isIosDevice() {
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua);
}

function isAndroidDevice() {
  const ua = navigator.userAgent || "";
  return /Android/i.test(ua);
}

function isIosSafari() {
  const ua = navigator.userAgent || "";
  return isIosDevice() && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
}

function isStandaloneMode() {
  const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mediaStandalone || iosStandalone;
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosStepsOpen, setIosStepsOpen] = useState(false);

  const iosEligible = useMemo(() => isMobileDevice() && isIosSafari() && !isStandaloneMode(), []);

  function markInstalled() {
    localStorage.setItem(INSTALLED_KEY, "true");
    setVisible(false);
    setIosStepsOpen(false);
  }

  function dismissForSevenDays() {
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_TTL_MS));
    setVisible(false);
    setIosStepsOpen(false);
  }

  useEffect(() => {
    if (!isMobileDevice() || isStandaloneMode()) {
      setVisible(false);
      return;
    }

    if (localStorage.getItem(INSTALLED_KEY) === "true") {
      setVisible(false);
      return;
    }

    const dismissedUntil = Number(localStorage.getItem(DISMISSED_UNTIL_KEY) || 0);
    if (Number.isFinite(dismissedUntil) && dismissedUntil > Date.now()) {
      setVisible(false);
      return;
    }

    if (iosEligible) {
      setVisible(true);
    }
  }, [iosEligible]);

  useEffect(() => {
    if (!isAndroidDevice()) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      if (!isMobileDevice() || isStandaloneMode()) return;
      if (localStorage.getItem(INSTALLED_KEY) === "true") return;

      const dismissedUntil = Number(localStorage.getItem(DISMISSED_UNTIL_KEY) || 0);
      if (Number.isFinite(dismissedUntil) && dismissedUntil > Date.now()) return;

      setVisible(true);
    };

    const onAppInstalled = () => {
      markInstalled();
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIosStepsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!visible) return null;

  const showAndroidInstall = isAndroidDevice() && !!deferredPrompt && !isStandaloneMode();
  const showIosInstall = iosEligible;

  if (!showAndroidInstall && !showIosInstall) return null;

  async function handleAndroidInstall() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      markInstalled();
    }

    setDeferredPrompt(null);
    setVisible(false);
  }

  return (
    <>
      <div className="fixed top-16 left-3 right-3 z-40">
        <Card className="p-3 shadow-md border bg-background/95 backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Install Sacred Heart Pharmacy</p>
              <p className="text-xs text-muted-foreground">Faster checkout, easy reorders.</p>
            </div>
            <button
              aria-label="Close install prompt"
              onClick={dismissForSevenDays}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            {showAndroidInstall && (
              <Button size="sm" onClick={handleAndroidInstall}>
                Install
              </Button>
            )}

            {showIosInstall && (
              <Button size="sm" onClick={() => setIosStepsOpen(true)}>
                Show steps
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={dismissForSevenDays}>
              Not now
            </Button>
          </div>
        </Card>
      </div>

      {showIosInstall && iosStepsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-center" role="dialog" aria-modal="true">
          <div className="w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Install Sacred Heart Pharmacy</h3>
              <button
                aria-label="Close install steps"
                onClick={() => setIosStepsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-2 text-sm">
              <li className="flex gap-2 items-start">
                <Share2 className="w-4 h-4 mt-0.5 text-[#0A7A3D]" />
                <span>Tap the <strong>Share</strong> icon in Safari.</span>
              </li>
              <li className="flex gap-2 items-start">
                <PlusSquare className="w-4 h-4 mt-0.5 text-[#0A7A3D]" />
                <span>Tap <strong>Add to Home Screen</strong>.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="w-4 h-4 mt-0.5 text-[#0A7A3D]">➜</span>
                <span>Confirm by tapping <strong>Add</strong>.</span>
              </li>
            </ol>

            <p className="mt-3 text-xs text-muted-foreground">
              Tip: The Share icon is usually at the bottom of Safari on iPhone.
            </p>

            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIosStepsOpen(false)}>
                Close
              </Button>
              <Button size="sm" onClick={dismissForSevenDays}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
