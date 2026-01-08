import React from 'react';
import { Strategy } from '../types';
import { MOCK_STRATEGIES } from '../services/mockService';
import { TrendingUp, Activity, DollarSign, Cpu, ArrowUpRight, ArrowDownRight, MoreVertical, Play, Pause } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-gray-400 mt-1">Overview of your algorithmic trading performance.</p>
          </div>
          <div className="flex gap-3">
             <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                System Operational
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Equity" 
            value="$124,592.30" 
            change="+12.5%" 
            icon={<DollarSign className="text-primary" />} 
            positive={true} 
          />
          <StatCard 
            title="24h P&L" 
            value="+$1,240.50" 
            change="+2.4%" 
            icon={<TrendingUp className="text-green-500" />} 
            positive={true} 
          />
          <StatCard 
            title="Active Bots" 
            value="3" 
            change="2 Paused" 
            icon={<Cpu className="text-purple-500" />} 
            subtext="5 Total Slots"
          />
          <StatCard 
            title="Win Rate" 
            value="68.4%" 
            change="-1.2%" 
            icon={<Activity className="text-orange-500" />} 
            positive={false} 
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Active Strategies List */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Active Strategies</h2>
                    <button className="text-sm text-primary hover:text-primary/80 font-medium">View All</button>
                </div>
                
                <div className="grid gap-4">
                    {MOCK_STRATEGIES.map((strategy) => (
                        <div key={strategy.id} className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition-all hover:border-primary/50 hover:shadow-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${strategy.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-gray-800 text-gray-500'}`}>
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white">{strategy.name}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                strategy.status === 'active' ? 'bg-green-500/10 text-green-500' : 
                                                strategy.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500' : 
                                                'bg-gray-700 text-gray-400'
                                            }`}>
                                                {strategy.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">{strategy.description}</p>
                                    </div>
                                </div>
                                <button className="text-gray-500 hover:text-white">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            {strategy.performance && (
                                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Total ROI</p>
                                        <p className={`font-mono font-bold ${strategy.performance.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {strategy.performance.pnl > 0 ? '+' : ''}{strategy.performance.pnl}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Win Rate</p>
                                        <p className="font-mono font-bold text-white">{strategy.performance.winRate}%</p>
                                    </div>
                                    <div className="flex justify-end items-center">
                                        <button className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                            strategy.status === 'active' 
                                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                                            : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                        }`}>
                                            {strategy.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                                            {strategy.status === 'active' ? 'PAUSE' : 'RESUME'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions / Activity */}
            <div className="space-y-6">
                {/* Deployment Card */}
                <div className="rounded-xl bg-gradient-to-br from-primary to-blue-700 p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                    <h3 className="text-lg font-bold relative z-10">Deploy Strategy</h3>
                    <p className="text-blue-100 text-sm mt-2 relative z-10">
                        Ready to go live? Connect your broker and start trading with real capital.
                    </p>
                    <button className="mt-4 w-full rounded-lg bg-white py-2.5 text-sm font-bold text-primary hover:bg-blue-50 transition-colors shadow-sm relative z-10">
                        Connect Broker
                    </button>
                </div>

                {/* Recent Activity */}
                <div className="rounded-xl border border-border bg-surface p-5">
                    <h3 className="font-bold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0"></div>
                                <div>
                                    <p className="text-sm text-gray-300">Strategy <span className="text-white font-medium">Alpha Trend</span> executed BUY order for <span className="font-mono text-xs">0.5 BTC</span></p>
                                    <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, icon, positive, subtext }: any) => (
  <div className="rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-border/80 transition-colors">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-400">{title}</p>
      <div className="rounded-lg bg-background p-2">{icon}</div>
    </div>
    <div className="mt-2 flex items-baseline gap-2">
      <p className="text-2xl font-bold text-white">{value}</p>
      {change && (
        <span className={`flex items-center text-xs font-bold ${positive ? 'text-green-500' : positive === false ? 'text-red-500' : 'text-gray-500'}`}>
          {positive ? <ArrowUpRight size={12} /> : positive === false ? <ArrowDownRight size={12} /> : null}
          {change}
        </span>
      )}
      {subtext && <span className="text-xs text-gray-500">{subtext}</span>}
    </div>
  </div>
);
