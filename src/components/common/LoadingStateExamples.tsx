import React from 'react';
import { 
  PageLoadingSpinner, 
  DashboardPageLoading, 
  TablePageLoading, 
  AnalyticsPageLoading, 
  ManagementPageLoading 
} from './PageLoadingSpinner';
import { 
  InternalLoadingSpinner, 
  TableLoadingRows, 
  CardContentLoading, 
  ChartLoading, 
  FormLoading 
} from './InternalLoadingSpinner';
import { LoadingStates, LoadingStateManager } from '../../utils/loadingStateManager';
import { usePageLoading } from '../../hooks/usePageLoading';

/**
 * Examples and documentation for clean loading states
 * 
 * This file demonstrates how to implement consistent, clean loading states
 * throughout the D'Busana Dashboard application
 */

// 1. PAGE-LEVEL LOADING STATES
// =============================

// Used in route configuration with PageWrapper components
export function PageLevelLoadingExample() {
  return (
    <div className="space-y-8">
      <h2>Page-Level Loading States</h2>
      <p className="text-muted-foreground">
        Used automatically by PageWrapper components in route configuration
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <h3>Dashboard Loading</h3>
          </div>
          <div className="h-96">
            <DashboardPageLoading />
          </div>
        </div>
        
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <h3>Table Loading</h3>
          </div>
          <div className="h-96">
            <TablePageLoading />
          </div>
        </div>
        
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <h3>Analytics Loading</h3>
          </div>
          <div className="h-96">
            <AnalyticsPageLoading />
          </div>
        </div>
        
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <h3>Management Loading</h3>
          </div>
          <div className="h-96">
            <ManagementPageLoading />
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. INTERNAL COMPONENT LOADING STATES
// =====================================

// Used within components for specific loading sections
export function InternalLoadingExample() {
  return (
    <div className="space-y-8">
      <h2>Internal Component Loading States</h2>
      <p className="text-muted-foreground">
        Used within components for specific loading sections
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border rounded-lg p-4">
          <h3>Spinner Loading</h3>
          <InternalLoadingSpinner variant="spinner" text="Loading data..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h3>Dots Loading</h3>
          <InternalLoadingSpinner variant="dots" text="Processing..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h3>Pulse Loading</h3>
          <InternalLoadingSpinner variant="pulse" text="Calculating..." />
        </div>
        
        <div className="border rounded-lg p-4">
          <h3>Skeleton Loading</h3>
          <InternalLoadingSpinner variant="skeleton" />
        </div>
        
        <div className="border rounded-lg p-4">
          <h3>Card Content Loading</h3>
          <CardContentLoading />
        </div>
        
        <div className="border rounded-lg p-4">
          <h3>Form Loading</h3>
          <FormLoading />
        </div>
      </div>
    </div>
  );
}

// 3. HOOK USAGE EXAMPLES
// ======================

// Example component using usePageLoading hook
export function ComponentWithHookExample() {
  const { isLoading, setLoading } = usePageLoading({ minLoadingTime: 500 });
  
  const handleDataLoad = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };
  
  if (isLoading) {
    return <InternalLoadingSpinner text="Loading component data..." />;
  }
  
  return (
    <div className="p-4 border rounded-lg">
      <h3>Component with Hook</h3>
      <p className="text-muted-foreground mb-4">
        Example of using usePageLoading hook
      </p>
      <button 
        onClick={handleDataLoad}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Reload Data
      </button>
    </div>
  );
}

// 4. LOADING STATE MANAGER EXAMPLES
// ==================================

export function LoadingStateManagerExample() {
  const [currentState, setCurrentState] = React.useState(LoadingStates.success);
  
  const operations = [
    { key: 'loadingData', label: 'Loading Data', state: LoadingStates.loadingData },
    { key: 'saving', label: 'Saving', state: LoadingStates.saving },
    { key: 'calculating', label: 'Calculating', state: LoadingStates.calculating },
    { key: 'importing', label: 'Importing', state: LoadingStates.importing },
    { key: 'searching', label: 'Searching', state: LoadingStates.searching },
  ];
  
  return (
    <div className="space-y-6">
      <h2>Loading State Manager</h2>
      <p className="text-muted-foreground">
        Predefined loading states and utilities
      </p>
      
      <div className="flex flex-wrap gap-2">
        {operations.map(op => (
          <button
            key={op.key}
            onClick={() => setCurrentState(op.state)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            {op.label}
          </button>
        ))}
        <button
          onClick={() => setCurrentState(LoadingStates.success)}
          className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
        >
          Success
        </button>
      </div>
      
      <div className="border rounded-lg p-4 h-32">
        {currentState.isLoading ? (
          <InternalLoadingSpinner text={currentState.loadingText} />
        ) : (
          <div className="flex items-center justify-center h-full text-green-600">
            ✓ Ready
          </div>
        )}
      </div>
    </div>
  );
}

// 5. IMPLEMENTATION GUIDELINES
// =============================

export function ImplementationGuidelines() {
  return (
    <div className="space-y-6">
      <h2>Implementation Guidelines</h2>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3>1. Page-Level Loading</h3>
          <p className="text-muted-foreground text-sm">
            Use PageWrapper components in route configuration. These provide 
            consistent loading experiences for entire pages.
          </p>
          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
{`// In routes.tsx
{
  path: "/customers",
  element: (
    <ManagementPageWrapper>
      <CustomerManagement />
    </ManagementPageWrapper>
  )
}`}
          </pre>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3>2. Internal Component Loading</h3>
          <p className="text-muted-foreground text-sm">
            Use InternalLoadingSpinner for loading states within components.
          </p>
          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
{`// Within component
if (isLoading) {
  return <InternalLoadingSpinner text="Loading customers..." />;
}`}
          </pre>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3>3. Table Loading</h3>
          <p className="text-muted-foreground text-sm">
            Use TableLoadingRows for loading states in table components.
          </p>
          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
{`// In table body
{isLoading ? (
  <TableLoadingRows rows={5} />
) : (
  customers.map(customer => ...)
)}`}
          </pre>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3>4. Using Loading Hook</h3>
          <p className="text-muted-foreground text-sm">
            Use usePageLoading hook for components that need controlled loading states.
          </p>
          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
{`const { isLoading, setLoading } = usePageLoading({ 
  minLoadingTime: 500 
});

// In async operation
setLoading(true);
await fetchData();
setLoading(false);`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function LoadingStateExamples() {
  return (
    <div className="space-y-12 p-6">
      <div>
        <h1>D'Busana Dashboard Loading States</h1>
        <p className="text-muted-foreground">
          Comprehensive guide to clean, consistent loading states
        </p>
      </div>
      
      <PageLevelLoadingExample />
      <InternalLoadingExample />
      <ComponentWithHookExample />
      <LoadingStateManagerExample />
      <ImplementationGuidelines />
    </div>
  );
}