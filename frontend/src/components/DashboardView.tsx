import React from 'react';
import { useEcoState } from '../context/EcoState';
import { Smartphone, AlertCircle, ArrowDownRight, Activity } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { state } = useEcoState();
  const { weeklyLedger, userProfile, userChallenges } = state;

  const totalEmissions = weeklyLedger.reduce((sum, entry) => sum + entry.co2e_kg, 0);
  
  if (weeklyLedger.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-16 text-center max-w-4xl mx-auto" data-testid="empty-state">
        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Activity className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Awaiting Data</h2>
        <p className="text-base text-slate-500 max-w-md mx-auto">
          Connect your first smart utility or mobility tracker below to visualize your footprint.
        </p>
      </div>
    );
  }

  const smartphonesCharged = Math.round(totalEmissions * 121.6);
  
  const transportTotal = weeklyLedger.filter(e => e.category === 'TRANSPORT').reduce((acc, e) => acc + e.co2e_kg, 0);
  const utilityTotal = weeklyLedger.filter(e => e.category === 'UTILITIES').reduce((acc, e) => acc + e.co2e_kg, 0);
  const dietTotal = weeklyLedger.filter(e => e.category === 'DIET').reduce((acc, e) => acc + e.co2e_kg, 0);

  const getPercentage = (value: number) => (totalEmissions > 0 ? Math.round((value / totalEmissions) * 100) : 0);
  const tPct = getPercentage(transportTotal);
  const uPct = getPercentage(utilityTotal);
  const dPct = getPercentage(dietTotal);

  const limit = userProfile.weeklyAllowanceKg;
  const tWarn = transportTotal > limit * 0.5;
  const uWarn = utilityTotal > limit * 0.5;
  const dWarn = dietTotal > limit * 0.5;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Section A: Hero Metric Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Weekly EcoScore</h3>
              <p className="text-slate-500 font-medium text-sm">Trailing 7-Day Output</p>
            </div>
            <div className="flex items-center bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full shadow-sm">
              <ArrowDownRight className="w-4 h-4 text-emerald-600 mr-1" />
              <span className="text-emerald-700 font-bold text-sm">-12% vs last week</span>
            </div>
          </div>
          
          <div className="flex items-baseline mb-8">
            <span className="text-7xl font-black text-slate-900 tracking-tighter mr-3">{totalEmissions.toFixed(1)}</span>
            <span className="text-2xl font-bold text-slate-400">kg CO₂e</span>
          </div>
          
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 mr-4">
              <Smartphone className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-slate-600 font-medium text-base">
              Equivalent to charging <strong className="text-slate-900 font-bold">{smartphonesCharged.toLocaleString()}</strong> smartphones.
            </p>
          </div>
        </div>

        {/* Section B: Composition Matrix */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-10">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Emission Composition</h3>
          <div className="space-y-8">
            
            {/* Utilities */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="font-bold text-slate-800">Utilities</span>
                <span className="text-slate-900 font-bold">{utilityTotal.toFixed(1)} <span className="text-slate-400 font-medium text-sm">kg ({uPct}%)</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-700 ease-out ${uWarn ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${uPct}%` }} data-testid="utility-bar"></div>
              </div>
              {uWarn && (
                <div className="mt-3 flex items-center text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg w-fit" data-testid="utility-alert">
                  <AlertCircle className="w-4 h-4 mr-1.5" /> Exceeds 50% threshold
                </div>
              )}
            </div>

            {/* Transport */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="font-bold text-slate-800">Transport</span>
                <span className="text-slate-900 font-bold">{transportTotal.toFixed(1)} <span className="text-slate-400 font-medium text-sm">kg ({tPct}%)</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-700 ease-out ${tWarn ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{ width: `${tPct}%` }}></div>
              </div>
              {tWarn && (
                <div className="mt-3 flex items-center text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
                  <AlertCircle className="w-4 h-4 mr-1.5" /> Exceeds 50% threshold
                </div>
              )}
            </div>

            {/* Diet */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="font-bold text-slate-800">Diet</span>
                <span className="text-slate-900 font-bold">{dietTotal.toFixed(1)} <span className="text-slate-400 font-medium text-sm">kg ({dPct}%)</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                <div className={`h-3 rounded-full transition-all duration-700 ease-out ${dWarn ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${dPct}%` }}></div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Section C: League Standings */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-8 self-start sticky top-28">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Local League</h3>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-6">{userProfile.location}</p>
        
        <div className="space-y-1">
          {userChallenges.map((user, index) => {
            const isMe = user.initials === userProfile.initials;
            return (
              <div key={user.id} className={`flex items-center p-3 rounded-2xl transition-colors ${isMe ? 'bg-slate-50 border border-slate-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}>
                <div className="font-bold text-slate-400 w-6 text-center mr-2">{index + 1}</div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mr-4 shadow-sm ${isMe ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {user.initials}
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-sm ${isMe ? 'text-slate-900' : 'text-slate-700'}`}>{user.name}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{user.tier}</p>
                </div>
                <div className="text-right">
                  <div className={`font-black text-sm ${isMe ? 'text-emerald-700' : 'text-slate-900'}`}>{user.ecoPoints.toLocaleString()}</div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Pts</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};
