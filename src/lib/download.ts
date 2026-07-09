/**
 * Force-download a file to the user's Downloads folder.
 * Plain <a download> does not work for cross-origin URLs (e.g. Firebase Storage).
 */
export async function downloadFileFromUrl(
  fileUrl: string,
  fileName: string
): Promise<void> {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error("Could not fetch file");
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "document";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback: open via same-origin proxy
    const proxy = `/api/download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName || "document")}`;
    const link = document.createElement("a");
    link.href = proxy;
    link.download = fileName || "document";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
