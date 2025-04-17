'use client';

import React from 'react';
import { FilterPanel } from '../filters/FilterPanel';
import { DataSourceSelector } from '../DataSourceSelector';

interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer = ({ children }: PageContainerProps) => {
  return (
    <>
      <DataSourceSelector />
      <FilterPanel />
      {children}
    </>
  );
}; 