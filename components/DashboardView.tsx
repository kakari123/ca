
import React, { useState } from 'react';
import { Violation } from '../types';

interface DashboardViewProps {
  violations: Violation[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ violations }) => {
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(violations[0] || null);

  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Live Monitoring</h2>
          <p className="text-zinc-500 mt-1">Real-time speed enforcement and record tracking</p>
        </div>
        <div className="flex gap-4">
          <StatCard label="Total Violations" value={violations.length.toString()} color="emerald" />
          <StatCard label="Avg. Speed Over" value="+12.4 km/h" color="rose" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Table Section */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h3 className="font-semibold text-zinc-300">Violations Registry</h3>
            <span className="text-xs text-zinc-500 font-mono">REFRESH: 2S</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-900 text-[11px] uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Plate Number</th>
                  <th className="px-6 py-4 text-center">Speed</th>
                  <th className="px-6 py-4 text-center">Limit</th>
                  <th className="px-6 py-4 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {violations.map((v) => (
                  <tr 
                    key={v.id} 
                    onClick={() => setSelectedViolation(v)}
                    className={`cursor-pointer transition-colors hover:bg-emerald-500/5 group ${selectedViolation?.id === v.id ? 'bg-emerald-500/10' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-xs text-zinc-300 font-mono">
                        {new Date(v.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-[10px] text-zinc-600">
                        {new Date(v.timestamp).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-zinc-800 border border-zinc-700 rounded font-mono text-emerald-400 text-sm font-bold tracking-wider">
                        {v.plateNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-rose-500 font-bold text-lg">{v.speed.toFixed(1)}</span>
                      <span className="text-[10px] text-zinc-600 ml-1">km/h</span>
                    </td>
                    <td className="px-6 py-4 text-center text-zinc-500 text-sm">
                      {v.speedLimit}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <SeverityBadge speed={v.speed} limit={v.speedLimit} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspector Panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl">
          <h3 className="font-semibold text-zinc-300">Violation Evidence</h3>
          
          {selectedViolation ? (
            <div className="space-y-6">
              <div className="aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 group relative">
                <img 
                  src={selectedViolation.imagePath} 
                  alt="Violation" 
                  className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur border border-zinc-800 px-3 py-1.5 rounded-lg">
                  <span className="text-[10px] text-emerald-500 font-bold">RAW CAPTURE</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">OCR Status</p>
                  <p className="text-emerald-400 font-mono font-bold tracking-widest">VERIFIED</p>
                </div>
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Accuracy</p>
                  <p className="text-zinc-300 font-mono font-bold">98.4%</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800">
                 <DetailItem label="Location" value="Main Terminal - Gateway A" />
                 <DetailItem label="Device ID" value="SENTINEL_X1_882" />
                 <DetailItem label="Lane Info" value="Lane 3 (Northbound)" />
                 <DetailItem label="Weather" value="Dry / Daylight" />
              </div>

              <button className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded-xl transition-colors mt-4">
                Export Incident Report
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 italic text-sm">
              Select a record to view evidence
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string, value: string, color: 'emerald' | 'rose' }) => (
  <div className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center">
    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{label}</span>
    <span className={`text-2xl font-black ${color === 'emerald' ? 'text-emerald-500' : 'text-rose-500'}`}>{value}</span>
  </div>
);

const SeverityBadge = ({ speed, limit }: { speed: number, limit: number }) => {
  const over = speed - limit;
  if (over > 20) return <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-500 text-[10px] font-bold border border-rose-500/30">CRITICAL</span>;
  if (over > 10) return <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-500 text-[10px] font-bold border border-orange-500/30">HIGH</span>;
  return <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 text-[10px] font-bold border border-amber-500/30">MODERATE</span>;
};

const DetailItem = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-zinc-500">{label}</span>
    <span className="text-zinc-300 font-medium">{value}</span>
  </div>
);

export default DashboardView;
