import React from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface PageLoadingSpinnerProps {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'minimal' | 'dashboard' | 'table';
}

export function PageLoadingSpinner({ 
  title = 'Loading...',
  subtitle,
  variant = 'default' 
}: PageLoadingSpinnerProps) {
  
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-6 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Search and filters skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>

        {/* Table skeleton */}
        <div className="border rounded-lg overflow-hidden">
          <div className="border-b bg-muted/40 p-4">
            <div className="flex items-center gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border-b p-4">
              <div className="flex items-center gap-4">
                {[...Array(5)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-24" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className="space-y-6 p-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="border rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-blue-100 dark:border-blue-900/30"></div>
          <Loader2 className="w-6 h-6 absolute top-3 left-3 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-600/20 animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Specific loading components for different page types
export function DashboardPageLoading() {
  return (
    <PageLoadingSpinner 
      title="Loading Dashboard..." 
      subtitle="Fetching analytics and business metrics"
      variant="dashboard" 
    />
  );
}

export function TablePageLoading() {
  return (
    <PageLoadingSpinner 
      variant="table"
    />
  );
}

export function AnalyticsPageLoading() {
  return (
    <PageLoadingSpinner 
      title="Loading Analytics..." 
      subtitle="Processing data and generating insights"
      variant="dashboard" 
    />
  );
}

export function ManagementPageLoading() {
  return (
    <PageLoadingSpinner 
      title="Loading Management Tools..." 
      subtitle="Preparing data management interface"
      variant="table" 
    />
  );
}

export function MinimalPageLoading() {
  return (
    <PageLoadingSpinner 
      variant="minimal"
    />
  );
}

export default PageLoadingSpinner;