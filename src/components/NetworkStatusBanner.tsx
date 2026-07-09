"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { getPendingSyncCount } from "@/lib/offline-sync";

export function NetworkStatusBanner() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setOnline(navigator.onLine);
    setPending(getPendingSyncCount());

    const onOnline = () => { setOnline(true); setPending(getPendingSyncCount()); };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div className={`px-4 py-2 text-sm flex items-center gap-2 ${online ? "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200"}`}>
      <WifiOff className="h-4 w-4 shrink-0" />
      {!online
        ? "You are offline. Changes will sync when connection returns."
        : `${pending} item(s) pending sync.`}
    </div>
  );
}
