import { NextResponse } from "next/server";
import { runScan } from "@/lib/tradingRules";

export async function POST() {
  const botEnabled = process.env.BOT_ENABLED !== "false";
  const result = runScan(botEnabled);
  return NextResponse.json(result);
}