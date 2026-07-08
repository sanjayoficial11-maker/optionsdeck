import { NextResponse } from "next/server"
import { isDhanConfigured } from "@/lib/market/dhan-config"
import { getMarketSession } from "@/lib/market/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const configured = isDhanConfigured()
  const session = getMarketSession()
  return NextResponse.json({
    configured,
    mode: configured ? "live" : "demo",
    session, // "pre-open" | "open" | "closed"
    serverTime: new Date().toISOString(),
  })
}
