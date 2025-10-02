import React from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface InternalLoadingSpinnerProps {
  variant?: 'spinner' | 'skeleton' | 'pulse' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function InternalLoadingSpinner({ 
  variant = 'spinner',
  size = 'md',
  text,
  className = '' 
}: InternalLoadingSpinnerProps) {
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 ${className}`}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-blue-200 dark:bg-blue-800 rounded-full"></div>
        </div>
        {text && <span className="ml-3 text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center gap-1 p-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
        {text && <span className="ml-3 text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400`} />
      {text && <span className="ml-3 text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Specific loading components for common use cases
export function TableLoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="border-b">
          <td className="p-4"><Skeleton className="h-4 w-24" /></td>
          <td className="p-4"><Skeleton className="h-4 w-32" /></td>
          <td className="p-4"><Skeleton className="h-4 w-20" /></td>
          <td className="p-4"><Skeleton className="h-4 w-28" /></td>
          <td className="p-4"><Skeleton className="h-4 w-16" /></td>
        </tr>
      ))}
    </>
  );
}

export function CardContentLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-1/3" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function ChartLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="flex items-center justify-center">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export function FormLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

export default InternalLoadingSpinner;