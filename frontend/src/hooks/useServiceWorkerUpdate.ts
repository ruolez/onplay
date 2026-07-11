import { useCallback, useEffect, useState } from "react";

// Detects a waiting service worker (new app version) and exposes an
// opt-in update: posting SKIP_WAITING activates it, controllerchange
// then reloads the page onto the fresh assets
export function useServiceWorkerUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;
      if (registration.waiting) setWaitingWorker(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(newWorker);
          }
        });
      });
    });

    return () =>
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
  }, []);

  const applyUpdate = useCallback(() => {
    waitingWorker?.postMessage("SKIP_WAITING");
  }, [waitingWorker]);

  return { updateAvailable: !!waitingWorker, applyUpdate };
}
