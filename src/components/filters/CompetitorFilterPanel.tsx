'use client';

import { useData } from '@/context/DataContext';
import { Card } from '../common/Card';
import { TimeUnit } from '@/types/data';
import { DateRangeSelector } from './DateRangeSelector';
import { useState, useEffect } from 'react';
import { DataSourceType } from '@/utils/constants';

interface CompetitorFilterPanelProps {
  selectedAccount: string;
  availableAccounts: string[];
  onAccountChange: (account: string) => void;
}

export const CompetitorFilterPanel = ({ 
  selectedAccount, 
  availableAccounts, 
  onAccountChange 
}: CompetitorFilterPanelProps) => {
  const { 
    setTimeUnit,
    timeUnit,
  } = useData();
  
  const handleTimeUnitChange = (unit: TimeUnit) => {
    setTimeUnit(unit);
  };
  
  const primaryColor = 'rgb(20, 120, 237)';
  
  return (
    <div className="space-y-6">
      <Card title="Configuration" className="mb-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => handleTimeUnitChange('Day')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                    timeUnit === 'Day'
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: timeUnit === 'Day' ? primaryColor : undefined
                  }}
                >
                  <span className="hidden sm:inline">Daily</span>
                  <span className="sm:hidden">D</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeUnitChange('Week')}
                  className={`px-3 py-2 text-sm font-medium ${
                    timeUnit === 'Week'
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: timeUnit === 'Week' ? primaryColor : undefined
                  }}
                >
                  <span className="hidden sm:inline">Weekly</span>
                  <span className="sm:hidden">W</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeUnitChange('Month')}
                  className={`px-3 py-2 text-sm font-medium ${
                    timeUnit === 'Month'
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: timeUnit === 'Month' ? primaryColor : undefined
                  }}
                >
                  <span className="hidden sm:inline">Monthly</span>
                  <span className="sm:hidden">M</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeUnitChange('Quarter')}
                  className={`px-3 py-2 text-sm font-medium ${
                    timeUnit === 'Quarter'
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: timeUnit === 'Quarter' ? primaryColor : undefined
                  }}
                >
                  <span className="hidden sm:inline">Quarterly</span>
                  <span className="sm:hidden">Q</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeUnitChange('Year')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                    timeUnit === 'Year'
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: timeUnit === 'Year' ? primaryColor : undefined
                  }}
                >
                  <span className="hidden sm:inline">Yearly</span>
                  <span className="sm:hidden">Y</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-5">
              {/* Account Filter Dropdown */}
              <div className="relative">
                <select
                  value={selectedAccount}
                  onChange={(e) => onAccountChange(e.target.value)}
                  className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableAccounts.map((account) => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date Range Selector */}
              <div className="relative z-30">
                <DateRangeSelector isCompact={true} />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}; 