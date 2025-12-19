
import React, { useState, useEffect } from 'react';
import { AppTab, Violation } from './types';
import { Icons } from './constants';
import DashboardView from './components/DashboardView';
import LiveCalibrationView from './components/LiveCalibrationView';
import SourceCodeView from './components/SourceCodeView';
import AnalyticsView from './components/AnalyticsView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [violations, setViolations] = useState<Violation[]>([]);

  // Persistent mock data
  useEffect(() => {
    const saved = localStorage.getItem('sentinel_violations');
    if (saved) {
      setViolations(JSON.parse(saved));
    } else {
      const initial = [
        { id: '1', plateNumber: 'KA-05-MN-1234', speed: 45.5, speedLimit: 30, timestamp: new Date(Date.now() - 3600000).toISOString(), imagePath: 'https://picsum.photos/seed/car1/800/600' },
        { id: '2', plateNumber: 'MH-12-RT-9988', speed: 38.2, speedLimit: 30, timestamp: new Date(Date.now() - 7200000).toISOString(), imagePath: 'https://picsum.photos/seed/car2/800/600' },
      ];
      setViolations(initial);
      localStorage.setItem('sentinel_violations', JSON.stringify(initial));
    }
  }, []);

  const addViolation = (v: Omit<Violation, 'id' | 'timestamp'>) => {
    const newViolation: Violation = {
      ...v,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    const updated = [newViolation, ...violations];
    setViolations(updated);
    localStorage.setItem('sentinel_violations', JSON.stringify(updated));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 text-emerald-500 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Icons.Dashboard />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white">SentinelTraffic</h1>
          </div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">System Architecture v2.4</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem 
            active={activeTab === AppTab.DASHBOARD} 
            onClick={() => setActiveTab(AppTab.DASHBOARD)}
            label="Live Dashboard"
            icon={<Icons.Dashboard />}
          />
          <NavItem 
            active={activeTab === AppTab.LIVE_CALIBRATION} 
            onClick={() => setActiveTab(AppTab.LIVE_CALIBRATION)}
            label="Camera Calibration"
            icon={<Icons.Camera />}
          />
          <NavItem 
            active={activeTab === AppTab.ANALYTICS} 
            onClick={() => setActiveTab(AppTab.ANALYTICS)}
            label="Traffic Analytics"
            icon={<Icons.Alert />}
          />
          <div className="pt-4 pb-2">
             <p className="text-[10px] px-3 text-zinc-600 font-bold uppercase tracking-wider">Implementation</p>
          </div>
          <NavItem 
            active={activeTab === AppTab.SOURCE_CODE} 
            onClick={() => setActiveTab(AppTab.SOURCE_CODE)}
            label="Developer Tools"
            icon={<Icons.Code />}
          />
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">Engine Online</span>
            </div>
            <p className="text-[11px] text-zinc-500">Processing live stream @ 30fps</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-zinc-950 overflow-y-auto relative">
        {activeTab === AppTab.DASHBOARD && <DashboardView violations={violations} />}
        {activeTab === AppTab.LIVE_CALIBRATION && <LiveCalibrationView onViolation={addViolation} />}
        {activeTab === AppTab.ANALYTICS && <AnalyticsView violations={violations} />}
        {activeTab === AppTab.SOURCE_CODE && <SourceCodeView />}
      </main>
    </div>
  );
};

interface NavItemProps {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ active, label, icon, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
    }`}
  >
    <span className={active ? 'text-emerald-400' : 'text-zinc-500'}>{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default App;
