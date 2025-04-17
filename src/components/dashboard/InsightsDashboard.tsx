'use client';

import { useData } from '@/context/DataContext';
import { Card } from '../common/Card';
import { StatCard } from '../common/StatCard';
import { FiTrendingUp, FiAlertCircle, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/dataProcessor';
import { SortableTable, Column } from '../common/SortableTable';

export const InsightsDashboard = () => {
  const { opportunities, processedData, trendData } = useData();
  
  if (!opportunities) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center text-gray-500">Loading insights...</p>
      </div>
    );
  }
  
  // Extract opportunity data
  const { highRoas, lowCpa, potentialScaling } = opportunities;
  
  // Sort opportunities by metrics
  const topRoasOpportunities = [...highRoas].sort((a, b) => (b.ROAS || 0) - (a.ROAS || 0)).slice(0, 5);
  const topLowCpaOpportunities = [...lowCpa].sort((a, b) => (a.CPA || 0) - (b.CPA || 0)).slice(0, 5);
  const topScalingOpportunities = [...potentialScaling].sort((a, b) => (b.ROAS || 0) - (a.ROAS || 0)).slice(0, 5);
  
  // Calculate overall metrics
  const totalRevenue = processedData.reduce((sum, item) => sum + parseFloat(item.Revenue.replace(/[€$,]/g, '') || '0'), 0);
  const totalCost = processedData.reduce((sum, item) => sum + parseFloat(item.Cost.replace(/[€$,]/g, '') || '0'), 0);
  const totalProfit = processedData.reduce((sum, item) => sum + parseFloat(item.Profit.replace(/[€$,]/g, '') || '0'), 0);
  const totalConversions = processedData.reduce((sum, item) => sum + parseFloat(item.Conversions.replace(/[,]/g, '') || '0'), 0);
  
  // Calculate projected growth
  const calculateProjectedGrowth = () => {
    if (trendData.length < 2) return 0;
    
    // Get the last two periods
    const latestPeriod = trendData[trendData.length - 1];
    const previousPeriod = trendData[trendData.length - 2];
    
    // Calculate growth rate for revenue
    const growthRate = (latestPeriod.revenue - previousPeriod.revenue) / previousPeriod.revenue;
    
    // Project next period revenue
    const projectedRevenue = latestPeriod.revenue * (1 + growthRate);
    
    return projectedRevenue - latestPeriod.revenue;
  };
  
  const projectedGrowth = calculateProjectedGrowth();

  // Define table columns
  const roasColumns: Column<any>[] = [
    {
      key: 'Campaign',
      header: 'Campaign',
      className: 'text-left font-medium text-gray-900'
    },
    {
      key: 'Account name',
      header: 'Account',
      className: 'text-left text-gray-500'
    },
    {
      key: 'ROAS',
      header: 'ROAS',
      className: 'text-right',
      render: (value) => {
        const roasValue = Number(value || 0);
        return (
          <span className={
            roasValue > 1.15
              ? 'text-green-600 font-semibold' 
              : roasValue >= 1
                ? 'text-orange-500 font-semibold' 
                : 'text-red-600 font-semibold'
          }>
            {formatNumber(roasValue, 2)}
          </span>
        );
      }
    },
    {
      key: 'Cost',
      header: 'Cost',
      className: 'text-right text-gray-500'
    },
    {
      key: 'Revenue',
      header: 'Revenue',
      className: 'text-right text-gray-500'
    },
    {
      key: 'Profit',
      header: 'Profit',
      className: 'text-right text-gray-500'
    }
  ];

  const cpaColumns: Column<any>[] = [
    {
      key: 'Campaign',
      header: 'Campaign',
      className: 'text-left font-medium text-gray-900'
    },
    {
      key: 'Account name',
      header: 'Account',
      className: 'text-left text-gray-500'
    },
    {
      key: 'CPA',
      header: 'CPA',
      className: 'text-right text-green-600 font-semibold',
      render: (value) => formatCurrency(value || 0)
    },
    {
      key: 'Conversions',
      header: 'Conversions',
      className: 'text-right text-gray-500'
    },
    {
      key: 'Cost',
      header: 'Cost',
      className: 'text-right text-gray-500'
    },
    {
      key: 'Conv. rate',
      header: 'Conv. Rate',
      className: 'text-right text-gray-500',
      render: (value) => formatPercentage(value || 0)
    }
  ];

  const scalingColumns: Column<any>[] = [
    {
      key: 'Campaign',
      header: 'Campaign',
      className: 'text-left font-medium text-gray-900'
    },
    {
      key: 'Account name',
      header: 'Account',
      className: 'text-left text-gray-500'
    },
    {
      key: 'ROAS',
      header: 'ROAS',
      className: 'text-right',
      render: (value) => {
        const roasValue = Number(value || 0);
        return (
          <span className={
            roasValue > 1.15
              ? 'text-green-600 font-semibold' 
              : roasValue >= 1
                ? 'text-orange-500 font-semibold' 
                : 'text-red-600 font-semibold'
          }>
            {formatNumber(roasValue, 2)}
          </span>
        );
      }
    },
    {
      key: 'Click share',
      header: 'Click Share',
      className: 'text-right text-blue-600 font-semibold'
    },
    {
      key: 'Cost',
      header: 'Cost',
      className: 'text-right text-gray-500'
    },
    {
      key: 'Revenue',
      header: 'Revenue',
      className: 'text-right text-gray-500'
    }
  ];
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Performance Insights</h2>
      
      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Overall ROAS"
          value={totalRevenue / totalCost}
          icon={<FiTrendingUp size={20} />}
          format="number"
          decimals={2}
          className="bg-gradient-to-br from-blue-50 to-blue-100"
        />
        
        <StatCard
          title="Total Profit"
          value={totalProfit}
          icon={<FiArrowUp size={20} />}
          format="currency"
          className="bg-gradient-to-br from-green-50 to-green-100"
        />
        
        <StatCard
          title="Conversion Cost"
          value={totalCost / totalConversions}
          icon={<FiArrowDown size={20} />}
          format="currency"
          decimals={2}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100"
        />
        
        <StatCard
          title="Projected Growth"
          value={projectedGrowth}
          icon={<FiTrendingUp size={20} />}
          format="currency"
          className={`bg-gradient-to-br ${projectedGrowth >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'}`}
        />
      </div>
      
      {/* High ROAS Opportunities */}
      <Card title="High ROAS Campaigns">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            These campaigns are delivering excellent returns and should be prioritized for budget allocation:
          </p>
          
          <SortableTable
            data={topRoasOpportunities}
            columns={roasColumns}
          />
        </div>
      </Card>
      
      {/* Low CPA Opportunities */}
      <Card title="Low Acquisition Cost Campaigns">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            These campaigns are acquiring conversions at a lower cost and may be good candidates for more investment:
          </p>
          
          <SortableTable
            data={topLowCpaOpportunities}
            columns={cpaColumns}
          />
        </div>
      </Card>
      
      {/* Scaling Opportunities */}
      <Card title="Campaigns with Scaling Potential">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            These campaigns have high ROAS but low click share, indicating good potential for scaling:
          </p>
          
          <SortableTable
            data={topScalingOpportunities}
            columns={scalingColumns}
          />
        </div>
      </Card>
      
      {/* Recommendations */}
      <Card title="Key Recommendations">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <FiAlertCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Increase budget for high ROAS campaigns</h3>
              <p className="mt-1 text-sm text-gray-600">
                Allocate more budget to campaigns with ROAS above 115% to maximize returns.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <FiAlertCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Optimize low-performing campaigns</h3>
              <p className="mt-1 text-sm text-gray-600">
                Review and optimize campaigns with ROAS below 100% to improve performance or reallocate budget.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <FiAlertCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Scale campaigns with growth potential</h3>
              <p className="mt-1 text-sm text-gray-600">
                Gradually increase spend on campaigns with high ROAS and low click share to capture additional market share.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <FiAlertCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Improve bidding strategy</h3>
              <p className="mt-1 text-sm text-gray-600">
                Implement more aggressive bidding for campaigns with low CPA to maximize conversion volume while maintaining efficient costs.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}; 