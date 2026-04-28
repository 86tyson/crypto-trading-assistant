"use client";
import { useState } from "react";

interface MarketAnalysis {
  currentPrice: number;
  sma50: number;
  pullbackPct: number;
  supportLevel: number;
  volatilityPct: number;
  confidenceScore: number;
  marketQuality: string;
  filterReason?: string;
  isAbove50SMA: boolean;
  hasEnoughPullback: boolean;
  isNearSupport: boolean;
  hasGoodVolume: boolean;
  hasGoodVolatility: boolean;
  isTrending: boolean;
}

interface Recommendation {
  asset: string;
  action: string;
  amount: number;
  entryPrice: number;
  stopLoss: number;
  profitTarget: number;
  riskReward: number;
  entryReason: string;
  riskExplanation: string;
  invalidation: string;
  confidenceScore: number;
  confidenceLabel: string;
  marketQuality: string;
}

interface ScanResult {
  timestamp: number;
  btcAnalysis: MarketAnalysis;
  ethAnalysis: MarketAnalysis;
  recommendation: Recommendation | null;
  filterMessage?: string;
}

interface TradeEntry {
  id: string;
  timestamp: number;
  asset: string;
  action: string;
  amount: number;
  price: number;
  status: string;
  confidenceScore?: number;
  confidenceLabel?: string;
}

interface Stats {
  totalTrades: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;
  avgWinPct: number;
  avgLossPct: number;
  netPnL: number;
}

