import { NextRequest, NextResponse } from "next/server";
import { logTrade, getTradeLog, getPerformanceStats } from "@/lib/tradeLogger";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, recommendation } = body;
  
  if (action === "approve" && recommendation) {
    const entry = logTrade({
      timestamp: Date.now(),
      asset: recommendation.asset,
      action: recommendation.action,
      amount: recommendation.amount,
      price: recommendation.entryPrice,
      status: "APPROVED",
      confidenceScore: recommendation.confidenceScore,
      confidenceLabel: recommendation.confidenceLabel,
      outcome: "PENDING"
    });
    return NextResponse.json({ success: true, entry, log: getTradeLog(), stats: getPerformanceStats() });
  }
  
  if (action === "decline" && recommendation) {
    const entry = logTrade({
      timestamp: Date.now(),
      asset: recommendation.asset,
      action: "DECLINED",
      amount: recommendation.amount,
      price: recommendation.entryPrice,
      status: "DECLINED"
    });
    return NextResponse.json({ success: true, entry, log: getTradeLog(), stats: getPerformanceStats() });
  }
  
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ log: getTradeLog(), stats: getPerformanceStats() });
}