import { Candle } from "./mockData";

export function calcSMA(candles: Candle[], period: number): number[] {
  const closes = candles.map(c => c.close);
  const sma: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { sma.push(0); continue; }
    const slice = closes.slice(i - period + 1, i + 1);
    sma.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return sma;
}

export interface MarketAnalysis {
  currentPrice: number;
  sma50: number;
  recentHigh: number;
  pullbackPct: number;
  supportLevel: number;
  resistanceLevel: number;
  avgVolume: number;
  currentVolume: number;
  volatilityPct: number;
  isTrending: boolean;
  isAbove50SMA: boolean;
  hasEnoughPullback: boolean;
  isNearSupport: boolean;
  hasGoodVolume: boolean;
  hasGoodVolatility: boolean;
  confidenceScore: number;
  marketQuality: "HIGH" | "MEDIUM" | "LOW" | "FILTERED";
  filterReason?: string;
}

export function analyzeMarket(candles: Candle[]): MarketAnalysis {
  const sma50arr = calcSMA(candles, 50);
  const last = candles[candles.length - 1];
  const currentPrice = last.close;
  const sma50 = sma50arr[sma50arr.length - 1];
  
  const recent20 = candles.slice(-20);
  const recentHigh = Math.max(...recent20.map(c => c.high));
  const recentLow = Math.min(...recent20.map(c => c.low));
  const pullbackPct = ((recentHigh - currentPrice) / recentHigh) * 100;
  
  const supportLevel = recentLow * 1.01;
  const resistanceLevel = recentHigh * 0.99;
  
  const volumes = candles.slice(-20).map(c => c.volume);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const currentVolume = last.volume;
  
  const highs = recent20.map(c => c.high);
  const lows = recent20.map(c => c.low);
  const volatilityPct = ((Math.max(...highs) - Math.min(...lows)) / currentPrice) * 100;
  
  const smaSlice = sma50arr.slice(-10).filter(v => v > 0);
  const isTrending = smaSlice.length >= 2 && 
    smaSlice[smaSlice.length - 1] > smaSlice[0] * 1.005;
  
  const isAbove50SMA = currentPrice > sma50;
  const hasEnoughPullback = pullbackPct >= 3;
  const isNearSupport = currentPrice <= supportLevel * 1.015;
  const hasGoodVolume = currentVolume >= 50000;
  const hasGoodVolatility = volatilityPct >= 10;
  
  let filterReason: string | undefined;
  if (!hasGoodVolatility) filterReason = "Low volatility";
  else if (!hasGoodVolume) filterReason = "Low volume";
  else if (!isTrending) filterReason = "Choppy/sideways market";
  
  let score = 0;
  if (isAbove50SMA) score += 25;
  if (hasEnoughPullback) score += 20;
  if (isNearSupport) score += 20;
  if (isTrending) score += 15;
  if (hasGoodVolume) score += 10;
  if (hasGoodVolatility) score += 10;
  
  let marketQuality: "HIGH" | "MEDIUM" | "LOW" | "FILTERED" = "LOW";
  if (filterReason) marketQuality = "FILTERED";
  else if (score >= 70) marketQuality = "HIGH";
  else if (score >= 50) marketQuality = "MEDIUM";
  
  return {
    currentPrice, sma50, recentHigh, pullbackPct,
    supportLevel, resistanceLevel, avgVolume, currentVolume,
    volatilityPct, isTrending, isAbove50SMA, hasEnoughPullback,
    isNearSupport, hasGoodVolume, hasGoodVolatility,
    confidenceScore: score,
    marketQuality,
    filterReason
  };
}