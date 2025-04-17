'use client';

import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';
import { PageContainer } from '@/components/common/PageContainer';

export default function Home() {
  return (
    <PageContainer>
      <ExecutiveDashboard />
    </PageContainer>
  );
}
