import { NextResponse } from "next/server";
import { generateToken } from "@/lib/online/ids";
import { isOnlineModeEnabled, readRoom, writeRoom } from "@/lib/online/redis";
import { joinRoom, toView } from "@/lib/online/room";
import { normalizeCode, normalizeName } from "@/lib/online/validate";

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  if (!isOnlineModeEnabled()) {
    return NextResponse.json({ error: "Online mode disabled" }, { status: 404 });
  }

  const code = normalizeCode(params.code);
  if (!code) {
    return NextResponse.json({ error: "Invalid room code" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const name = normalizeName(body?.name);
  if (!name) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const room = await readRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.phase !== "waiting-for-player2" || room.players[1] !== null) {
    return NextResponse.json({ error: "Room is full" }, { status: 409 });
  }

  const token = generateToken();
  const joined = joinRoom(room, name, token);
  await writeRoom(joined);

  return NextResponse.json({ token, view: toView(joined, token) });
}
