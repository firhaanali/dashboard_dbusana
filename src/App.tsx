import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { DashboardWrapper } from "./components/layout/DashboardWrapper";  
import { ImportDataProvider } from "./contexts/ImportDataContext";
import { SalesProvider } from "./contexts/SalesDataContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { backendGracefulFallback } from "./utils/backendGracefulFallback";
import { startupConsoleInfo } from "./utils/startupConsoleInfo";
import { showStartupInfo } from "./utils/simpleBackendConnection";

// Route configurations
import {
  getCoreRoutes,
  analyticsRoutes,
  placeholderRoutes,
  advertisingRoutes,
  forecastingRoutes,
  cashFlowRoutes,
  navigationRoutes,
  userRoutes,
  developerRoutes,
} from "./config/routes";

// Dashboard utilities
import { createImportSuccessHandler } from "./utils/dashboardHandlers";

export default function App() {
  const [dashboardKey, setDashboardKey] = useState(0);

  // Initialize dashboard handlers
  const handleImportSuccess =
    createImportSuccessHandler(setDashboardKey);
  const coreRoutes = getCoreRoutes(handleImportSuccess);

  // Initialize D'Busana Dashboard with graceful fallback
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Show startup information with backend status
        await showStartupInfo();
        
        // Ensure graceful fallback is ready
        await backendGracefulFallback.ensureFallbackMode();
        
      } catch (error) {
        // Fallback to basic startup
        console.log('🏪 D\'Busana Dashboard - Initialized successfully');
      }
    };
    
    initializeDashboard();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ImportDataProvider>
            <SalesProvider>
              <Router>
              <DashboardLayout>
                <Routes>
                {/* Main Dashboard */}
                <Route
                  path="/dashboard"
                  element={<DashboardWrapper />}
                />

                {/* Core Business Features */}
                {coreRoutes.map(({ path, element }) => (
                  <Route
                    key={path}
                    path={path}
                    element={element}
                  />
                ))}

                {/* Analytics & Reports */}
                {analyticsRoutes.map(({ path, element }) => (
                  <Route
                    key={path}
                    path={path}
                    element={element}
                  />
                ))}

                {/* Advertising Management */}
                {advertisingRoutes.map(({ path, element }) => (
                  <Route
                    key={path}
                    path={path}
                    element={element}
                  />
                ))}

                {/* Business Forecasting */}
                {forecastingRoutes.map(({ path, element }) => (
                  <Route
                    key={path}
                    path={path}
                    element={element}
                  />
                ))}

                {/* Cash Flow Management */}
                {cashFlowRoutes.map(({ path, element }) => (
                  <Route
                    key={path}
                    path={path}
                    element={element}
                  />
                ))}

                {/* Additional Features */}
                {placeholderRoutes.map(({ path, element }) => (
                  <Route
                    key={path}
                    path={path}
                    element={element}
                  />
                ))}

                {/* User Management */}
                {userRoutes.map(({ path, element }) => (
                  <Route
                    key={path}
                    path={path}
                    element={element}
                  />
                ))}

                {/* Developer & Admin Tools */}
                {developerRoutes.map(({ path, element }) => (
                  <Route
                    key={path}
                    path={path}
                    element={element}
                  />
                ))}

                {/* Navigation & Settings */}
                {navigationRoutes.map(({ path, element }) => (
                  <Route
                    key={path}
                    path={path}
                    element={element}
                  />
                ))}
                </Routes>
              </DashboardLayout>
            </Router>
            </SalesProvider>
          </ImportDataProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}