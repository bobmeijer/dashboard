'use client';

import { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { StatCard } from '../common/StatCard';
import { KpiSummary } from '@/types/data';
import { formatCurrency, formatNumber, formatPercentage, formatRoas, formatCpc, formatCpa, formatClv } from '@/utils/dataProcessor';
import { 
  FiDollarSign, 
  FiEye, 
  FiMousePointer, 
  FiShoppingCart,
  FiTrendingUp,
  FiBarChart2
} from 'react-icons/fi';

interface ExecutiveSummaryProps {
  currentPeriod: KpiSummary | null;
  previousPeriod: KpiSummary | null;
  dateRange: {
    startDate?: string;
    endDate?: string;
  };
  kpiSummary: KpiSummary;
  trendChanges: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    cost: number;
    profit: number;
    roas: number;
    convRate: number;
  };
}

export const ExecutiveSummary = ({ 
  currentPeriod, 
  previousPeriod, 
  dateRange,
  kpiSummary,
  trendChanges
}: ExecutiveSummaryProps) => {
  // Function to calculate percentage change
  const getPercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Function to format trend (positive/negative)
  const getTrendDirection = (value: number): string => {
    if (value > 0) return 'increased';
    if (value < 0) return 'decreased';
    return 'remained stable';
  };

  // Function to get color class based on trend (positive/negative) and metric type
  const getTrendColorClass = (value: number, isNegativeBetter: boolean = false): string => {
    if (value === 0) return 'text-gray-600';
    
    // For metrics where lower is better (like CPA)
    if (isNegativeBetter) {
      return value < 0 ? 'text-green-600' : 'text-red-600';
    }
    
    // For metrics where higher is better
    return value > 0 ? 'text-green-600' : 'text-red-600';
  };

  // Generate the summary text
  const generateSummary = (): JSX.Element => {
    if (!currentPeriod || !previousPeriod) {
      return <p className="text-gray-500">No comparative data available for this period.</p>;
    }

    // Calculate changes
    const convChange = getPercentageChange(currentPeriod.conversions, previousPeriod.conversions);
    const revenueChange = getPercentageChange(currentPeriod.revenue, previousPeriod.revenue);
    const profitChange = getPercentageChange(currentPeriod.profit, previousPeriod.profit);
    const cpaChange = getPercentageChange(currentPeriod.cpa, previousPeriod.cpa);
    const roasChange = getPercentageChange(currentPeriod.roas, previousPeriod.roas);
    const clvChange = getPercentageChange(currentPeriod.clv, previousPeriod.clv);

    // If no date range is available
    if (!dateRange.startDate || !dateRange.endDate) {
      return (
        <p className="text-gray-700 leading-relaxed">
          In the selected period, we saw {' '}
          <span className={getTrendColorClass(convChange)}>
            {Math.abs(convChange).toFixed(1)}% {getTrendDirection(convChange)} conversions
          </span> ({formatNumber(currentPeriod.conversions)}), resulting in {' '}
          <span className={getTrendColorClass(revenueChange)}>
            {Math.abs(revenueChange).toFixed(1)}% {getTrendDirection(revenueChange)} revenue
          </span> ({formatCurrency(currentPeriod.revenue)}). The profit {' '}
          <span className={getTrendColorClass(profitChange)}>
            {getTrendDirection(profitChange)} by {Math.abs(profitChange).toFixed(1)}%
          </span> to {formatCurrency(currentPeriod.profit)}. The cost per acquisition (CPA) {' '}
          <span className={getTrendColorClass(cpaChange, true)}>
            {getTrendDirection(cpaChange)} by {Math.abs(cpaChange).toFixed(1)}%
          </span> to {formatCpa(currentPeriod.cpa)}, while return on ad spend (ROAS) {' '}
          <span className={getTrendColorClass(roasChange)}>
            {getTrendDirection(roasChange)} by {Math.abs(roasChange).toFixed(1)}%
          </span> to {formatRoas(currentPeriod.roas)}. Customer lifetime value (CLV) {' '}
          <span className={getTrendColorClass(clvChange)}>
            {getTrendDirection(clvChange)} by {Math.abs(clvChange).toFixed(1)}%
          </span> to {formatClv(currentPeriod.clv)}.
        </p>
      );
    }

    // Format date range for display
    const formatDateForDisplay = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const startDate = formatDateForDisplay(dateRange.startDate);
    const endDate = formatDateForDisplay(dateRange.endDate);

    return (
      <p className="text-gray-700 leading-relaxed">
        During the period from {startDate} to {endDate}, we saw {' '}
        <span className={getTrendColorClass(convChange)}>
          {Math.abs(convChange).toFixed(1)}% {getTrendDirection(convChange)} conversions
        </span> ({formatNumber(currentPeriod.conversions)}), resulting in {' '}
        <span className={getTrendColorClass(revenueChange)}>
          {Math.abs(revenueChange).toFixed(1)}% {getTrendDirection(revenueChange)} revenue
        </span> ({formatCurrency(currentPeriod.revenue)}). The profit {' '}
        <span className={getTrendColorClass(profitChange)}>
          {getTrendDirection(profitChange)} by {Math.abs(profitChange).toFixed(1)}%
        </span> to {formatCurrency(currentPeriod.profit)}. The cost per acquisition (CPA) {' '}
        <span className={getTrendColorClass(cpaChange, true)}>
          {getTrendDirection(cpaChange)} by {Math.abs(cpaChange).toFixed(1)}%
        </span> to {formatCpa(currentPeriod.cpa)}, while return on ad spend (ROAS) {' '}
        <span className={getTrendColorClass(roasChange)}>
          {getTrendDirection(roasChange)} by {Math.abs(roasChange).toFixed(1)}%
        </span> to {formatRoas(currentPeriod.roas)}. Customer lifetime value (CLV) {' '}
        <span className={getTrendColorClass(clvChange)}>
          {getTrendDirection(clvChange)} by {Math.abs(clvChange).toFixed(1)}%
        </span> to {formatClv(currentPeriod.clv)}.
      </p>
    );
  };

  return (
    <>
      <Card title="Executive Summary" className="mb-6">
        <div className="p-4">
          <div>
            {generateSummary()}
          </div>
        </div>
      </Card>
      
      <Card title="Key Performance Indicators" className="mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Impressions"
              value={kpiSummary.impressions}
              icon={<FiEye size={20} />}
              previousValue={kpiSummary.impressions - trendChanges.impressions}
              format="number"
            />
            
            <StatCard
              title="Clicks"
              value={kpiSummary.clicks}
              icon={<FiMousePointer size={20} />}
              previousValue={kpiSummary.clicks - trendChanges.clicks}
              format="number"
            />
            
            <StatCard
              title="Conversions"
              value={kpiSummary.conversions}
              icon={<FiShoppingCart size={20} />}
              previousValue={kpiSummary.conversions - trendChanges.conversions}
              format="number"
            />
            
            <StatCard
              title="Revenue"
              value={kpiSummary.revenue}
              icon={<FiDollarSign size={20} />}
              previousValue={kpiSummary.revenue - trendChanges.revenue}
              format="currency"
            />
            
            <StatCard
              title="Cost"
              value={kpiSummary.cost}
              icon={<FiDollarSign size={20} />}
              previousValue={kpiSummary.cost - trendChanges.cost}
              format="currency"
            />
            
            <StatCard
              title="Profit"
              value={kpiSummary.profit}
              icon={<FiTrendingUp size={20} />}
              previousValue={kpiSummary.profit - trendChanges.profit}
              format="currency"
            />
            
            <StatCard
              title="ROAS"
              value={kpiSummary.roas}
              icon={<FiBarChart2 size={20} />}
              previousValue={kpiSummary.roas - trendChanges.roas}
              format="roas"
            />
            
            <StatCard
              title="Conversion Rate"
              value={kpiSummary.convRate}
              icon={<FiBarChart2 size={20} />}
              previousValue={kpiSummary.convRate - trendChanges.convRate}
              format="percentage"
              decimals={2}
            />
          </div>
        </div>
      </Card>
    </>
  );
}; 