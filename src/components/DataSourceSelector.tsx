'use client';

import React from 'react';
import { useData } from '@/context/DataContext';
import { DataSourceType, DATA_SOURCE_LABELS } from '@/utils/constants';

export const DataSourceSelector: React.FC = () => {
  const { refreshData, loading, activeDataSource, switchDataSource } = useData();
  
  // Handle switching to a specific data source
  const handleSwitchDataSource = (dataSource: DataSourceType) => {
    switchDataSource(dataSource);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm mb-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-gray-700">Data Source</h3>
          <p className="text-xs text-gray-500">
            {`Using ${DATA_SOURCE_LABELS[activeDataSource]} data`}
          </p>
        </div>
        
        <div className="flex items-center">
          {/* Data source toggle buttons */}
          <div className="flex bg-gray-100 p-1 rounded-md mr-4">
            <button
              onClick={() => handleSwitchDataSource(DataSourceType.GOOGLE_ADS)}
              disabled={loading || activeDataSource === DataSourceType.GOOGLE_ADS}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeDataSource === DataSourceType.GOOGLE_ADS
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Google Ads
            </button>
            <button
              onClick={() => handleSwitchDataSource(DataSourceType.MICROSOFT_ADS)}
              disabled={loading || activeDataSource === DataSourceType.MICROSOFT_ADS}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeDataSource === DataSourceType.MICROSOFT_ADS
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Microsoft Ads
            </button>
          </div>
          
          {/* Refresh button */}
          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              'Refresh Data'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 