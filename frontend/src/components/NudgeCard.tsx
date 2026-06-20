import { useState } from 'react';
import { Zap, Clock, CheckCircle } from 'lucide-react';

interface NudgeCardProps {
  actionId?: string;
  headline: string;
  impactMetric: string;
  category?: 'transport' | 'utility' | 'diet';
}

export const NudgeCard: React.FC<NudgeCardProps> = ({ headline, impactMetric }) => {
  const [accepted, setAccepted] = useState(false);

  if (accepted) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 flex items-center justify-center shadow-sm transition-all duration-500">
        <CheckCircle className="w-8 h-8 text-emerald-500 mr-4" />
        <div>
          <h3 className="text-lg font-bold text-emerald-900">Action Accepted!</h3>
          <p className="text-sm text-emerald-700 font-medium">You're making a real impact today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 border-l-4 border-l-emerald-500 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.06)] p-8 flex flex-col md:flex-row items-center justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-start mb-6 md:mb-0 w-full md:w-auto">
        <div className="bg-emerald-50 p-4 rounded-2xl mr-6 border border-emerald-100 shadow-sm shrink-0">
          <Zap className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <div className="flex items-center mb-3">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Recommended Action
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight">{headline}</h3>
          <div className="flex items-center text-slate-500 mt-2">
            <Clock className="w-4 h-4 mr-1.5 opacity-70" />
            <p className="text-sm font-medium">Estimated Impact: <strong className="text-slate-800">{impactMetric}</strong></p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
        <button 
          onClick={() => setAccepted(true)}
          className="flex-1 md:flex-none px-8 py-3.5 bg-slate-900 text-white font-bold text-sm rounded-full shadow-md hover:bg-slate-800 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
        >
          Accept Challenge
        </button>
      </div>
    </div>
  );
};
