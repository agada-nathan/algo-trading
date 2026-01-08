export type Page = 'dashboard' | 'builder' | 'backtest' | 'live';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  lastEdited: string;
  status: 'active' | 'paused' | 'draft';
  performance?: {
    pnl: number;
    winRate: number;
    trades: number;
  };
}

// Node Builder Types
export type NodeType = 'trigger' | 'condition' | 'action' | 'indicator' | 'custom';

export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  inputs: string[];
  outputs: string[];
  config: Record<string, any>;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPort: string;
  toNodeId: string;
  toPort: string;
}

export interface BacktestResult {
  timestamp: string;
  equity: number;
  drawdown: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  volume: number;
}
