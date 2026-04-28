export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface MockAccount {
  buyingPower: number;
  btcHoldings: number;
  ethHoldings: number;
  btcAvgCost: number;
  ethAvgCost: number;
}

export function generateCandles(basePrice: number, count: number = 100): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  
  for (let i = count; i >= 0; i--) {
    const volatility = basePrice * 0.02;
    const change = (Math.random() - 0.5) * volatility;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = 50000 + Math.random() * 200000;
    
    candles.push({
      open,
      high,
      low,
      close,
      volume,
      timestamp: now - i * 5 * 60 * 1000
    });
    price = close;
  }
  return candles;
}

export function getMockAccount(): MockAccount {
  return {
    buyingPower: 1000,
    btcHoldings: 0,
    ethHoldings: 0,
    btcAvgCost: 0,
    ethAvgCost: 0
  };
}

export const BTC_BASE_PRICE = 67500;
export const ETH_BASE_PRICE = 3450;