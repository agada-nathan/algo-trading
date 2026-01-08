import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateBacktestData } from '../services/mockService';
import { ArrowLeft, Download, Calendar, Settings, PlayCircle, ChevronDown, Filter, Radio, Wifi } from 'lucide-react';

interface BacktesterProps {
  onBack: () => void;
}

const ASSET_CLASSES = {
  Forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'GBP/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'],
  Crypto: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'DOGE/USD', 'BNB/USD'],
  Commodities: ['XAU/USD (Gold)', 'XAG/USD (Silver)', 'WTI Crude Oil', 'Brent Oil', 'Natural Gas', 'Copper'],
  Indices: ['SPX500', 'NAS100', 'US30', 'GER40', 'UK100', 'JPN225'],
  Stocks: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META']
};

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'];

// Helper to determine simulation parameters
const getAssetConfig = (asset: string) => {
    let base = 100;
    let decimals = 2;
    let volatility = 0.0002;

    if (asset.includes('JPY')) { base = 151.50; decimals = 3; }
    else if (asset.includes('XAU')) { base = 2160.00; decimals = 2; volatility = 0.0005; }
    else if (asset.includes('BTC')) { base = 67500.00; decimals = 2; volatility = 0.001; }
    else if (asset.includes('ETH')) { base = 3500.00; decimals = 2; volatility = 0.001; }
    else if (asset.includes('SPX')) { base = 5100.00; decimals = 2; }
    else if (asset === 'EUR/USD') { base = 1.0850; decimals = 5; volatility = 0.0001; }
    else if (asset === 'GBP/USD') { base = 1.2650; decimals = 5; volatility = 0.0001; }
    
    return { base, decimals, volatility };
};

