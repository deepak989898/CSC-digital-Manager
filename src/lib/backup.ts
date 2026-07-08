import { getShopDocuments } from "@/lib/firebase/firestore";
import { createDocument } from "@/lib/firebase/firestore";
import { BACKUP_COLLECTIONS } from "@/lib/constants";
import { BackupRecord } from "@/types";

export async function createBackup(
  shopId: string,
  userId: string,
  type: "manual" | "auto" = "manual"
): Promise<{ backupId: string; data: Record<string, unknown[]>; recordCount: number }> {
  const backupData: Record<string, unknown[]> = {};
  let totalRecords = 0;

  for (const collection of BACKUP_COLLECTIONS) {
    try {
      const docs = await getShopDocuments(collection, shopId);
      backupData[collection] = docs;
      totalRecords += docs.length;
    } catch {
      backupData[collection] = [];
    }
  }

  const jsonStr = JSON.stringify(backupData, null, 2);
  const fileSize = new Blob([jsonStr]).size;

  const backupId = await createDocument("backup", {
    type,
    status: "completed",
    collections: BACKUP_COLLECTIONS,
    recordCount: totalRecords,
    fileSize,
    userId,
    shopId,
  } as Omit<BackupRecord, "id" | "createdAt" | "updatedAt">);

  return { backupId, data: backupData, recordCount: totalRecords };
}

export function downloadBackupJSON(data: Record<string, unknown[]>, shopId: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `csc_backup_${shopId}_${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
