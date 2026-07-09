"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeatureGate } from "@/components/FeatureGate";
import { useShopCollection } from "@/hooks/useShopCollection";
import { getOfflineQueue, getPendingSyncCount, isOnline } from "@/lib/offline-sync";
import { SyncQueueItem, SyncLog, ConflictLog } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

export default function SyncStatusPage() {
  const { data: syncLogs } = useShopCollection<SyncLog>("syncLogs");
  const { data: conflicts } = useShopCollection<ConflictLog>("conflictLogs");
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [pending, setPending] = useState(0);

  const refresh = () => {
    setOnline(isOnline());
    setQueue(getOfflineQueue());
    setPending(getPendingSyncCount());
  };

  useEffect(() => {
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
  }, []);

  const retrySync = () => {
    if (!online) {
      toast.error("Connect to internet first");
      return;
    }
    toast.info("Sync will process when Firestore reconnects. Retry queued items from settings.");
    refresh();
  };

  return (
    <DashboardLayout title="Sync Status">
      <FeatureGate feature="offlineSync">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {online ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-amber-600" />}
              <span className="text-sm font-medium">{online ? "Online" : "Offline"}</span>
              {pending > 0 && <Badge status="pending" label={`${pending} pending`} />}
            </div>
            <Button variant="outline" size="sm" onClick={retrySync}><RefreshCw className="h-4 w-4" /> Retry Sync</Button>
          </div>

          <Card title="Offline Queue">
            {queue.length === 0 ? (
              <p className="text-sm text-slate-500">No pending offline changes</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Collection</th>
                    <th className="text-left py-2">Operation</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Retries</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((q) => (
                    <tr key={q.id} className="border-b border-slate-50 dark:border-slate-700">
                      <td className="py-2">{q.collection}</td>
                      <td className="py-2">{q.operation}</td>
                      <td className="py-2"><Badge status={q.status} /></td>
                      <td className="py-2">{q.retryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Sync History">
            {syncLogs.length === 0 ? (
              <p className="text-sm text-slate-500">No sync logs yet</p>
            ) : (
              <div className="space-y-2">
                {syncLogs.slice(0, 20).map((log) => (
                  <div key={log.id} className="text-xs p-2 border rounded dark:border-slate-700">
                    <p className="font-medium">{log.action} — {log.itemCount} items</p>
                    <p className="text-slate-500">{log.details}</p>
                    <p className="text-slate-400">{formatDateTime(log.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {conflicts.length > 0 && (
            <Card title="Conflicts">
              {conflicts.map((c) => (
                <div key={c.id} className="text-xs p-2 border rounded mb-2 dark:border-slate-700">
                  <p className="font-medium">{c.collection}/{c.documentId}</p>
                  <Badge status={c.resolution} />
                </div>
              ))}
            </Card>
          )}
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
