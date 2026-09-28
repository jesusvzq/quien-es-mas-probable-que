export const runtime = "edge";

import { NextResponse } from "next/server";
import { findPlayerIndex } from "@/lib/online/auth";
import { isOnlineModeEnabled, readRoom } from "@/lib/online/redis";
import { toView } from "@/lib/online/room";
import { normalizeCode } from "@/lib/online/validate";

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  if (!isOnlineModeEnabled()) {
    return NextResponse.json({ error: "Online mode disabled" }, { status: 404 });
  }

  const code = normalizeCode(params.code);
  const token = new URL(req.url).searchParams.get("token");
  if (!code || !token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const room = await readRoom(code);
  if (!room || findPlayerIndex(room, token) === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(toView(room, token));
}
