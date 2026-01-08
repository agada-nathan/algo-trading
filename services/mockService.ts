import { BacktestResult, Strategy, MarketData } from '../types';

export const generateBacktestData = (days: number = 30): BacktestResult[] => {
  let equity = 10000;
  const data: BacktestResult[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));
    
    // Random daily simulation
    const change = (Math.random() - 0.45) * 200; // Slight upward bias
    equity += change;
    
    // Calculate simulated drawdown (simplified)
    const drawdown = Math.min(0, (Math.random() * -5));

    data.push({
      timestamp: date.toISOString().split('T')[0],
      equity: Number(equity.toFixed(2)),
      drawdown: Number(drawdown.toFixed(2))
    });
  }
  return data;
};

export const MOCK_STRATEGIES: Strategy[] = [
  {
    id: '1',
    name: 'EURUSD Mean Reversion',
    description: 'Scalping strategy using RSI and Bollinger Bands on 15m timeframe.',
    lastEdited: '2 hours ago',
    status: 'active',
    performance: { pnl: 12.5, winRate: 68, trades: 142 }
  },
  {
    id: '2',
    name: 'BTC Momentum Breakout',
    description: 'Trend following strategy on 4H candles with volume confirmation.',
    lastEdited: '1 day ago',
    status: 'paused',
    performance: { pnl: -2.1, winRate: 45, trades: 34 }
  },
  {
    id: '3',
    name: 'Gold VWAP Cross',
    description: 'Intraday strategy focusing on London/NY overlap.',
    lastEdited: '5 mins ago',
    status: 'draft'
  }
];

export const MOCK_MARKET_DATA: MarketData[] = [
  { symbol: 'EUR/USD', price: 1.0845, change: 0.12, volume: 1245000 },
  { symbol: 'GBP/USD', price: 1.2630, change: -0.05, volume: 980000 },
  { symbol: 'USD/JPY', price: 151.20, change: 0.45, volume: 1560000 },
  { symbol: 'XAU/USD', price: 2160.50, change: 1.2, volume: 450000 },
  { symbol: 'BTC/USD', price: 68500.00, change: 2.5, volume: 2100000 },
];
