import { SyncQueueItem } from "@/types";

const QUEUE_KEY = "csc_offline_sync_queue";
const NETWORK_KEY = "csc_network_status";

export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

export function getOfflineQueue(): SyncQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: SyncQueueItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueOfflineItem(item: Omit<SyncQueueItem, "id" | "createdAt" | "updatedAt" | "status" | "retryCount">): void {
  const queue = getOfflineQueue();
  const now = new Date().toISOString();
  const entry: SyncQueueItem = {
    ...item,
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    status: "pending",
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  queue.push(entry);
  saveOfflineQueue(queue);
}

export function getPendingSyncCount(): number {
  return getOfflineQueue().filter((q) => q.status === "pending" || q.status === "failed").length;
}

export function checkImageQuality(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const warnings: string[] = [];
    if (file.size < 50_000) warnings.push("Image may be too small or low resolution");
    if (file.size > 8 * 1024 * 1024) warnings.push("Image is very large — consider compressing");

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < 600 || img.height < 400) {
        warnings.push("Document may be too small — move camera closer");
      }
      if (img.width / img.height > 3 || img.height / img.width > 3) {
        warnings.push("Document edges may be cut off");
      }
      resolve(warnings);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      warnings.push("Could not read image — file may be corrupted");
      resolve(warnings);
    };
    img.src = url;
  });
}

export async function compressImage(file: File, maxWidth = 1600): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}
