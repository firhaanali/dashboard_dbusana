import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { PlaceholderPage } from '../components/common/PlaceholderPage';
import { 
  PageWrapper,
  DashboardPageWrapper, 
  TablePageWrapper, 
  AnalyticsPageWrapper, 
  ManagementPageWrapper 
} from '../components/common/PageWrapper';

// Lazy loaded components
const SalesManagement = React.lazy(() => 
  import('../components/SalesManagement').then(module => ({ 
    default: module.SalesManagement 
  }))
);
import { ProductsManagementDatabase } from '../components/ProductsManagementDatabase';

import { CategoryManagement } from '../components/CategoryManagement';
import { BrandManagement } from '../components/BrandManagement';

// Import Components
import { ImportPage } from '../components/ImportPage';

// Core Analytics & Reports Components  
import { ProductSalesAnalytics } from '../components/ProductSalesAnalytics';
import { SalesAnalyticsDashboard } from '../components/SalesAnalyticsDashboard';
import { AdvertisingDashboard } from '../components/AdvertisingDashboard';
import { ForecastingDashboard } from '../components/ForecastingDashboard';

import { StockForecastingDashboard } from '../components/StockForecastingDashboard';

// Strategic Business Analytics
import { StrategicBusinessAnalytics } from '../components/StrategicBusinessAnalytics';

// Reports Components
import { ReportsDashboard } from '../components/ReportsDashboard';

// BOM Components - REMOVED

// Supplier Components
import { SupplierManagement } from '../components/SupplierManagement';

// Customer Management & Invoice Components
import { CustomerManagement } from '../components/CustomerManagement';
import { CustomerAggregationManager } from '../components/CustomerAggregationManager';
import { InvoiceReceipt } from '../components/InvoiceReceipt';

// Settings Components

// Developer Tools Components
import { TemplateHealthChecker } from '../components/TemplateHealthChecker';
import { TemplateFixUtility } from '../components/TemplateFixUtility';
import { SettingsPage } from '../components/common/SettingsPage';
import { SystemStatusPage } from '../components/common/SystemStatusPage';
import { AccountSettingsPage } from '../components/common/AccountSettingsPage';

// Cash Flow Components
import { CashFlowDashboard } from '../components/CashFlowDashboard';
import { CashFlowManagement } from '../components/CashFlowManagement';
import { ProfitReinvestmentTracker } from '../components/ProfitReinvestmentTracker';

// Affiliate Endorse Components
import { AffiliateEndorseManager } from '../components/AffiliateEndorseManager';

// Comprehensive Transaction Management Components
import { ReturnsAndCancellationsManager } from '../components/ReturnsAndCancellationsManager';
import { MarketplaceReimbursementManager } from '../components/MarketplaceReimbursementManager';
import { CommissionAdjustmentsManager } from '../components/CommissionAdjustmentsManager';
import { AffiliateSamplesManager } from '../components/AffiliateSamplesManager';

// TikTok Commission Calculator
import TikTokCommissionCalculator from '../components/TikTokCommissionCalculator';

// User Profile & Settings Components
import { UserProfile } from '../components/UserProfile';
import { UserSettings } from '../components/UserSettings';

import { UserManagement } from '../components/UserManagement';

// Stock Management
import { StockManagement } from '../components/StockManagement';

// Activity Dashboard
import { ActivityDashboard } from '../components/ActivityDashboard';

// Language Demo
import { LanguageDemo } from '../components/LanguageDemo';



export interface RouteConfig {
  path: string;
  element: React.ReactElement;
}

