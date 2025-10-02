import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { DashboardSidebar } from '../DashboardSidebar';
import { DashboardHeader } from '../DashboardHeader';
import { useTheme } from '../../contexts/ThemeContext';


interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop sidebar collapse state
  const location = useLocation();
  const { actualTheme } = useTheme();

  // Get current page from URL path
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    return path.substring(1); // Remove leading slash
  };

  // Add smooth theme transition effects
  useEffect(() => {
    document.documentElement.style.setProperty('color-scheme', actualTheme);
  }, [actualTheme]);

  return (
    <div className={`
      h-screen bg-background flex overflow-hidden transition-colors duration-300 ease-in-out
      ${actualTheme === 'dark' ? 'dark' : ''}
    `}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className={`
            fixed inset-0 z-20 lg:hidden transition-opacity duration-300
            ${actualTheme === 'dark' 
              ? 'bg-black/70 backdrop-blur-sm' 
              : 'bg-black/50 backdrop-blur-sm'
            }
          `}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'}
        ${actualTheme === 'dark' ? 'shadow-2xl shadow-black/30' : 'shadow-xl shadow-gray-200/50'}
      `}>
        <DashboardSidebar activePage={getCurrentPage()} collapsed={sidebarCollapsed} />
      </div>
      
      {/* Main Content Container */}
      <div className={`
        flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'lg:ml-0' : ''}
      `}>
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-20 left-4 z-40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`
              shadow-lg border transition-all duration-200 hover:scale-105
              ${actualTheme === 'dark' 
                ? 'bg-card border-border hover:bg-accent shadow-black/20' 
                : 'bg-white border-gray-200 hover:bg-gray-50 shadow-gray-200/50'
              }
            `}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Header */}
        <DashboardHeader />
        
        {/* Desktop Sidebar Toggle Button */}
        <div className="hidden lg:block fixed top-4 z-40 transition-all duration-300" style={{
          left: sidebarCollapsed ? '1rem' : '17rem'
        }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`
              shadow-lg border transition-all duration-200 hover:scale-105 hover:shadow-xl
              ${actualTheme === 'dark' 
                ? 'bg-card border-border hover:bg-accent shadow-black/20' 
                : 'bg-white border-gray-200 hover:bg-gray-50 shadow-gray-200/50'
              }
            `}
            title={sidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
          >
            {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Main Content */}
        <main className={`
          flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto 
          bg-background transition-colors duration-300 ease-in-out
          ${actualTheme === 'dark' ? 'scrollbar-dark' : 'scrollbar-light'}
        `}>
          {children}
        </main>
      </div>
    </div>
  );
}