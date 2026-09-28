import { NextResponse } from "next/server";
import { generateToken } from "@/lib/online/ids";
import { generateUniqueRoomCode, isOnlineModeEnabled, writeRoom } from "@/lib/online/redis";
import { createRoom, toView } from "@/lib/online/room";
import { clampRounds, normalizeName } from "@/lib/online/validate";

export async function POST(req: Request) {
  if (!isOnlineModeEnabled()) {
    return NextResponse.json({ error: "Online mode disabled" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const hostName = normalizeName(body?.hostName);
  const totalRounds = clampRounds(body?.totalRounds);
  if (!hostName || totalRounds === null) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const code = await generateUniqueRoomCode();
  const token = generateToken();
  const room = createRoom(code, hostName, token, totalRounds);
  await writeRoom(room);

  return NextResponse.json({ code, token, view: toView(room, token) });
}
