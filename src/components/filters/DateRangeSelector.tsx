'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '@/context/DataContext';
import { Card } from '../common/Card';
import { DateRange } from '@/types/data';

// Simplified date range options
export enum DateRangeOption {
  YESTERDAY = 'Yesterday',
  LAST_WEEK = 'Last week',
  LAST_30_DAYS = 'Last 30 days',
  LAST_MONTH = 'Last month',
  LAST_QUARTER = 'Last quarter',
  LAST_YEAR = 'Last year',
  THIS_YEAR = 'This year',
  ALL_TIME = 'All time',
  CUSTOM = 'Custom'
}

export const DateRangeSelector = ({ isCompact = false }: { isCompact?: boolean }) => {
  const { setDateRange } = useData();
  const [mounted, setMounted] = useState(false);
  
  // Initialize with default values
  const [selectedOption, setSelectedOption] = useState<DateRangeOption>(DateRangeOption.LAST_MONTH);
  const [customRange, setCustomRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [isCustom, setIsCustom] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [displayText, setDisplayText] = useState('Loading...');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Initialize from localStorage on client side only
  useEffect(() => {
    const savedOption = localStorage.getItem('selectedDateRangeOption') as DateRangeOption;
    const savedIsCustom = localStorage.getItem('isCustomDateRange') === 'true';
    let savedCustomRange = { startDate: '', endDate: '' };
    
    try {
      const savedRangeStr = localStorage.getItem('customDateRange');
      if (savedRangeStr) {
        savedCustomRange = JSON.parse(savedRangeStr);
      }
    } catch (err) {
      console.error('Error parsing custom date range:', err);
    }
    
    if (savedOption) setSelectedOption(savedOption);
    if (savedIsCustom) setIsCustom(savedIsCustom);
    if (savedCustomRange) setCustomRange(savedCustomRange);
    
    setMounted(true);
  }, []);

  // Function to get date range based on selected option
  const getDateRange = (option: DateRangeOption): DateRange => {
    // Always create dates with time set to noon to avoid timezone issues
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    // Format date as YYYY-MM-DD with consistent timezone handling
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    switch (option) {
      case DateRangeOption.YESTERDAY: {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(12, 0, 0, 0);
        
        return {
          startDate: formatDate(yesterday),
          endDate: formatDate(yesterday)
        };
      }
      
      case DateRangeOption.LAST_WEEK: {
        // Previous Monday to Sunday
        const lastSunday = new Date(today);
        const dayOfWeek = lastSunday.getDay() || 7;
        lastSunday.setDate(lastSunday.getDate() - dayOfWeek);
        lastSunday.setHours(12, 0, 0, 0);
        
        const lastMonday = new Date(lastSunday);
        lastMonday.setDate(lastMonday.getDate() - 6);
        lastMonday.setHours(12, 0, 0, 0);
        
        return {
          startDate: formatDate(lastMonday),
          endDate: formatDate(lastSunday)
        };
      }
      
      case DateRangeOption.LAST_MONTH: {
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        firstDayOfLastMonth.setHours(12, 0, 0, 0);
        
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        lastDayOfLastMonth.setHours(12, 0, 0, 0);
        
        return {
          startDate: formatDate(firstDayOfLastMonth),
          endDate: formatDate(lastDayOfLastMonth)
        };
      }
      
      case DateRangeOption.LAST_QUARTER: {
        // Get the current quarter (1-4)
        const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
        // Get previous quarter
        const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
        // Adjust year if moving from Q1 to Q4
        const year = currentQuarter === 1 ? today.getFullYear() - 1 : today.getFullYear();
        
        // First day of the quarter (0-indexed months)
        const firstDayOfQuarter = new Date(year, (prevQuarter - 1) * 3, 1);
        
        // Last day of the quarter
        const lastDayOfQuarter = new Date(year, prevQuarter * 3, 0);
        
        return {
          startDate: formatDate(firstDayOfQuarter),
          endDate: formatDate(lastDayOfQuarter)
        };
      }
      
      case DateRangeOption.LAST_YEAR: {
        const lastYear = today.getFullYear() - 1;
        
        const firstDayOfLastYear = new Date(lastYear, 0, 1);
        const lastDayOfLastYear = new Date(lastYear, 11, 31);
        
        return {
          startDate: formatDate(firstDayOfLastYear),
          endDate: formatDate(lastDayOfLastYear)
        };
      }

      case DateRangeOption.THIS_YEAR: {
        const thisYear = today.getFullYear();
        
        const firstDayOfThisYear = new Date(thisYear, 0, 1);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(12, 0, 0, 0);
        
        return {
          startDate: formatDate(firstDayOfThisYear),
          endDate: formatDate(yesterday)
        };
      }

      case DateRangeOption.LAST_30_DAYS: {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        thirtyDaysAgo.setHours(12, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        yesterday.setHours(12, 0, 0, 0);
        
        return {
          startDate: formatDate(thirtyDaysAgo),
          endDate: formatDate(yesterday)
        };
      }
      
      case DateRangeOption.ALL_TIME:
        return {
          startDate: '', // Empty means no start date restriction
          endDate: formatDate(today)
        };
        
      case DateRangeOption.CUSTOM:
        return customRange;
        
      default:
        // Default to last month
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        
        return {
          startDate: formatDate(firstDayOfLastMonth),
          endDate: formatDate(lastDayOfLastMonth)
        };
    }
  };

  // Format displayed date range
  const formatDateRange = (dateRange: DateRange): string => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return 'All time';
    }
    
    if (dateRange.startDate && dateRange.endDate) {
      // For nice display, convert YYYY-MM-DD to MMM D - D, YYYY format
      const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', { 
          month: 'short',
          day: 'numeric'
        }).format(date);
      };
      
      // If same month and year
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
        const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(startDate);
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const year = startDate.getFullYear();
        return `${month} ${startDay} – ${endDay}, ${year}`;
      } else {
        return `${formatDate(dateRange.startDate)} – ${formatDate(dateRange.endDate)}, ${endDate.getFullYear()}`;
      }
    }
    
    return dateRange.startDate || dateRange.endDate || 'All time';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update display text whenever relevant state changes
  useEffect(() => {
    if (mounted) {
      const range = isCustom ? customRange : getDateRange(selectedOption);
      const text = formatDateRange(range);
      setDisplayText(text);
    }
  }, [mounted, customRange, selectedOption, isCustom]);

  // Handle option change
  const handleOptionChange = (option: DateRangeOption) => {
    setSelectedOption(option);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedDateRangeOption', option);
      localStorage.setItem('isCustomDateRange', (option === DateRangeOption.CUSTOM).toString());
    }
    
    if (option === DateRangeOption.CUSTOM) {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      const range = getDateRange(option);
      setDateRange(range);
      setShowDropdown(false);
    }
  };

  // Handle custom date range changes
  const handleCustomRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    const updatedRange = {
      ...customRange,
      [field]: value
    };
    
    setCustomRange(updatedRange);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('customDateRange', JSON.stringify(updatedRange));
    }
    
    // Only update if both dates are set
    if (updatedRange.startDate && updatedRange.endDate) {
      setDateRange(updatedRange);
    }
  };

  // Apply date range on initial mount only once
  useEffect(() => {
    if (mounted) {
      let rangeToApply: DateRange;
      
      if (isCustom) {
        rangeToApply = customRange;
      } else {
        rangeToApply = getDateRange(selectedOption);
      }
      
      setDateRange(rangeToApply);
    }
  }, [mounted]);

  // Primary color used throughout
  const primaryColor = 'rgb(20, 120, 237)';
  
  if (isCompact) {
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none"
        >
          <span className="font-medium">{mounted ? displayText : 'Loading...'}</span>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12"
            className={`transform transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
        
        {mounted && showDropdown && createPortal(
          <div 
            ref={dropdownRef}
            className="fixed shadow-lg rounded-md border border-gray-200 bg-white py-2 w-64"
            style={{
              zIndex: 9999,
              top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 5 : 0,
              left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left : 0,
            }}
          >
            {/* Date range options */}
            <div className="px-2">
              {Object.values(DateRangeOption).map((option) => (
                <button
                  key={option}
                  className={`px-4 py-2 text-sm text-left rounded-md transition w-full ${
                    selectedOption === option
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => handleOptionChange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {/* Custom date picker */}
            {isCustom && (
              <div className="mt-2 px-4 space-y-3 border-t border-gray-100 pt-2">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={customRange.startDate}
                    onChange={(e) => handleCustomRangeChange('startDate', e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1">
                    End date
                  </label>
                  <input
                    type="date"
                    value={customRange.endDate}
                    onChange={(e) => handleCustomRangeChange('endDate', e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button
                  onClick={() => {
                    if (customRange.startDate && customRange.endDate) {
                      setDateRange(customRange);
                      // Save to localStorage when Apply is clicked
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('customDateRange', JSON.stringify(customRange));
                        localStorage.setItem('isCustomDateRange', 'true');
                      }
                      setShowDropdown(false);
                    }
                  }}
                  disabled={!customRange.startDate || !customRange.endDate}
                  className={`w-full py-1.5 px-3 text-sm font-medium rounded-md ${
                    customRange.startDate && customRange.endDate
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Apply
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
      </div>
    );
  }
  
  return (
    <Card title="Date Range" className="mb-6">
      <div className="flex flex-col space-y-4">
        {/* Date range options */}
        <div className="grid grid-cols-1 gap-2">
          {Object.values(DateRangeOption).map((option) => (
            <button
              key={option}
              className={`px-4 py-2 text-sm text-left rounded-md transition ${
                selectedOption === option
                  ? 'bg-blue-100 text-blue-600 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              onClick={() => handleOptionChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
        
        {/* Custom date picker */}
        {isCustom && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Start date
              </label>
              <input
                type="date"
                value={customRange.startDate}
                onChange={(e) => handleCustomRangeChange('startDate', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                End date
              </label>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(e) => handleCustomRangeChange('endDate', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={() => {
                if (customRange.startDate && customRange.endDate) {
                  setDateRange(customRange);
                  // Save to localStorage when Apply is clicked
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('customDateRange', JSON.stringify(customRange));
                    localStorage.setItem('isCustomDateRange', 'true');
                  }
                }
              }}
              disabled={!customRange.startDate || !customRange.endDate}
              className={`py-2 px-4 text-sm font-medium rounded-md ${
                customRange.startDate && customRange.endDate
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}; 