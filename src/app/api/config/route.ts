import { NextResponse } from "next/server";
import { isOnlineModeEnabled } from "@/lib/online/redis";

export async function GET() {
  return NextResponse.json({ onlineEnabled: isOnlineModeEnabled() });
}
