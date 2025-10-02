import React, { Suspense } from 'react';
import { PageLoadingSpinner, DashboardPageLoading, TablePageLoading, AnalyticsPageLoading, ManagementPageLoading } from './PageLoadingSpinner';

interface PageWrapperProps {
  children: React.ReactNode;
  loadingType?: 'default' | 'dashboard' | 'table' | 'analytics' | 'management' | 'minimal';
  title?: string;
  subtitle?: string;
}

export function PageWrapper({ 
  children, 
  loadingType = 'default',
  title,
  subtitle 
}: PageWrapperProps) {
  
  const getLoadingComponent = () => {
    switch (loadingType) {
      case 'dashboard':
        return <DashboardPageLoading />;
      case 'table':
        return <TablePageLoading />;
      case 'analytics':
        return <AnalyticsPageLoading />;
      case 'management':
        return <ManagementPageLoading />;
      case 'minimal':
        return <PageLoadingSpinner variant="minimal" title={title} />;
      default:
        return <PageLoadingSpinner title={title} subtitle={subtitle} />;
    }
  };

  return (
    <Suspense fallback={getLoadingComponent()}>
      {children}
    </Suspense>
  );
}

// Specific wrapper components for different page types
export function DashboardPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PageWrapper loadingType="dashboard">
      {children}
    </PageWrapper>
  );
}

export function TablePageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PageWrapper loadingType="table">
      {children}
    </PageWrapper>
  );
}

export function AnalyticsPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PageWrapper loadingType="analytics">
      {children}
    </PageWrapper>
  );
}

export function ManagementPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PageWrapper loadingType="management">
      {children}
    </PageWrapper>
  );
}

export default PageWrapper;