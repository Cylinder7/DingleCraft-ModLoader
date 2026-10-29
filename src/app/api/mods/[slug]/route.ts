import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toDTOShared } from "@/lib/mod-dto";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const row = await db.mod.findUnique({ where: { slug } });
    if (!row) return NextResponse.json({ error: "Mod not found" }, { status: 404 });
    return NextResponse.json({ mod: toDTOShared(row, true) });
  } catch (e) {
    console.error("GET /api/mods/[slug] failed", e);
    return NextResponse.json({ error: "Failed to get mod" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const row = await db.mod.findUnique({ where: { slug } });
    if (!row) return NextResponse.json({ error: "Mod not found" }, { status: 404 });
    if (row.isOfficial) {
      return NextResponse.json({ error: "Official mods cannot be deleted" }, { status: 403 });
    }
    await db.mod.delete({ where: { slug } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/mods/[slug] failed", e);
    return NextResponse.json({ error: "Failed to delete mod" }, { status: 500 });
  }
}
