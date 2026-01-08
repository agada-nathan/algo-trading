import React, { useState } from 'react';
import { Page } from './types';
import { Dashboard } from './components/Dashboard';
import { StrategyBuilder } from './components/StrategyBuilder';
import { Backtester } from './components/Backtester';
import { LayoutDashboard, Network, BarChart2, Radio, UserCircle, Settings } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'builder':
        return <StrategyBuilder onBacktest={() => setActivePage('backtest')} />;
      case 'backtest':
        return <Backtester onBack={() => setActivePage('builder')} />;
      case 'live':
        return <div className="flex-1 flex items-center justify-center text-gray-500">Live Trading Module - Coming Soon</div>;
      default:
        return <Dashboard />;
    }
  };

  const NavItem = ({ page, icon: Icon, label }: { page: Page; icon: any; label: string }) => (
    <button
      onClick={() => setActivePage(page)}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
        activePage === page 
          ? 'bg-primary text-white shadow-md shadow-primary/20' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-background text-white selection:bg-primary selection:text-white">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-surface md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-blue-500/20">
            <Network className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold leading-none tracking-tight">AlgoFlow</h1>
            <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Pro Platform</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem page="builder" icon={Network} label="Strategy Builder" />
          <NavItem page="backtest" icon={BarChart2} label="Backtester" />
          <NavItem page="live" icon={Radio} label="Live Deployment" />
        </nav>

        {/* User Section */}
        <div className="border-t border-border p-4">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-white/5 transition-colors text-left">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border border-border">
                    <UserCircle size={20} className="text-gray-300" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-white">Alex Trader</p>
                    <p className="truncate text-xs text-gray-500">Pro Plan</p>
                </div>
                <Settings size={16} className="text-gray-500" />
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        {/* Mobile Header (Only visible on small screens) */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
            <div className="flex items-center gap-2">
                <Network className="text-primary" size={24} />
                <span className="font-bold">AlgoFlow</span>
            </div>
            <button className="text-gray-400"><Settings size={20}/></button>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}
