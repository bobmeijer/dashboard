'use client';

import { useState } from 'react';
import { FiMaximize, FiMinimize } from 'react-icons/fi';

interface ZoomableChartProps {
  children: React.ReactNode;
  title: string;
}

export const ZoomableChart: React.FC<ZoomableChartProps> = ({ children, title }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Exit fullscreen"
          >
            <FiMinimize size={20} />
          </button>
        </div>
        <div className="flex-grow overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <button
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors z-10"
        aria-label="View fullscreen"
      >
        <FiMaximize size={18} />
      </button>
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
}; 