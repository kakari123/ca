
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Violation } from '../types';

interface AnalyticsViewProps {
  violations: Violation[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ violations }) => {
  const chartData = useMemo(() => {
    // Group by hour
    const hours: Record<string, number> = {};
    violations.forEach(v => {
      const h = new Date(v.timestamp).getHours();
      const label = `${h}:00`;
      hours[label] = (hours[label] || 0) + 1;
    });
    
    return Object.entries(hours).map(([name, count]) => ({ name, count })).sort((a,b) => parseInt(a.name) - parseInt(b.name));
  }, [violations]);

  const speedData = useMemo(() => {
    return violations.slice(0, 10).map(v => ({
      name: v.plateNumber.split('-').pop(),
      speed: v.speed
    }));
  }, [violations]);

  return (
    <div className="p-8 h-full flex flex-col gap-8">
      <header>
        <h2 className="text-3xl font-bold text-white">System Analytics</h2>
        <p className="text-zinc-500 mt-1">Deep insights into traffic flow and violation frequency.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Violation Volume */}
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col gap-6 shadow-2xl">
           <h3 className="text-lg font-bold text-zinc-300">Violations by Hour</h3>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Speed Comparison */}
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col gap-6 shadow-2xl">
           <h3 className="text-lg font-bold text-zinc-300">Peak Recorded Speeds</h3>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speedData}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="speed" radius={[8, 8, 0, 0]}>
                    {speedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.speed > 40 ? '#f43f5e' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="System Uptime" value="99.9%" sub="Operational" />
        <MetricCard label="Average Latency" value="45ms" sub="Excellent" />
        <MetricCard label="Peak Hour" value="17:00" sub="Max volume" />
        <MetricCard label="Plate Recognition" value="94.2%" sub="Verified" />
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, sub }: { label: string, value: string, sub: string }) => (
  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-white">{value}</p>
    <p className="text-[10px] text-emerald-500 font-medium uppercase mt-1 tracking-wider">{sub}</p>
  </div>
);

export default AnalyticsView;
