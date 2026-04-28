export interface TradeEntry {
  id: string;
  timestamp: number;
  asset: string;
  action: "BUY" | "SELL" | "DECLINED" | "FILTERED";
  amount: number;
  price: number;
  status: "APPROVED" | "DECLINED" | "FILTERED";
  confidenceScore?: number;
  confidenceLabel?: string;
  exitPrice?: number;
  pnl?: number;
  outcome?: "WIN" | "LOSS" | "PENDING";
}

export interface PerformanceStats {
  totalTrades: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;
  avgWinPct: number;
  avgLossPct: number;
  netPnL: number;
}

const tradeLog: TradeEntry[] = [];

export function logTrade(entry: Omit<TradeEntry, "id">): TradeEntry {
  const trade: TradeEntry = { ...entry, id: Date.now().toString() };
  tradeLog.push(trade);
  return trade;
}

export function getTradeLog(): TradeEntry[] {
  return [...tradeLog].reverse();
}

export function getPerformanceStats(): PerformanceStats {
  const approved = tradeLog.filter(t => t.status === "APPROVED");
  const wins = approved.filter(t => t.outcome === "WIN");
  const losses = approved.filter(t => t.outcome === "LOSS");
  const pending = approved.filter(t => t.outcome === "PENDING" || !t.outcome);
  
  const avgWinPct = wins.length > 0
    ? wins.reduce((sum, t) => sum + (t.pnl || 0) / t.amount * 100, 0) / wins.length : 0;
  const avgLossPct = losses.length > 0
    ? losses.reduce((sum, t) => sum + Math.abs(t.pnl || 0) / t.amount * 100, 0) / losses.length : 0;
  const netPnL = approved.reduce((sum, t) => sum + (t.pnl || 0), 0);
  
  return {
    totalTrades: approved.length,
    wins: wins.length,
    losses: losses.length,
    pending: pending.length,
    winRate: approved.length > 0 ? (wins.length / approved.length) * 100 : 0,
    avgWinPct,
    avgLossPct,
    netPnL
  };
}