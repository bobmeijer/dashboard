'use client';

import { useEffect, useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card } from '../common/Card';
import { StatCard } from '../common/StatCard';
import { FiDollarSign, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercentage, 
  formatCompactCurrency, 
  formatCompactNumber,
  formatRoas,
  formatCpa,
  formatCpc
} from '@/utils/dataProcessor';
import { SortableTable, Column } from '../common/SortableTable';
import { ZoomableChart } from '../common/ZoomableChart';
import { CHART_COLORS_SHORT, COMMON_CHART_MARGIN, ROAS_THRESHOLDS } from '@/utils/constants';

// Replace detectAnomalies functionality with a placeholder
const getAccountAnomalies = () => {
  return []; // Return empty array instead of using detectAnomalies
};

export const AccountAnalysis = () => {
  const { comparisonData, trendData, setCompareBy } = useData();
  
  // Set compareBy to 'Account name' when component mounts
  useEffect(() => {
    setCompareBy('Account name');
  }, [setCompareBy]);
  
  // Use the shared color palette from constants
  
  // If data isn't ready yet, show loading
  if (comparisonData.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center text-gray-500">Loading account data...</p>
      </div>
    );
  }
  
  // Sort accounts by revenue
  const sortedAccounts = [...comparisonData].sort((a, b) => b.revenue - a.revenue);
  
  // Find top and bottom accounts for performance highlights
  const topRevenueAccount = sortedAccounts[0];
  const topRoasAccount = [...sortedAccounts].sort((a, b) => b.roas - a.roas)[0];
  const topConvRateAccount = [...sortedAccounts].sort((a, b) => b.convRate - a.convRate)[0];
  
  // Replace anomaly detection with simplified logic
  const revenueAnomalies = getAccountAnomalies();
  
  // Prepare radar chart data (normalized metrics for each account)
  const prepareRadarData = () => {
    // Get the top 5 accounts for radar chart
    const topAccounts = sortedAccounts.slice(0, 5);
    
    // Prepare metrics for normalization
    const metrics = [
      { name: 'Revenue', key: 'revenue', higher: true },
      { name: 'ROAS', key: 'roas', higher: true },
      { name: 'Conv. Rate', key: 'convRate', higher: true },
      { name: 'CTR', key: 'ctr', higher: true },
      { name: 'CPA', key: 'cpa', higher: false }, // Lower is better
    ];
    
    // For each metric, find min and max values
    const metricRanges = metrics.map(metric => {
      const values = topAccounts.map(account => account[metric.key as keyof typeof account] as number);
      return {
        ...metric,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    });
    
    // For each account, normalize each metric to 0-100 scale
    return topAccounts.map(account => {
      const result: Record<string, any> = { name: account.name };
      
      metricRanges.forEach(metric => {
        const value = account[metric.key as keyof typeof account] as number;
        const range = metric.max - metric.min;
        
        // If all accounts have the same value, assign 50 (middle)
        if (range === 0) {
          result[metric.name] = 50;
        } else {
          // Normalize to 0-100 scale, invert if lower is better
          const normalized = metric.higher
            ? ((value - metric.min) / range) * 100
            : (1 - ((value - metric.min) / range)) * 100;
          
          result[metric.name] = normalized;
        }
      });
      
      return result;
    });
  };
  
  const radarData = prepareRadarData();

  // Define columns for the Account Performance Metrics table
  const accountColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Account',
      className: 'text-left font-medium text-gray-900'
    },
    {
      key: 'impressions',
      header: 'Impressions',
      className: 'text-right text-gray-500',
      render: (value) => formatNumber(value)
    },
    {
      key: 'clicks',
      header: 'Clicks',
      className: 'text-right text-gray-500',
      render: (value) => formatNumber(value)
    },
    {
      key: 'cost',
      header: 'Cost',
      className: 'text-right text-gray-500',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'conversions',
      header: 'Conversions',
      className: 'text-right text-gray-500',
      render: (value) => formatNumber(value)
    },
    {
      key: 'convRate',
      header: 'Conv. Rate',
      className: 'text-right text-gray-500',
      render: (value) => formatPercentage(value)
    },
    {
      key: 'cpa',
      header: 'CPA',
      className: 'text-right text-gray-500',
      render: (value) => formatCpa(value)
    },
    {
      key: 'revenue',
      header: 'Revenue',
      className: 'text-right text-gray-500',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'profit',
      header: 'Profit',
      className: 'text-right text-gray-500',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'clv',
      header: 'CLV',
      className: 'text-right text-gray-500',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'roas',
      header: 'ROAS',
      className: 'text-right',
      render: (value) => {
        const roasValue = Number(value);
        return (
          <span className={
            roasValue > ROAS_THRESHOLDS.HIGH
              ? 'text-green-600' 
              : roasValue >= ROAS_THRESHOLDS.GOOD
                ? 'text-orange-500' 
                : 'text-red-600'
          }>
            {formatRoas(roasValue)}
          </span>
        );
      }
    }
  ];

  // Define columns for anomalies table
  const anomalyColumns: Column<any>[] = [
    {
      key: 'period',
      header: 'Period',
      className: 'text-left font-medium text-gray-900'
    },
    {
      key: 'value',
      header: 'Revenue',
      className: 'text-right text-gray-500',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'deviation',
      header: 'Deviation Score',
      className: 'text-right text-gray-500',
      render: (value) => formatNumber(value, 2)
    }
  ];
  
  // Calculate metrics by account
  const metricsByAccount = sortedAccounts.map(account => ({
    name: account.name,
    impressions: account.impressions,
    clicks: account.clicks,
    cost: account.cost,
    conversions: account.conversions,
    convRate: account.convRate,
    cpa: account.cpa,
    revenue: account.revenue,
    profit: account.profit,
    clv: account.clv,
    roas: account.roas
  }));
  
  return (
    <div className="space-y-6">
      {/* Account Analysis Heading */}
      <h2 className="text-2xl font-semibold text-gray-800">Account Analysis</h2>
      
      {/* Revenue Anomalies */}
      {revenueAnomalies.length > 0 && (
        <Card title="Revenue Anomalies (Unusual Period Performance)">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              The following periods show unusual revenue patterns that may require attention:
            </p>
            
            <div className="overflow-x-auto">
              <SortableTable
                data={revenueAnomalies}
                columns={anomalyColumns}
              />
            </div>
          </div>
        </Card>
      )}
      
      {/* Account Performance Metrics Table */}
      <Card title="Account Performance Metrics">
        <SortableTable
          data={metricsByAccount}
          columns={accountColumns}
        />
      </Card>
    </div>
  );
}; 