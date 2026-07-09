import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getClientStorage } from "./config";
import { validateFile } from "@/lib/utils";

export async function uploadFile(
  path: string,
  file: File
): Promise<{ url: string; fileName: string }> {
  const error = validateFile(file);
  if (error) throw new Error(error);

  const storage = getClientStorage();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, fileName: file.name };
}

export async function deleteFile(path: string): Promise<void> {
  const storage = getClientStorage();
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export function getStoragePath(
  shopId: string,
  type: "profile" | "documents" | "branding" | "invoices",
  fileName: string
): string {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `shops/${shopId}/${type}/${timestamp}_${safeName}`;
}
