'use client';

import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card } from '../common/Card';
import { FilterOptions, TimeUnit } from '@/types/data';
import { DateRangeSelector } from './DateRangeSelector';

export const FilterPanel = () => {
  const { 
    filterOptions,
    selectedFilters,
    setSelectedFilters,
    setTimeUnit,
    timeUnit,
    refreshData
  } = useData();
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleFilterChange = (
    filterType: 'accounts' | 'languages' | 'campaignTypes' | 'domains',
    value: string,
    isChecked: boolean
  ) => {
    setSelectedFilters({
      ...selectedFilters,
      [filterType]: isChecked
        ? [...selectedFilters[filterType], value]
        : selectedFilters[filterType].filter(item => item !== value)
    });
  };
  
  const handleBulkSelection = (
    filterType: 'accounts' | 'languages' | 'campaignTypes' | 'domains',
    selectAll: boolean
  ) => {
    setSelectedFilters({
      ...selectedFilters,
      [filterType]: selectAll ? [...filterOptions[filterType]] : []
    });
  };
  
  const handleTimeUnitChange = (unit: TimeUnit) => {
    setTimeUnit(unit);
  };
  
  const handleClearFilters = () => {
    refreshData();
  };

  // Sort all filter options
  const sortedFilterOptions = {
    accounts: [...filterOptions.accounts].sort(),
    languages: [...filterOptions.languages].sort(),
    campaignTypes: [...filterOptions.campaignTypes].sort(),
    domains: [...filterOptions.domains].sort()
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
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-3 py-2 text-sm font-medium hover:text-blue-800"
                  style={{ color: primaryColor }}
                >
                  {isExpanded ? 'Hide Filters' : 'Show More Filters'}
                </button>
              </div>
              
              <div className="relative z-30">
                <DateRangeSelector isCompact={true} />
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {isExpanded && (
        <Card title="Additional Filters" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Accounts Filter */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Accounts</h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleBulkSelection('accounts', true)}
                    className="text-xs hover:text-blue-800"
                    style={{ color: primaryColor }}
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={() => handleBulkSelection('accounts', false)}
                    className="text-xs hover:text-blue-800"
                    style={{ color: primaryColor }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {sortedFilterOptions.accounts.map((account) => (
                  <div key={account} className="flex items-center">
                    <input
                      id={`account-${account}`}
                      type="checkbox"
                      checked={selectedFilters.accounts.includes(account)}
                      onChange={(e) => 
                        handleFilterChange('accounts', account, e.target.checked)
                      }
                      className="h-4 w-4 rounded"
                      style={{ 
                        accentColor: primaryColor,
                        borderColor: primaryColor
                      }}
                    />
                    <label
                      htmlFor={`account-${account}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {account}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Languages Filter */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Languages</h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleBulkSelection('languages', true)}
                    className="text-xs hover:text-blue-800"
                    style={{ color: primaryColor }}
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={() => handleBulkSelection('languages', false)}
                    className="text-xs hover:text-blue-800"
                    style={{ color: primaryColor }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {sortedFilterOptions.languages.map((language) => (
                  <div key={language} className="flex items-center">
                    <input
                      id={`language-${language}`}
                      type="checkbox"
                      checked={selectedFilters.languages.includes(language)}
                      onChange={(e) => 
                        handleFilterChange('languages', language, e.target.checked)
                      }
                      className="h-4 w-4 rounded"
                      style={{ 
                        accentColor: primaryColor,
                        borderColor: primaryColor
                      }}
                    />
                    <label
                      htmlFor={`language-${language}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {language}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Campaign Types Filter */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Campaign Types</h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleBulkSelection('campaignTypes', true)}
                    className="text-xs hover:text-blue-800"
                    style={{ color: primaryColor }}
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={() => handleBulkSelection('campaignTypes', false)}
                    className="text-xs hover:text-blue-800"
                    style={{ color: primaryColor }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {sortedFilterOptions.campaignTypes.map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      id={`type-${type}`}
                      type="checkbox"
                      checked={selectedFilters.campaignTypes.includes(type)}
                      onChange={(e) => 
                        handleFilterChange('campaignTypes', type, e.target.checked)
                      }
                      className="h-4 w-4 rounded"
                      style={{ 
                        accentColor: primaryColor,
                        borderColor: primaryColor
                      }}
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Domains Filter */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Domains</h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleBulkSelection('domains', true)}
                    className="text-xs hover:text-blue-800"
                    style={{ color: primaryColor }}
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={() => handleBulkSelection('domains', false)}
                    className="text-xs hover:text-blue-800"
                    style={{ color: primaryColor }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {sortedFilterOptions.domains.map((domain) => (
                  <div key={domain} className="flex items-center">
                    <input
                      id={`domain-${domain}`}
                      type="checkbox"
                      checked={selectedFilters.domains.includes(domain)}
                      onChange={(e) => 
                        handleFilterChange('domains', domain, e.target.checked)
                      }
                      className="h-4 w-4 rounded"
                      style={{ 
                        accentColor: primaryColor,
                        borderColor: primaryColor
                      }}
                    />
                    <label
                      htmlFor={`domain-${domain}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {domain}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}; 