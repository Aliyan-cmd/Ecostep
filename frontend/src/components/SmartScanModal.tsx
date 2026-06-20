import { useState } from 'react';
import { Camera, UploadCloud, Loader2, CheckCircle, X } from 'lucide-react';
import { useEcoState } from '../context/EcoState';
import type { LedgerEntry } from '../context/EcoState';
import { v4 as uuidv4 } from 'uuid';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartScanModal: React.FC<ScanModalProps> = ({ isOpen, onClose }) => {
  const { dispatch } = useEcoState();
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);

  if (!isOpen) return null;

  const handleMockUpload = () => {
    setIsScanning(true);
    // Simulate AI Vision network latency
    setTimeout(() => {
      setIsScanning(false);
      setResults({
        items: [
          { raw_text: "Tyson Chicken Breasts $12.99", category: "DIET", sub_category: "medium_meat", co2e_kg: 2.5 },
          { raw_text: "Organic Apples $4.50", category: "DIET", sub_category: "vegan", co2e_kg: 0.5 },
          { raw_text: "Whole Milk Gallon $3.20", category: "DIET", sub_category: "medium_meat", co2e_kg: 1.9 }
        ],
        total_co2e_kg: 4.9
      });
    }, 2500);
  };

  const commitToLedger = () => {
    if (results) {
      results.items.forEach((item: any) => {
        const entry: LedgerEntry = {
          id: uuidv4(),
          category: item.category,
          sub_category: item.sub_category,
          co2e_kg: item.co2e_kg,
          timestamp: new Date().toISOString()
        };
        dispatch({ type: 'ADD_ENTRY', payload: entry });
      });
      onClose();
      // reset states for next time
      setResults(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Camera className="w-5 h-5 mr-2 text-emerald-600" /> AI Receipt Scanner
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          {!isScanning && !results && (
            <div 
              onClick={handleMockUpload}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Drag & Drop Receipt</h3>
              <p className="text-sm text-slate-500 text-center font-medium">or click to browse from your device</p>
            </div>
          )}

          {isScanning && (
            <div className="py-16 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-6" />
              <h3 className="text-lg font-bold text-slate-900">Running AI Vision Model...</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">Extracting line items and mapping carbon footprint.</p>
              
              {/* Scanning beam animation */}
              <div className="w-full max-w-xs h-1.5 bg-slate-100 rounded-full mt-8 overflow-hidden relative">
                <div className="absolute top-0 bottom-0 w-1/3 bg-emerald-500 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
              </div>
            </div>
          )}

          {results && (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center shadow-sm">
                <CheckCircle className="w-6 h-6 text-emerald-600 mr-3 shrink-0" />
                <div>
                  <p className="text-emerald-900 font-bold text-sm">Scan Successful</p>
                  <p className="text-emerald-700 text-xs font-medium mt-0.5">Identified {results.items.length} carbon-intensive items</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {results.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3.5 border border-slate-100 rounded-xl bg-white shadow-sm">
                    <span className="text-sm font-semibold text-slate-700">{item.raw_text}</span>
                    <span className="text-sm font-bold text-slate-900 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">{item.co2e_kg} kg</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-xl mt-4 border border-slate-200">
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Estimated Total</span>
                  <span className="text-xl font-black text-emerald-700">{results.total_co2e_kg} kg CO₂e</span>
                </div>
              </div>

              <button 
                onClick={commitToLedger}
                className="w-full py-4 bg-emerald-700 text-white font-bold text-sm rounded-full shadow-md hover:bg-emerald-800 hover:shadow-lg transition-all"
              >
                Add to Weekly Ledger
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
