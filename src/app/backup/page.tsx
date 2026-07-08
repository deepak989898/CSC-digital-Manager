"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { useAuth } from "@/contexts/AuthContext";
import { BackupRecord } from "@/types";
import { createBackup, downloadBackupJSON } from "@/lib/backup";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";
import { Database, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function BackupPage() {
  const { profile } = useAuth();
  const { data: backups, loading, refetch } = useShopCollection<BackupRecord>("backup");
  const [creating, setCreating] = useState(false);

  const handleBackup = async () => {
    if (!profile) return;
    setCreating(true);
    try {
      const { data, recordCount } = await createBackup(profile.shopId, profile.userId, "manual");
      downloadBackupJSON(data, profile.shopId);
      toast.success(`Backup created: ${recordCount} records`);
      await refetch();
    } catch { toast.error("Backup failed"); }
    finally { setCreating(false); }
  };

  return (
    <DashboardLayout title="Backup & Restore">
      <div className="space-y-6 max-w-3xl">
        <Card title="Manual Backup">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Export all your shop data as a JSON file. Includes customers, applications, payments, expenses, and more.</p>
          <Button onClick={handleBackup} loading={creating}><Database className="h-4 w-4" /> Create & Download Backup</Button>
        </Card>
        <Card title="Auto Backup">
          <p className="text-sm text-slate-600 dark:text-slate-400">Automatic daily backups can be configured via environment variables or Firebase Cloud Functions. Structure is ready for integration.</p>
          <Badge status="submitted" label="Ready for integration" className="mt-2" />
        </Card>
        <Card title="Restore">
          <p className="text-sm text-slate-600 dark:text-slate-400">Restore functionality is ready for integration. Upload a backup JSON file to restore shop data.</p>
          <Button variant="outline" className="mt-2" disabled><RefreshCw className="h-4 w-4" /> Restore (Coming Soon)</Button>
        </Card>
        <Card title="Backup History">
          {loading ? <p>Loading...</p> : backups.length === 0 ? <p className="text-sm text-slate-500">No backups yet</p> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Date</th><th className="text-left py-2">Type</th><th className="text-left py-2">Records</th><th className="text-left py-2">Size</th><th className="text-left py-2">Status</th></tr></thead>
              <tbody>{backups.map((b) => (
                <tr key={b.id} className="border-b"><td className="py-2">{formatDateTime(b.createdAt)}</td><td className="py-2 capitalize">{b.type}</td><td className="py-2">{b.recordCount}</td><td className="py-2">{b.fileSize ? `${(b.fileSize / 1024).toFixed(1)} KB` : "—"}</td><td className="py-2"><Badge status="completed" label={b.status} /></td></tr>
              ))}</tbody>
            </table>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
