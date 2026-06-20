
import { IntegrationDashboard } from './components/IntegrationDashboard';
import { NudgeCard } from './components/NudgeCard';
import { DashboardView } from './components/DashboardView';
import { EcoStateProvider } from './context/EcoState';
import { Leaf } from 'lucide-react';

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Premium Minimalist Navigation */}
      <nav className="bg-white border-b border-slate-100 px-8 py-4 mb-10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">EcoStep.</h1>
          </div>
          
          <div className="flex items-center space-x-8">
            <nav className="hidden md:flex space-x-8 text-sm font-bold text-slate-400">
              <a href="#" className="text-slate-900 hover:text-emerald-700 transition-colors">Dashboard</a>
              <a href="#" className="hover:text-emerald-700 transition-colors">Integrations</a>
              <a href="#" className="hover:text-emerald-700 transition-colors">Community</a>
            </nav>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-700 border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors shadow-sm">
              JD
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <DashboardView />
        
        <div className="pt-2">
          <NudgeCard 
            actionId="act_demo_01" 
            headline="Delay running your heavy appliances" 
            impactMetric="Saves 2.4 kg CO₂e" 
            category="utility" 
          />
        </div>
        
        <div className="pt-4">
          <IntegrationDashboard />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <EcoStateProvider>
      <AppContent />
    </EcoStateProvider>
  );
}

export default App;
