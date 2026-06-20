import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';

export interface LedgerEntry {
  id: string;
  category: 'TRANSPORT' | 'UTILITIES' | 'DIET';
  sub_category: string;
  co2e_kg: number;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  initials: string;
  location: string;
  weeklyAllowanceKg: number;
}

export interface ActiveNudge {
  actionId: string;
  headline: string;
  impactMetric: string;
  category: 'transport' | 'utility' | 'diet';
}

export interface LeagueStanding {
  id: string;
  initials: string;
  name: string;
  ecoPoints: number;
  tier: 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
}

export interface EcoState {
  userProfile: UserProfile;
  weeklyLedger: LedgerEntry[];
  activeNudge: ActiveNudge | null;
  userChallenges: LeagueStanding[];
}

export type EcoAction = 
  | { type: 'ADD_ENTRY'; payload: LedgerEntry }
  | { type: 'SET_NUDGE'; payload: ActiveNudge | null }
  | { type: 'SYNC_LEDGER'; payload: LedgerEntry[] };

const initialState: EcoState = {
  userProfile: {
    name: 'Jane Doe',
    initials: 'JD',
    location: 'US_WEST (Seattle Grid)',
    weeklyAllowanceKg: 100,
  },
  weeklyLedger: [
    { id: 'seed-01', category: 'TRANSPORT', sub_category: 'gasoline_car', co2e_kg: 18.4, timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 'seed-02', category: 'UTILITIES', sub_category: 'electricity', co2e_kg: 22.1, timestamp: new Date(Date.now() - 86400000 * 4).toISOString() },
    { id: 'seed-03', category: 'DIET',      sub_category: 'high_meat',    co2e_kg: 14.6, timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'seed-04', category: 'TRANSPORT', sub_category: 'bus',          co2e_kg: 3.2,  timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'seed-05', category: 'UTILITIES', sub_category: 'electricity',  co2e_kg: 11.0, timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: 'seed-06', category: 'DIET',      sub_category: 'vegan',        co2e_kg: 2.3,  timestamp: new Date().toISOString() },
  ],
  activeNudge: null,
  userChallenges: [
    { id: '1', initials: 'AK', name: 'Alex K.', ecoPoints: 1250, tier: 'Diamond' },
    { id: '2', initials: 'JD', name: 'Jane Doe', ecoPoints: 940, tier: 'Platinum' },
    { id: '3', initials: 'SJ', name: 'Sam J.', ecoPoints: 820, tier: 'Gold' },
    { id: '4', initials: 'MB', name: 'Maria B.', ecoPoints: 610, tier: 'Silver' },
  ],
};

const ecoReducer = (state: EcoState, action: EcoAction): EcoState => {
  switch (action.type) {
    case 'ADD_ENTRY':
      return { ...state, weeklyLedger: [...state.weeklyLedger, action.payload] };
    case 'SET_NUDGE':
      return { ...state, activeNudge: action.payload };
    case 'SYNC_LEDGER':
      return { ...state, weeklyLedger: action.payload };
    default:
      return state;
  }
};

const EcoContext = createContext<{ state: EcoState; dispatch: React.Dispatch<EcoAction> } | undefined>(undefined);

export const EcoStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(ecoReducer, initialState);
  return (
    <EcoContext.Provider value={{ state, dispatch }}>
      {children}
    </EcoContext.Provider>
  );
};

export const useEcoState = () => {
  const context = useContext(EcoContext);
  if (!context) {
    throw new Error('useEcoState must be used within an EcoStateProvider');
  }
  return context;
};
