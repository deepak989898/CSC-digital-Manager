"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { FeatureGate } from "@/components/FeatureGate";
import { getOfflineQueue, getPendingSyncCount, isOnline } from "@/lib/offline-sync";
import { SyncQueueItem } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function OfflineSettingsPage() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);

  const refresh = () => {
    setOnline(isOnline());
    setPending(getPendingSyncCount());
    setQueue(getOfflineQueue());
  };

  useEffect(() => {
    refresh();
    const onOnline = () => refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOnline);
    };
  }, []);

  return (
    <DashboardLayout title="Offline & PWA">
      <FeatureGate feature="offlineSync">
        <SettingsNav />
        <div className="max-w-2xl mx-auto space-y-4">
          <Card title="Connection Status">
            <div className="flex items-center gap-3">
              {online ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-amber-600" />
              )}
              <span className="text-sm">{online ? "Online — changes sync automatically" : "Offline — data queued locally"}</span>
              <Badge status={online ? "active" : "pending"} label={online ? "Online" : "Offline"} />
            </div>
          </Card>
          <Card title="Pending Sync">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              {pending} item(s) waiting to sync. Sensitive documents should sync quickly when online.
            </p>
            <div className="flex gap-2">
              <Link href="/sync-status"><Button variant="outline">View Sync Status</Button></Link>
              <Button variant="outline" onClick={refresh}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            </div>
          </Card>
          <Card title="PWA Install">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Install CSC Digital Manager from the browser menu (Add to Home Screen / Install App) for offline dashboard access.
            </p>
          </Card>
          {queue.length > 0 && (
            <Card title="Local Queue">
              <div className="space-y-2">
                {queue.slice(0, 10).map((q) => (
                  <div key={q.id} className="flex justify-between text-xs p-2 border rounded dark:border-slate-700">
                    <span>{q.collection} — {q.operation}</span>
                    <Badge status={q.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