const S = {
  page: { padding: "16px", maxWidth: "960px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "12px" },
  title: { fontSize: "20px", fontWeight: "bold", color: "#fff", margin: 0 },
  badge: { background: "#1a1a1a", border: "1px solid #ff6b35", color: "#ff6b35", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" },
  card: { background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "14px" },
  cardTitle: { fontSize: "11px", color: "#888", textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "8px" },
  price: { fontSize: "24px", fontWeight: "bold", color: "#00d4aa" },
  label: { fontSize: "11px", color: "#666", marginTop: "2px" },
  btn: { padding: "10px 20px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  scanBtn: { background: "#00d4aa", color: "#000" },
  approveBtn: { background: "#00c853", color: "#000", marginRight: "8px" },
  declineBtn: { background: "#333", color: "#fff", border: "1px solid #555" },
  tag: (color: string) => ({ background: color + "22", border: `1px solid ${color}`, color, padding: "2px 8px", borderRadius: "3px", fontSize: "11px", fontWeight: "bold" }),
  check: (ok: boolean) => ({ color: ok ? "#00c853" : "#666", marginRight: "4px" }),
  row: { display: "flex", alignItems: "center", marginBottom: "4px", fontSize: "12px" },
  tradeRow: { borderBottom: "1px solid #1a1a1a", padding: "8px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px", fontSize: "12px" },
};

export default function Dashboard() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [tradeLog, setTradeLog] = useState<TradeEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [botEnabled] = useState(true);

  async function runScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();
      setScanResult(data);
    } finally {
      setScanning(false);
    }
  }

  async function handleTrade(action: "approve" | "decline") {
    if (!scanResult?.recommendation) return;
    const res = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, recommendation: scanResult.recommendation })
    });
    const data = await res.json();
    setTradeLog(data.log || []);
    setStats(data.stats || null);
    setLastAction(action === "approve" ? "✅ Trade approved and logged" : "❌ Trade declined");
    setScanResult(prev => prev ? { ...prev, recommendation: null } : null);
  }

  const confColor = (label: string) => label === "HIGH" ? "#00c853" : label === "MEDIUM" ? "#ffaa00" : "#ff4444";
  const qualColor = (q: string) => q === "HIGH" ? "#00c853" : q === "MEDIUM" ? "#ffaa00" : q === "FILTERED" ? "#ff4444" : "#666";

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>🤖 Crypto Trading Assistant</h1>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={S.badge}>⚠ PAPER MODE</span>
          <span style={{ ...S.badge, borderColor: botEnabled ? "#00c853" : "#ff4444", color: botEnabled ? "#00c853" : "#ff4444" }}>
            BOT: {botEnabled ? "ON" : "OFF"}
          </span>
        </div>
      </div>

      <div style={S.grid}>
        <div style={S.card}>
          <div style={S.cardTitle}>Mock Account</div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fff" }}>$1,000.00</div>
          <div style={S.label}>Buying Power (Paper)</div>
          <div style={{ marginTop: "8px", color: "#888", fontSize: "12px" }}>BTC Holdings: 0 | ETH Holdings: 0</div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>System Status</div>
          <div style={{ color: "#00c853", fontWeight: "bold" }}>● ONLINE</div>
          <div style={S.label}>Paper mode only — zero real trades</div>
          <div style={{ marginTop: "4px", color: "#666", fontSize: "11px" }}>
            {scanResult ? `Last scan: ${new Date(scanResult.timestamp).toLocaleTimeString()}` : "No scan yet"}
          </div>
        </div>
      </div>

      {scanResult && (
        <div style={S.grid}>
          {[
            { label: "BTC Price", analysis: scanResult.btcAnalysis },
            { label: "ETH Price", analysis: scanResult.ethAnalysis }
          ].map(({ label, analysis }) => (
            <div key={label} style={S.card}>
              <div style={S.cardTitle}>{label}</div>
              <div style={S.price}>${Math.round(analysis.currentPrice).toLocaleString()}</div>
              <div style={S.label}>50 SMA: ${Math.round(analysis.sma50).toLocaleString()} | Pullback: {analysis.pullbackPct.toFixed(1)}%</div>
              <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                <span style={S.tag(qualColor(analysis.marketQuality))}>{analysis.marketQuality}</span>
                {analysis.filterReason && <span style={{ color: "#ff6b35", fontSize: "11px" }}>⚠ {analysis.filterReason}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...S.card, marginBottom: "12px", textAlign: "center" as const }}>
        <button
          onClick={runScan}
          disabled={scanning}
          style={{ ...S.btn, ...S.scanBtn, opacity: scanning ? 0.7 : 1, fontSize: "16px", padding: "12px 32px" }}
        >
          {scanning ? "⟳ Scanning..." : "▶ Run Scan"}
        </button>
        {scanResult?.filterMessage && (
          <div style={{ marginTop: "12px", color: "#888", fontSize: "13px" }}>
            {scanResult.filterMessage}
          </div>
        )}
      </div>

      {scanResult?.recommendation && (
        <div style={{ ...S.card, marginBottom: "12px", border: "1px solid #00d4aa" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold", color: "#00d4aa" }}>
              🎯 {scanResult.recommendation.asset} {scanResult.recommendation.action} Setup Detected
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={S.tag(confColor(scanResult.recommendation.confidenceLabel))}>
                {scanResult.recommendation.confidenceLabel} ({scanResult.recommendation.confidenceScore}/100)
              </span>
            </div>
          </div>

          <div style={{ ...S.grid, marginBottom: "12px" }}>
            <div>
              <div style={S.label}>Suggested Action</div>
              <div style={{ color: "#00c853", fontWeight: "bold" }}>Buy ${scanResult.recommendation.amount} of {scanResult.recommendation.asset}</div>
            </div>
            <div>
              <div style={S.label}>Entry Price</div>
              <div style={{ color: "#fff" }}>${Math.round(scanResult.recommendation.entryPrice).toLocaleString()}</div>
            </div>
            <div>
              <div style={S.label}>Stop Loss</div>
              <div style={{ color: "#ff4444" }}>${Math.round(scanResult.recommendation.stopLoss).toLocaleString()}</div>
            </div>
            <div>
              <div style={S.label}>Profit Target</div>
              <div style={{ color: "#00c853" }}>${Math.round(scanResult.recommendation.profitTarget).toLocaleString()}</div>
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <div style={S.cardTitle}>Entry Reason</div>
            <div style={{ fontSize: "13px", color: "#ccc", lineHeight: "1.5" }}>{scanResult.recommendation.entryReason}</div>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <div style={S.cardTitle}>Risk/Reward: {scanResult.recommendation.riskReward}:1</div>
            <div style={{ fontSize: "13px", color: "#ccc", lineHeight: "1.5" }}>{scanResult.recommendation.riskExplanation}</div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <div style={S.cardTitle}>Invalidation</div>
            <div style={{ fontSize: "13px", color: "#ff6b35", lineHeight: "1.5" }}>{scanResult.recommendation.invalidation}</div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => handleTrade("approve")} style={{ ...S.btn, ...S.approveBtn }}>✅ Approve Trade</button>
            <button onClick={() => handleTrade("decline")} style={{ ...S.btn, ...S.declineBtn }}>❌ Decline</button>
          </div>
        </div>
      )}

      {lastAction && (
        <div style={{ ...S.card, marginBottom: "12px", color: lastAction.includes("approved") ? "#00c853" : "#ff4444" }}>
          {lastAction}
        </div>
      )}

      {stats && stats.totalTrades > 0 && (
        <div style={{ ...S.card, marginBottom: "12px" }}>
          <div style={S.cardTitle}>Performance</div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" as const }}>
            {[
              ["Trades", stats.totalTrades],
              ["Wins", stats.wins],
              ["Losses", stats.losses],
              ["Win Rate", stats.winRate.toFixed(0) + "%"],
              ["Net P/L", "$" + stats.netPnL.toFixed(2)]
            ].map(([k, v]) => (
              <div key={String(k)}>
                <div style={S.label}>{k}</div>
                <div style={{ fontWeight: "bold", color: String(k) === "Net P/L" ? (stats.netPnL >= 0 ? "#00c853" : "#ff4444") : "#fff" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tradeLog.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>Trade Log</div>
          <div style={{ ...S.tradeRow, color: "#555" }}>
            <span>Time</span><span>Asset</span><span>Action</span><span>Amount</span><span>Status</span>
          </div>
          {tradeLog.slice(0, 20).map(entry => (
            <div key={entry.id} style={S.tradeRow}>
              <span style={{ color: "#666" }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
              <span style={{ color: "#fff" }}>{entry.asset}</span>
              <span style={{ color: entry.action === "BUY" ? "#00c853" : "#ff4444" }}>{entry.action}</span>
              <span style={{ color: "#ccc" }}>${entry.amount}</span>
              <span style={{ color: entry.status === "APPROVED" ? "#00c853" : "#888" }}>{entry.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}