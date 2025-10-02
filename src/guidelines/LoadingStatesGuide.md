# D'Busana Dashboard - Loading States Implementation Guide

## Overview
This guide explains how to implement clean, consistent loading states across all pages in the D'Busana Dashboard application, following the Clean Dashboard Policy.

## Loading State Architecture

### 1. Page-Level Loading States
**Purpose**: Provide loading experience during page transitions and initial page loads.

**Implementation**: Automatic via route configuration using PageWrapper components.

**Components**:
- `PageWrapper` - Generic wrapper with customizable loading
- `DashboardPageWrapper` - For dashboard-style pages
- `TablePageWrapper` - For data table pages  
- `AnalyticsPageWrapper` - For analytics and charts pages
- `ManagementPageWrapper` - For management/CRUD pages

**Usage in routes.tsx**:
```tsx
{
  path: "/customers",
  element: (
    <ManagementPageWrapper>
      <CustomerManagement />
    </ManagementPageWrapper>
  )
}
```

### 2. Internal Component Loading States
**Purpose**: Handle loading states within components for specific operations.

**Components**:
- `InternalLoadingSpinner` - Flexible loading spinner with variants
- `TableLoadingRows` - Skeleton rows for table loading
- `CardContentLoading` - Skeleton for card content
- `ChartLoading` - Skeleton for chart areas
- `FormLoading` - Skeleton for form fields

**Usage**:
```tsx
if (isLoading) {
  return <InternalLoadingSpinner text="Loading customers..." />;
}
```

### 3. Loading State Management
**Purpose**: Consistent loading state patterns and utilities.

**Components**:
- `usePageLoading` hook - Controlled loading states with minimum duration
- `LoadingStateManager` - Utilities for loading state management
- `LoadingStates` - Predefined loading states for common operations

## Implementation by Page Type

### Dashboard Pages
**Route Wrapper**: `DashboardPageWrapper`
**Internal Loading**: `InternalLoadingSpinner` variant="dashboard"
**Features**:
- KPI card skeletons
- Chart loading placeholders
- Progress indicators with business context

### Management Pages (CRUD)
**Route Wrapper**: `ManagementPageWrapper`
**Internal Loading**: `TableLoadingRows`, `FormLoading`
**Features**:
- Table skeleton with realistic column structure
- Form field skeletons
- Search and filter loading states

### Analytics Pages
**Route Wrapper**: `AnalyticsPageWrapper`
**Internal Loading**: `ChartLoading`, analytics skeletons
**Features**:
- Chart placeholder with proper dimensions
- Metric calculation indicators
- Data processing messages

### Settings/Profile Pages
**Route Wrapper**: `PageWrapper` with custom text
**Internal Loading**: `FormLoading`, minimal spinners
**Features**:
- Simple, focused loading messages
- Form-specific skeletons

## Loading State Variants

### Spinner Variants
```tsx
<InternalLoadingSpinner variant="spinner" size="md" text="Loading..." />
<InternalLoadingSpinner variant="dots" />
<InternalLoadingSpinner variant="pulse" />
```

### Skeleton Variants
```tsx
<InternalLoadingSpinner variant="skeleton" />
<TableLoadingRows rows={5} />
<CardContentLoading />
<ChartLoading />
<FormLoading />
```

## Best Practices

### 1. Loading Duration
- Minimum loading time: 300-500ms for smooth UX
- Use `usePageLoading` hook with `minLoadingTime` option
- Prevent flash of loading states for fast operations

### 2. Loading Messages
- Use business-friendly language
- Avoid technical jargon
- Be specific about what's loading:
  - ✅ "Loading customer data..."
  - ❌ "Fetching API response..."

### 3. Loading Context
- Match loading state to operation type
- Use appropriate skeleton structures
- Maintain layout stability during loading

### 4. Error Handling
- Graceful fallback from loading to error states
- No technical error displays in main UI
- Use LoadingStateManager for consistent error messages

## Component Integration Examples

### CustomerManagement Example
```tsx
function CustomerManagement() {
  const { isLoading, setLoading } = usePageLoading({ minLoadingTime: 500 });
  const [customers, setCustomers] = useState([]);
  
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const result = await simpleApiCustomers.getCustomers();
      setCustomers(result.data.customers);
    } finally {
      setLoading(false);
    }
  };
  
  if (isLoading) {
    return <TableLoadingRows rows={10} />;
  }
  
  return (
    // Component content
  );
}
```

### Dashboard Component Example
```tsx
function DashboardMetrics() {
  const [loadingState, setLoadingState] = useState(LoadingStates.loadingDashboard);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingState(LoadingStates.loadingAnalytics);
        await fetchMetrics();
        setLoadingState(LoadingStates.success);
      } catch (error) {
        setLoadingState(LoadingStateManager.createErrorState("Failed to load metrics"));
      }
    };
    
    loadData();
  }, []);
  
  if (loadingState.isLoading) {
    return <InternalLoadingSpinner text={loadingState.loadingText} />;
  }
  
  return (
    // Dashboard content
  );
}
```

## Predefined Loading States

### Common Operations
```tsx
LoadingStates.loadingData        // "Loading data..."
LoadingStates.loadingDashboard   // "Loading dashboard..."
LoadingStates.loadingAnalytics   // "Loading analytics..."
LoadingStates.saving             // "Saving changes..."
LoadingStates.importing          // "Importing data..."
LoadingStates.calculating        // "Calculating metrics..."
LoadingStates.searching          // "Searching..."
```

### Custom Loading States
```tsx
const customState = LoadingStateManager.createLoadingState(
  "Processing customer data...",
  progressValue
);
```

## Migration Guide

### Existing Components
1. Replace manual loading spinners with `InternalLoadingSpinner`
2. Replace skeleton code with provided skeleton components
3. Use `usePageLoading` hook for loading state management
4. Update route configuration with appropriate PageWrapper

### Loading Text Updates
- Remove technical language from loading messages
- Use LoadingStateManager.getLoadingText() for consistent messaging
- Focus on business operations rather than technical processes

## Design Consistency

### Colors and Styling
- Primary loading color: `text-blue-600 dark:text-blue-400`
- Skeleton color: `bg-muted` with proper dark mode support
- Spinner animations: Smooth, 1-2 second duration
- Progress indicators: Subtle, non-intrusive

### Layout Preservation
- Maintain page layout during loading
- Use appropriate skeleton dimensions
- Prevent layout shift when transitioning from loading to content

## Performance Considerations

### Loading Optimization
- Cache loading states where appropriate
- Use React.memo for loading components
- Minimize re-renders during loading transitions
- Implement progressive loading for large datasets

### User Experience
- Show loading immediately for operations > 200ms
- Use optimistic updates where safe
- Provide cancel options for long operations
- Show progress for multi-step operations

This implementation ensures all pages in the D'Busana Dashboard have clean, consistent loading states that follow business-focused design principles while maintaining excellent user experience.