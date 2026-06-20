import React, { useState } from 'react';
import { DollarSign, TreePine, TrendingUp } from 'lucide-react';

export const MicroOffsetSettings: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [limit, setLimit] = useState(20);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Eco-Roundup Offset</h3>
          <p className="text-sm text-slate-500 font-medium">Passively plant trees using your spare change.</p>
        </div>
        
        {/* Toggle Switch */}
        <button 
          onClick={() => setIsEnabled(!isEnabled)}
          className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${isEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
        >
          <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
        
        {/* Limit Settings */}
        <div className={`border rounded-2xl p-6 transition-opacity flex flex-col justify-center ${isEnabled ? 'border-slate-200 opacity-100' : 'border-slate-100 opacity-50 pointer-events-none'}`}>
          <div className="flex items-center mb-4">
            <DollarSign className="w-5 h-5 text-slate-400 mr-2" />
            <h4 className="font-bold text-slate-700">Monthly Limit</h4>
          </div>
          <div className="flex items-center">
            <span className="text-3xl font-black text-slate-900 mr-2">${limit}</span>
            <span className="text-sm text-slate-500 font-medium">/ month cap</span>
          </div>
          <input 
            type="range" 
            min="5" max="100" step="5"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="w-full mt-6 accent-emerald-500"
          />
        </div>

        {/* Stats Widget */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <TreePine className="w-5 h-5 text-emerald-300 mr-2" />
              <h4 className="font-bold text-emerald-50">Impact Generated</h4>
            </div>
            <div>
              <div className="text-5xl font-black tracking-tight mb-1">14</div>
              <p className="text-sm font-medium text-emerald-200">Verified Trees Planted</p>
            </div>
          </div>
          <div className="relative z-10 mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex items-center">
            <TrendingUp className="w-4 h-4 text-emerald-300 mr-2 shrink-0" />
            <p className="text-xs text-emerald-50 font-medium leading-snug">Offsetting ~300kg CO₂e annually through spare change</p>
          </div>
          <div className="absolute -bottom-8 -right-8 opacity-20">
            <TreePine className="w-48 h-48" />
          </div>
        </div>

      </div>
    </div>
  );
};
