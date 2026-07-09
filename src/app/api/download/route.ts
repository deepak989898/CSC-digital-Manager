import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const name = request.nextUrl.searchParams.get("name") || "download";

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    if (
      !parsed.hostname.endsWith("firebasestorage.googleapis.com") &&
      !parsed.hostname.endsWith("googleusercontent.com")
    ) {
      return NextResponse.json({ error: "Invalid file source" }, { status: 400 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = await response.arrayBuffer();
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