export const Backtester: React.FC<BacktesterProps> = ({ onBack }) => {
  const [data, setData] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
  
  // Live Feed State
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Ref for cleanup
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial Load of Chart Data
    setData(generateBacktestData(30));
  }, []);

  // Live Feed Simulation Effect
  useEffect(() => {
    setIsConnected(false);
    setLivePrice(null);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const { base, decimals, volatility } = getAssetConfig(selectedAsset);
    
    // Simulate connection delay
    const connectionTimeout = setTimeout(() => {
        setIsConnected(true);
        setLivePrice(base);
        setPrevPrice(base);

        // Start ticking
        intervalRef.current = window.setInterval(() => {
            setLivePrice((prev) => {
                if (!prev) return base;
                setPrevPrice(prev);
                const change = (Math.random() - 0.5) * (base * volatility);
                return Number((prev + change).toFixed(decimals));
            });
        }, 800 + Math.random() * 1000); // Random tick rate between 800ms and 1800ms
    }, 600);

    return () => {
        clearTimeout(connectionTimeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedAsset]);

  const runSimulation = () => {
    setIsSimulating(true);
    // Fake loading simulation with random variations based on selection
    setTimeout(() => {
        setData(generateBacktestData(90));
        setIsSimulating(false);
    }, 800);
  };

  const stats = useMemo(() => {
    if (!data.length) return { return: 0, drawdown: 0, equity: 0 };
    const initial = data[0].equity;
    const final = data[data.length - 1].equity;
    const totalReturn = ((final - initial) / initial) * 100;
    const maxDrawdown = Math.min(...data.map(d => d.drawdown));
    return {
        return: totalReturn.toFixed(2),
        drawdown: maxDrawdown.toFixed(2),
        equity: final.toFixed(2)
    };
  }, [data]);

  const priceTrend = livePrice && prevPrice ? (livePrice > prevPrice ? 'up' : livePrice < prevPrice ? 'down' : 'neutral') : 'neutral';
  const priceColor = priceTrend === 'up' ? 'text-green-500' : priceTrend === 'down' ? 'text-red-500' : 'text-white';

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border bg-surface px-6 py-4 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">Backtest Simulation</h1>
                {isConnected && livePrice && (
                    <div className={`flex items-center gap-2 px-2 py-1 rounded bg-black/30 border border-white/5 animate-in fade-in`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${priceTrend === 'up' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                        <span className={`font-mono text-sm font-bold ${priceColor}`}>
                            {livePrice}
                        </span>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <span className={`flex items-center gap-1.5 transition-colors ${isConnected ? 'text-green-500' : 'text-yellow-500'}`}>
                    <Wifi size={12} className={isConnected ? '' : 'animate-pulse'} /> 
                    <span className="text-xs font-medium">{isConnected ? 'Dukascopy Feed Active' : 'Connecting to Dukascopy...'}</span>
                </span>
                <span className="text-gray-600">•</span>
                
                {/* Asset Selector */}
                <div className="relative group">
                    <select 
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                        className="appearance-none bg-transparent hover:text-white cursor-pointer pr-4 font-medium focus:outline-none"
                    >
                        {Object.entries(ASSET_CLASSES).map(([category, assets]) => (
                            <optgroup key={category} label={category}>
                                {assets.map(asset => (
                                    <option key={asset} value={asset}>{asset}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>

                <span className="text-gray-600">•</span>

                {/* Timeframe Selector */}
                <div className="relative group">
                    <select 
                        value={selectedTimeframe}
                        onChange={(e) => setSelectedTimeframe(e.target.value)}
                        className="appearance-none bg-transparent hover:text-white cursor-pointer pr-4 font-medium focus:outline-none"
                    >
                        {TIMEFRAMES.map(tf => (
                            <option key={tf} value={tf}>{tf} Interval</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button className="hidden md:flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-gray-300 hover:bg-white/5 text-sm font-medium transition-colors">
                <Calendar size={16} /> <span className="hidden lg:inline">Date Range</span>
            </button>
            <button className="hidden md:flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-gray-300 hover:bg-white/5 text-sm font-medium transition-colors">
                <Settings size={16} /> <span className="hidden lg:inline">Parameters</span>
            </button>
            <button 
                onClick={runSimulation}
                disabled={isSimulating}
                className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
                {isSimulating ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Running...
                    </span>
                ) : (
                    <><PlayCircle size={18} /> Run Test</>
                )}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface border border-border rounded-xl p-4">
                    <p className="text-sm text-gray-500">Net Profit</p>
                    <p className={`text-2xl font-bold ${Number(stats.return) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Number(stats.return) > 0 ? '+' : ''}{stats.return}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">${stats.equity} Equity</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-4">
                    <p className="text-sm text-gray-500">Max Drawdown</p>
                    <p className="text-2xl font-bold text-red-500">{stats.drawdown}%</p>
                    <p className="text-xs text-gray-400 mt-1">Peak to Valley</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-4">
                    <p className="text-sm text-gray-500">Profit Factor</p>
                    <p className="text-2xl font-bold text-white">1.85</p>
                    <p className="text-xs text-gray-400 mt-1">Gross Win / Gross Loss</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-4">
                    <p className="text-sm text-gray-500">Sharpe Ratio</p>
                    <p className="text-2xl font-bold text-white">1.42</p>
                    <p className="text-xs text-gray-400 mt-1">Risk Adjusted Return</p>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-surface border border-border rounded-xl p-6 h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Equity Curve</h3>
                        <p className="text-xs text-gray-500">{selectedAsset} • {selectedTimeframe} • 100 Trades</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"><Filter size={16} /></button>
                        <button className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"><Download size={16} /></button>
                    </div>
                </div>
                <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2b8cee" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#2b8cee" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#233648" vertical={false} />
                            <XAxis 
                                dataKey="timestamp" 
                                stroke="#586e85" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(str) => str.slice(5)} // Show MM-DD
                            />
                            <YAxis 
                                stroke="#586e85" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                domain={['auto', 'auto']}
                                tickFormatter={(val) => `$${val}`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#181b21', borderColor: '#233648', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#2b8cee' }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="equity" 
                                stroke="#2b8cee" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorEquity)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Logs / Trades */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-bold text-white">Trade Log</h3>
                    <button className="flex items-center gap-2 text-xs text-primary hover:text-white transition-colors">
                        <Download size={14} /> Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#0f1115] text-gray-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Symbol</th>
                                <th className="px-4 py-3 text-right">Price</th>
                                <th className="px-4 py-3 text-right">Size</th>
                                <th className="px-4 py-3 text-right">Profit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-gray-300">
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs">2023-11-20 14:30</td>
                                <td className="px-4 py-3"><span className="text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded text-xs font-bold border border-green-500/20">BUY</span></td>
                                <td className="px-4 py-3 text-gray-400">{selectedAsset}</td>
                                <td className="px-4 py-3 text-right font-mono">1.0920</td>
                                <td className="px-4 py-3 text-right font-mono">1.0</td>
                                <td className="px-4 py-3 text-right text-gray-500">-</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs">2023-11-20 12:15</td>
                                <td className="px-4 py-3"><span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded text-xs font-bold border border-red-500/20">SELL</span></td>
                                <td className="px-4 py-3 text-gray-400">{selectedAsset}</td>
                                <td className="px-4 py-3 text-right font-mono">1.0950</td>
                                <td className="px-4 py-3 text-right font-mono">1.0</td>
                                <td className="px-4 py-3 text-right text-green-500">+$300.00</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs">2023-11-20 09:00</td>
                                <td className="px-4 py-3"><span className="text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded text-xs font-bold border border-green-500/20">BUY</span></td>
                                <td className="px-4 py-3 text-gray-400">{selectedAsset}</td>
                                <td className="px-4 py-3 text-right font-mono">1.0920</td>
                                <td className="px-4 py-3 text-right font-mono">1.0</td>
                                <td className="px-4 py-3 text-right text-red-500">-$50.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