export const getCoreRoutes = (onImportSuccess: () => void): RouteConfig[] => [
  {
    path: "/import-data",
    element: (
      <PageWrapper title="Loading Import Tools..." subtitle="Preparing data import interface">
        <ImportPage onImportSuccess={onImportSuccess} />
      </PageWrapper>
    )
  },
  {
    path: "/sales",
    element: (
      <ManagementPageWrapper>
        <SalesManagement />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/products",
    element: (
      <ManagementPageWrapper>
        <ProductsManagementDatabase />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/categories",
    element: (
      <ManagementPageWrapper>
        <CategoryManagement />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/brands",
    element: (
      <ManagementPageWrapper>
        <BrandManagement />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/stock",
    element: (
      <ManagementPageWrapper>
        <StockManagement />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/suppliers",
    element: (
      <ManagementPageWrapper>
        <SupplierManagement />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/customers",
    element: (
      <ManagementPageWrapper>
        <CustomerManagement />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/customers/aggregation",
    element: (
      <ManagementPageWrapper>
        <CustomerAggregationManager />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/invoices",
    element: (
      <PageWrapper title="Loading Invoices..." subtitle="Preparing invoice management tools">
        <InvoiceReceipt />
      </PageWrapper>
    )
  },
  {
    path: "/activities",
    element: (
      <DashboardPageWrapper>
        <ActivityDashboard />
      </DashboardPageWrapper>
    )
  },
  
  // ⭐ NEW: Comprehensive Transaction Management
  {
    path: "/returns-cancellations",
    element: (
      <ManagementPageWrapper>
        <ReturnsAndCancellationsManager />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/marketplace-reimbursements",
    element: (
      <ManagementPageWrapper>
        <MarketplaceReimbursementManager />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/commission-adjustments",
    element: (
      <ManagementPageWrapper>
        <CommissionAdjustmentsManager />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/affiliate-samples",
    element: (
      <ManagementPageWrapper>
        <AffiliateSamplesManager />
      </ManagementPageWrapper>
    )
  }
];

export const analyticsRoutes: RouteConfig[] = [
  {
    path: "/analytics",
    element: (
      <AnalyticsPageWrapper>
        <SalesAnalyticsDashboard />
      </AnalyticsPageWrapper>
    )
  },
  {
    path: "/product-analytics",
    element: (
      <AnalyticsPageWrapper>
        <ProductSalesAnalytics />
      </AnalyticsPageWrapper>
    )
  },
  {
    path: "/reports",
    element: (
      <AnalyticsPageWrapper>
        <ReportsDashboard />
      </AnalyticsPageWrapper>
    )
  },
  {
    path: "/strategic-analytics",
    element: (
      <AnalyticsPageWrapper>
        <StrategicBusinessAnalytics />
      </AnalyticsPageWrapper>
    )
  }
];

// bomRoutes REMOVED - BOM feature discontinued

export const placeholderRoutes: RouteConfig[] = [
  {
    path: "/settings",
    element: (
      <PageWrapper title="Loading Settings..." subtitle="Preparing system configuration">
        <SettingsPage />
      </PageWrapper>
    )
  },
  {
    path: "/system-status",
    element: (
      <PageWrapper title="Loading System Status..." subtitle="Checking system health and performance">
        <SystemStatusPage />
      </PageWrapper>
    )
  },
  {
    path: "/account-settings",
    element: (
      <PageWrapper title="Loading Account Settings..." subtitle="Preparing user preferences">
        <AccountSettingsPage />
      </PageWrapper>
    )
  },
  {
    path: "/language-demo",
    element: (
      <PageWrapper title="Loading Language Demo..." subtitle="Testing multi-language system">
        <LanguageDemo />
      </PageWrapper>
    )
  }
];

export const cashFlowRoutes: RouteConfig[] = [
  {
    path: "/cash-flow",
    element: (
      <DashboardPageWrapper>
        <CashFlowDashboard />
      </DashboardPageWrapper>
    )
  },
  {
    path: "/cash-flow/management",
    element: (
      <ManagementPageWrapper>
        <CashFlowManagement />
      </ManagementPageWrapper>
    )
  },
  {
    path: "/profit-reinvestment",
    element: (
      <AnalyticsPageWrapper>
        <ProfitReinvestmentTracker />
      </AnalyticsPageWrapper>
    )
  },
  {
    path: "/affiliate-endorse",
    element: (
      <ManagementPageWrapper>
        <AffiliateEndorseManager />
      </ManagementPageWrapper>
    )
  }
];

export const advertisingRoutes: RouteConfig[] = [
  {
    path: "/advertising",
    element: (
      <DashboardPageWrapper>
        <AdvertisingDashboard />
      </DashboardPageWrapper>
    )
  },
  {
    path: "/tiktok-commission-calculator",
    element: (
      <PageWrapper title="Loading TikTok Commission Calculator..." subtitle="Preparing commission calculation tools">
        <TikTokCommissionCalculator />
      </PageWrapper>
    )
  }
];

export const forecastingRoutes: RouteConfig[] = [
  {
    path: "/forecasting",
    element: (
      <AnalyticsPageWrapper>
        <ForecastingDashboard />
      </AnalyticsPageWrapper>
    )
  },
  {
    path: "/stock-forecasting",
    element: (
      <AnalyticsPageWrapper>
        <StockForecastingDashboard />
      </AnalyticsPageWrapper>
    )
  }
];

export const userRoutes: RouteConfig[] = [
  {
    path: "/profile",
    element: (
      <PageWrapper title="Loading User Profile..." subtitle="Preparing profile information">
        <UserProfile />
      </PageWrapper>
    )
  },
  {
    path: "/user-settings",
    element: (
      <PageWrapper title="Loading User Settings..." subtitle="Preparing user preferences">
        <UserSettings />
      </PageWrapper>
    )
  },
  {
    path: "/user-management",
    element: (
      <ManagementPageWrapper>
        <UserManagement />
      </ManagementPageWrapper>
    )
  }
];

export const navigationRoutes: RouteConfig[] = [
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />
  }
];

// Developer & Admin Tools Routes
export const developerRoutes: RouteConfig[] = [
  {
    path: "/dev/template-health",
    element: (
      <PageWrapper title="Loading Template Health Monitor..." subtitle="Checking template generation status">
        <TemplateHealthChecker />
      </PageWrapper>
    )
  },
  {
    path: "/dev/template-fix",
    element: (
      <PageWrapper title="Loading Template Fix Utility..." subtitle="Preparing template repair tools">
        <TemplateFixUtility />
      </PageWrapper>
    )
  }
];