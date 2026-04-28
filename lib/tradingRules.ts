import { analyzeMarket, MarketAnalysis } from "./technicalAnalysis";
import { generateCandles, BTC_BASE_PRICE, ETH_BASE_PRICE } from "./mockData";

export interface TradeRecommendation {
  asset: string;
  action: "BUY" | "SELL";
  amount: number;
  entryPrice: number;
  stopLoss: number;
  profitTarget: number;
  riskReward: number;
  entryReason: string;
  riskExplanation: string;
  invalidation: string;
  confidenceScore: number;
  confidenceLabel: "HIGH" | "MEDIUM" | "LOW";
  marketQuality: string;
  analysis: MarketAnalysis;
}

export interface ScanResult {
  timestamp: number;
  btcAnalysis: MarketAnalysis;
  ethAnalysis: MarketAnalysis;
  recommendation: TradeRecommendation | null;
  filterMessage?: string;
}

export function runScan(botEnabled: boolean): ScanResult {
  const btcCandles = generateCandles(BTC_BASE_PRICE);
  const ethCandles = generateCandles(ETH_BASE_PRICE);
  const btcAnalysis = analyzeMarket(btcCandles);
  const ethAnalysis = analyzeMarket(ethCandles);
  
  const result: ScanResult = {
    timestamp: Date.now(),
    btcAnalysis,
    ethAnalysis,
    recommendation: null
  };
  
  if (!botEnabled) {
    result.filterMessage = "Bot disabled (BOT_ENABLED=false)";
    return result;
  }
  
  const rec = evaluateSetup("BTC", btcAnalysis) || evaluateSetup("ETH", ethAnalysis);
  
  if (rec) {
    result.recommendation = rec;
  } else {
    const reasons = [];
    if (btcAnalysis.filterReason) reasons.push(`BTC: ${btcAnalysis.filterReason}`);
    if (ethAnalysis.filterReason) reasons.push(`ETH: ${ethAnalysis.filterReason}`);
    if (btcAnalysis.marketQuality === "LOW") reasons.push("BTC: Low confidence setup");
    if (ethAnalysis.marketQuality === "LOW") reasons.push("ETH: Low confidence setup");
    result.filterMessage = reasons.length 
      ? `No trade – market conditions not favorable (${reasons.join("; ")})` 
      : "No trade recommended – no qualifying setup found";
  }
  
  return result;
}

function evaluateSetup(asset: string, analysis: MarketAnalysis): TradeRecommendation | null {
  if (analysis.marketQuality === "FILTERED" || analysis.marketQuality === "LOW") return null;
  
  const { currentPrice, sma50, pullbackPct, supportLevel, resistanceLevel,
    isAbove50SMA, hasEnoughPullback, isNearSupport, confidenceScore, marketQuality } = analysis;
  
  if (!isAbove50SMA || !hasEnoughPullback || !isNearSupport) return null;
  
  const stopLoss = currentPrice * 0.98;
  const profitTarget = currentPrice * 1.03;
  const risk = currentPrice - stopLoss;
  const reward = profitTarget - currentPrice;
  const riskReward = reward / risk;
  
  if (riskReward < 1.5) return null;
  
  const confidenceLabel = marketQuality as "HIGH" | "MEDIUM";
  
  return {
    asset,
    action: "BUY",
    amount: 25,
    entryPrice: currentPrice,
    stopLoss,
    profitTarget,
    riskReward: Math.round(riskReward * 10) / 10,
    entryReason: `${asset} is above the 50-period moving average ($${Math.round(sma50).toLocaleString()}) and has pulled back ${pullbackPct.toFixed(1)}% near support at $${Math.round(supportLevel).toLocaleString()}. Price action shows a healthy retracement in an uptrend.`,
    riskExplanation: `Stop loss is 2% below entry ($${Math.round(stopLoss).toLocaleString()}). Profit target is 3% above entry ($${Math.round(profitTarget).toLocaleString()}). Risk/reward ratio of ${riskReward.toFixed(1)}:1 meets minimum threshold.`,
    invalidation: `If ${asset} breaks below support at $${Math.round(supportLevel).toLocaleString()}, the setup is no longer valid. Exit immediately if price closes below stop loss.`,
    confidenceScore,
    confidenceLabel,
    marketQuality,
    analysis
  };
}