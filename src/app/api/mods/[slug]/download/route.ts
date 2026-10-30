import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// This route talks to the database — never evaluate it at build time.
export const dynamic = "force-dynamic";

// GET /api/mods/[slug]/download — returns the .dinglemod.json file and bumps the counter
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const row = await db.mod.findUnique({ where: { slug } });
    if (!row) return NextResponse.json({ error: "Mod not found" }, { status: 404 });

    await db.mod.update({
      where: { slug },
      data: { downloads: { increment: 1 } },
    });

    return new NextResponse(row.manifest, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${slug}.dinglemod.json"`,
      },
    });
  } catch (e) {
    console.error("download failed", e);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
