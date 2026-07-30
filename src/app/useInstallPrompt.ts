import { useCallback, useEffect, useState } from "react";

// Not yet part of lib.dom.d.ts; supported by Chromium-based browsers.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// Captures the browser's install prompt so it can be triggered from our own
// UI instead of the browser's default mini-infobar. The event can only be
// used once, so it's cleared after prompting (accepted or not) and if the
// app gets installed some other way in the meantime.
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredEvent(event);
    };
    const handleAppInstalled = () => setDeferredEvent(null);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) {
      return;
    }
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  }, [deferredEvent]);

  return { canInstall: deferredEvent !== null, promptInstall };
}
