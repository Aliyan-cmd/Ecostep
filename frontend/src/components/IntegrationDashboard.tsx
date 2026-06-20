import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Plug, Car, Wallet, CheckCircle, RefreshCw, Camera } from 'lucide-react';
import { SmartScanModal } from './SmartScanModal';
import { MicroOffsetSettings } from './MicroOffsetSettings';

export const IntegrationDashboard: React.FC = () => {
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const mockIngest = (source: string) => {
    setIngestStatus(`Syncing with ${source}...`);
    setTimeout(() => {
      setIngestStatus(`Successfully synced latest data from ${source}!`);
      setTimeout(() => setIngestStatus(null), 3000);
    }, 1500);
  };

  const formik = useFormik({
    initialValues: {
      distance: '',
      transportMode: 'gasoline_car'
    },
    validationSchema: Yup.object({
      distance: Yup.number().required('Distance is required').positive('Must be positive'),
    }),
    onSubmit: (values, { resetForm }) => {
      setIngestStatus(`Manual entry logged: ${values.distance} miles via ${values.transportMode}`);
      setTimeout(() => setIngestStatus(null), 3000);
      resetForm();
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Integrations & Webhooks</h2>
      
      {ingestStatus && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center text-emerald-800 font-medium">
          <CheckCircle className="w-5 h-5 mr-3 text-emerald-500" />
          {ingestStatus}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Integration 1: Smart Utilities */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Plug className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Connected</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Smart Utilities API</h3>
          <p className="text-sm text-gray-500 mb-6 flex-1">Automatically ingests your household kWh usage from smart meters daily.</p>
          <button 
            onClick={() => mockIngest('Smart Utilities')}
            className="w-full flex items-center justify-center py-2 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Force Sync
          </button>
        </div>

        {/* Integration 2: Mobility Tracker */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
              <Car className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Connected</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Mobility Tracker</h3>
          <p className="text-sm text-gray-500 mb-6 flex-1">Syncs telematics data from your connected EV or tracking device.</p>
          <button 
            onClick={() => mockIngest('Mobility Tracker')}
            className="w-full flex items-center justify-center py-2 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Force Sync
          </button>
        </div>

        {/* Integration 3: Open Banking */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-gray-500" />
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Disconnected</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Open Banking</h3>
          <p className="text-sm text-gray-500 mb-6 flex-1">Analyze diet and shopping emissions via credit card transactions.</p>
          <button className="w-full flex items-center justify-center py-2 px-4 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Connect Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Manual Entry Form */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Manual Activity Entry</h3>
            <button 
              type="button"
              onClick={() => setIsScanModalOpen(true)}
              className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
            >
              <Camera className="w-4 h-4 mr-1.5" /> AI Scan Receipt
            </button>
          </div>
          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Distance (Miles)</label>
              <input
                type="number"
                name="distance"
                onChange={formik.handleChange}
                value={formik.values.distance}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g. 15"
              />
              {formik.errors.distance && formik.touched.distance && (
                <p className="text-amber-500 font-medium text-xs mt-1">{formik.errors.distance}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Transport Mode</label>
              <select
                name="transportMode"
                onChange={formik.handleChange}
                value={formik.values.transportMode}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none"
              >
                <option value="gasoline_car">Gasoline Car</option>
                <option value="ev_car">Electric Vehicle (EV)</option>
                <option value="bus">Public Bus</option>
                <option value="train">Commuter Train</option>
              </select>
            </div>
            <button 
              type="submit"
              className="w-full mt-2 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 hover:shadow-md transition-all active:scale-[0.98]"
            >
              Log Activity
            </button>
          </form>
        </div>

        {/* Micro-Offset Settings Component */}
        <MicroOffsetSettings />

      </div>

      <SmartScanModal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} />
    </div>
  );
};
