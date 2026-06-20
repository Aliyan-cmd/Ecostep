import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DashboardView } from '../components/DashboardView';
import { EcoStateProvider, useEcoState } from '../context/EcoState';
import type { LedgerEntry } from '../context/EcoState';

// Helper component to inject mock state directly into the provider context
const MockStateInjector: React.FC<{ children: React.ReactNode; mockState?: LedgerEntry[] }> = ({ children, mockState }) => {
  const { dispatch } = useEcoState();
  
  useEffect(() => {
    if (mockState) {
      dispatch({ type: 'SYNC_LEDGER', payload: mockState });
    }
  }, [dispatch, mockState]);
  
  return <>{children}</>;
};

describe('DashboardView Component', () => {
  
  it('gracefully renders an empty state graphic when the ledger is completely empty', () => {
    render(
      <EcoStateProvider>
        <MockStateInjector mockState={[]}>
          <DashboardView />
        </MockStateInjector>
      </EcoStateProvider>
    );
    
    // Test Case 1: Empty state logic
    expect(screen.getByTestId('empty-state')).toBeDefined();
    expect(screen.getByText('Awaiting Data')).toBeDefined();
  });

  it('renders the amber warning alert dynamically when utility threshold exceeds 50% allowance', () => {
    // 60kg utility is > 50kg (50% of 100kg default allowance in context)
    const mockLedger: LedgerEntry[] = [
      { id: '1', category: 'UTILITIES', sub_category: 'electricity_kwh', co2e_kg: 60, timestamp: '' },
      { id: '2', category: 'TRANSPORT', sub_category: 'ev_car', co2e_kg: 10, timestamp: '' }
    ];

    render(
      <EcoStateProvider>
        <MockStateInjector mockState={mockLedger}>
          <DashboardView />
        </MockStateInjector>
      </EcoStateProvider>
    );

    // Test Case 2: Amber warning text and visual style class
    const alert = screen.getByTestId('utility-alert');
    expect(alert).toBeDefined();
    expect(alert.textContent).toContain('Exceeds 50% threshold');
    
    const bar = screen.getByTestId('utility-bar');
    expect(bar.className).toContain('bg-amber-500');
  });
  
});
