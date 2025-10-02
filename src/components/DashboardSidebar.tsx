import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useTheme } from '../contexts/ThemeContext';
import dbusanaLogo from 'figma:asset/e8b6fff0f467edb21198114a8e47e56f63632a02.png';
import { 
  BarChart3, 
  Upload, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Megaphone, 
  Zap, 
  FileBarChart, 
  Settings,
  User,
  Users,
  Receipt,
  Boxes,
  Tags,
  Building2,
  Truck,
  Target,
  Brain,
  ChevronRight,
  ChevronDown,
  Activity,
  Shield,
  UserCog,
  Calculator,
  RefreshCcw,
  HandCoins,
  Gift,
} from 'lucide-react';

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  submenu?: MenuItem[];
  active?: boolean;
  route?: string;
  onClick?: () => void;
  important?: boolean;
}

interface DashboardSidebarProps {
  className?: string;
  activePage?: string;
  collapsed?: boolean;
}

const menuItems = (navigate: (route: string) => void, activePage?: string): MenuItem[] => [
  { 
    icon: BarChart3, 
    label: 'Dashboard', 
    route: '/dashboard',
    active: activePage === 'dashboard',
    onClick: () => navigate('/dashboard')
  },
  { 
    icon: Upload, 
    label: 'Import Data',
    route: '/import-data',
    active: activePage === 'import-data',
    onClick: () => navigate('/import-data')
  },
  { 
    icon: ShoppingCart, 
    label: 'Sales Management',
    route: '/sales',
    active: activePage === 'sales' || activePage === 'customers' || activePage === 'invoices',
    onClick: () => navigate('/sales'),
    submenu: [
      { icon: Receipt, label: 'Sales Management', route: '/sales', onClick: () => navigate('/sales') },
      { icon: Users, label: 'Customer Management', route: '/customers', onClick: () => navigate('/customers') },
      { icon: FileText, label: 'Invoice & Receipt', route: '/invoices', onClick: () => navigate('/invoices') }
    ]
  },
  { 
    icon: Package, 
    label: 'Products',
    route: '/products',
    active: activePage === 'products' || activePage === 'categories' || activePage === 'brands' || activePage?.startsWith('products/'),
    onClick: () => navigate('/products'),
    submenu: [
      { icon: Boxes, label: 'Master Produk', route: '/products', onClick: () => navigate('/products') },
      { icon: BarChart3, label: 'Stock Management', route: '/stock', onClick: () => navigate('/stock') },
      { icon: Tags, label: 'Kategori Produk', route: '/categories', onClick: () => navigate('/categories') },
      { icon: Building2, label: 'Brand Management', route: '/brands', onClick: () => navigate('/brands') }
    ]
  },

  { 
    icon: Truck, 
    label: 'Supplier',
    route: '/suppliers',
    active: activePage === 'suppliers' || activePage?.startsWith('supplier'),
    onClick: () => navigate('/suppliers')
  },
  { 
    icon: DollarSign, 
    label: 'Cash Flow',
    route: '/cash-flow',
    active: activePage === 'cash-flow' || activePage === 'affiliate-endorse' || activePage === 'profit-reinvestment' || activePage?.startsWith('cash-flow/'),
    onClick: () => navigate('/cash-flow'),
    submenu: [
      { icon: Activity, label: 'Cash Flow Dashboard', route: '/cash-flow', onClick: () => navigate('/cash-flow') },
      { icon: DollarSign, label: 'Cash Flow Management', route: '/cash-flow/management', onClick: () => navigate('/cash-flow/management') },
      { icon: Zap, label: 'Profit Reinvestment', route: '/profit-reinvestment', onClick: () => navigate('/profit-reinvestment') },
      { icon: Users, label: 'Affiliate Endorse', route: '/affiliate-endorse', onClick: () => navigate('/affiliate-endorse') }
    ]
  },

  { 
    icon: RefreshCcw, 
    label: 'Transaction Management',
    route: '/returns-cancellations',
    active: activePage === 'returns-cancellations' || activePage === 'marketplace-reimbursements' || activePage === 'commission-adjustments' || activePage === 'affiliate-samples',
    onClick: () => navigate('/returns-cancellations'),
    submenu: [
      { icon: TrendingDown, label: 'Returns & Cancellations', route: '/returns-cancellations', onClick: () => navigate('/returns-cancellations') },
      { icon: HandCoins, label: 'Marketplace Reimbursement', route: '/marketplace-reimbursements', onClick: () => navigate('/marketplace-reimbursements') },
      { icon: TrendingDown, label: 'Commission Adjustments', route: '/commission-adjustments', onClick: () => navigate('/commission-adjustments') },
      { icon: Gift, label: 'Affiliate Samples', route: '/affiliate-samples', onClick: () => navigate('/affiliate-samples') }
    ]
  },

  { 
    icon: TrendingUp, 
    label: 'Analytics',
    route: '/analytics',
    active: activePage === 'analytics' || activePage === 'product-analytics' || activePage === 'strategic-analytics',
    onClick: () => navigate('/analytics'),
    submenu: [
      { icon: BarChart3, label: 'Sales Analytics', route: '/analytics', onClick: () => navigate('/analytics') },
      { icon: Target, label: 'Product Analytics', route: '/product-analytics', onClick: () => navigate('/product-analytics') },
      { icon: Brain, label: 'Strategic Analytics', route: '/strategic-analytics', onClick: () => navigate('/strategic-analytics') }
    ]
  },
  { 
    icon: Megaphone, 
    label: 'Advertising',
    route: '/advertising',
    active: activePage === 'advertising' || activePage === 'tiktok-commission-calculator',
    onClick: () => navigate('/advertising'),
    submenu: [
      { icon: Megaphone, label: 'Advertising Dashboard', route: '/advertising', onClick: () => navigate('/advertising') },
      { icon: Calculator, label: 'TikTok Commission Calculator', route: '/tiktok-commission-calculator', onClick: () => navigate('/tiktok-commission-calculator') }
    ]
  },
  { 
    icon: Brain, 
    label: 'AI Forecasting',
    route: '/forecasting',
    active: activePage === 'forecasting' || activePage === 'stock-forecasting',
    onClick: () => navigate('/forecasting'),
    submenu: [
      { icon: TrendingUp, label: 'Sales Forecasting', route: '/forecasting', onClick: () => navigate('/forecasting') },
      { icon: Boxes, label: 'Stock Forecasting', route: '/stock-forecasting', onClick: () => navigate('/stock-forecasting') }
    ]
  },
  { 
    icon: FileBarChart, 
    label: 'Reports',
    route: '/reports',
    active: activePage === 'reports',
    onClick: () => navigate('/reports')
  },
  { 
    icon: Activity, 
    label: 'Activity Logs',
    route: '/activities',
    active: activePage === 'activities',
    onClick: () => navigate('/activities')
  },
  { 
    icon: Settings, 
    label: 'Settings',
    route: '/settings',
    active: activePage === 'settings' || activePage === 'system-status' || activePage === 'profile' || activePage === 'user-settings' || activePage === 'account-settings' || activePage === 'user-management',
    onClick: () => navigate('/settings'),
    submenu: [
      { icon: Activity, label: 'System Status', route: '/system-status', onClick: () => navigate('/system-status') },
      { icon: UserCog, label: 'Manajemen User', route: '/user-management', onClick: () => navigate('/user-management') },
      { icon: Settings, label: 'Pengaturan Aplikasi', route: '/user-settings', onClick: () => navigate('/user-settings') },
      { icon: User, label: 'Profil Pengguna', route: '/profile', onClick: () => navigate('/profile') },
      { icon: Shield, label: 'Keamanan Akun', route: '/account-settings', onClick: () => navigate('/account-settings') }
    ]
  }
];

export function DashboardSidebar({ className, activePage, collapsed = false }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { actualTheme } = useTheme();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  // Auto-expand parent menu if current route is in submenu
  React.useEffect(() => {
    const currentPath = location.pathname;
    const items = menuItems(navigate, activePage);
    
    items.forEach(item => {
      if (item.submenu) {
        const hasActiveSubmenu = item.submenu.some(subItem => 
          subItem.route === currentPath
        );
        if (hasActiveSubmenu && !expandedItems.includes(item.label)) {
          setExpandedItems(prev => [...prev, item.label]);
        }
      }
    });
  }, [location.pathname, activePage, expandedItems, navigate]);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const isCurrentRoute = item.route === location.pathname;
    const isParentLevel = depth === 0;

    // Don't render submenus when collapsed
    if (collapsed && depth > 0) {
      return null;
    }

    // Create Link or div based on whether item has route and no submenu
    const shouldUseLink = item.route && (!hasSubmenu || collapsed);
    
    const baseClassName = cn(
      // Base styles
      "group flex items-center gap-2.5 rounded-lg cursor-pointer transition-colors duration-200 relative",
      // Collapsed styling
      collapsed && isParentLevel && "px-2 py-2 mx-1 justify-center",
      // Normal styling
      !collapsed && [
        "px-3",
        isParentLevel && "py-2 mx-1",
        !isParentLevel && "py-1.5 ml-6 mr-1 text-sm"
      ],
      // Active state
      (isCurrentRoute || item.active) && [
        "bg-primary text-primary-foreground",
        !collapsed && "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-4 before:bg-primary-foreground before:rounded-full"
      ],
      // Important item styling
      !collapsed && item.important && depth > 0 && !isCurrentRoute && !item.active && [
        "bg-amber-50 text-amber-800 border border-amber-200",
        "hover:bg-amber-100 hover:border-amber-300"
      ],
      // Default hover state
      !isCurrentRoute && !item.active && !(item.important && depth > 0) && [
        "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent"
      ]
    );

    const handleClick = (e: React.MouseEvent) => {
      if (hasSubmenu && !collapsed) {
        e.preventDefault();
        toggleExpanded(item.label);
      } else if (item.onClick && !shouldUseLink) {
        item.onClick();
      }
    };

    const renderContent = () => (
      <>
        {/* Icon */}
        <item.icon className={cn(
          "flex-shrink-0",
          isParentLevel ? "w-5 h-5" : "w-4 h-4",
          !collapsed && item.important && depth > 0 && "text-amber-600"
        )} />
        
        {/* Label - only show when not collapsed */}
        {!collapsed && (
          <>
            <span className="flex-1 min-w-0 truncate font-medium">
              {item.label}
            </span>
            
            {/* NEW Badge for important items */}
            {item.important && depth > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 border-amber-300">
                NEW
              </Badge>
            )}
            
            {/* Submenu toggle arrow - always visible for items with submenu */}
            {hasSubmenu && (
              <div className="flex-shrink-0 ml-1.5 transition-all duration-200 hover:bg-sidebar-accent rounded p-0.5">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 text-sidebar-foreground/90" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 text-sidebar-foreground/90" />
                )}
              </div>
            )}
          </>
        )}
      </>
    );

    const menuItemContent = shouldUseLink ? (
      <Link 
        to={item.route!}
        className={baseClassName}
        onClick={handleClick}
      >
        {renderContent()}
      </Link>
    ) : (
      <div 
        className={baseClassName}
        onClick={handleClick}
      >
        {renderContent()}
      </div>
    );

    return (
      <div key={item.label} className="relative">
        {collapsed && isParentLevel ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {menuItemContent}
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          menuItemContent
        )}
        
        {/* Submenu with smooth animation - only show when not collapsed */}
        {hasSubmenu && !collapsed && (
          <div className={cn(
            "overflow-hidden transition-all duration-200 ease-out",
            isExpanded ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="mt-0.5 space-y-0.5 pb-1">
              {item.submenu!.map(subItem => renderMenuItem(subItem, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "bg-sidebar border-r border-sidebar-border flex flex-col h-screen transition-all duration-300",
      collapsed ? "w-16" : "sidebar-container",
      actualTheme === 'dark' 
        ? "shadow-2xl shadow-black/30" 
        : "shadow-lg shadow-gray-200/50",
      className
    )}>
      {/* Logo Header - Fixed at top */}
      <div className={cn(
        "flex items-center gap-3 p-4 flex-shrink-0 border-b border-sidebar-border bg-sidebar/95 backdrop-blur-sm",
        collapsed && "justify-center px-2"
      )}>
        {collapsed ? (
          <div className={cn(
            "w-10 h-10 flex items-center justify-center rounded-xl p-1.5 transition-all duration-200",
            actualTheme === 'dark' 
              ? "bg-gradient-to-br from-gray-800 to-black shadow-lg shadow-black/50" 
              : "bg-gradient-to-br from-gray-900 to-black shadow-lg shadow-gray-900/30"
          )}>
            <img 
              src={dbusanaLogo} 
              alt="D'Busana Logo" 
              className="w-full h-full object-contain filter brightness-110"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-xl p-2 transition-all duration-200",
              actualTheme === 'dark' 
                ? "bg-gradient-to-br from-gray-800 to-black shadow-lg shadow-black/50" 
                : "bg-gradient-to-br from-gray-900 to-black shadow-lg shadow-gray-900/30"
            )}>
              <img 
                src={dbusanaLogo} 
                alt="D'Busana Boutique" 
                className="w-10 h-10 object-contain filter brightness-110"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-sidebar-foreground">D'Busana</span>
              <span className={cn(
                "text-xs transition-colors duration-200",
                actualTheme === 'dark' 
                  ? "text-sidebar-foreground/70" 
                  : "text-sidebar-foreground/60"
              )}>Fashion Dashboard</span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Navigation Area */}
      <ScrollArea className={cn(
        "flex-1 overflow-y-auto sidebar-scroll",
        collapsed ? "px-1" : "px-2"
      )}>
        <nav className="space-y-0.5 py-3">
          {menuItems(navigate, activePage).map(item => renderMenuItem(item))}
        </nav>
      </ScrollArea>

      {/* User Profile Section - Fixed at bottom */}
      <div className={cn(
        "flex-shrink-0 p-3 border-t border-sidebar-border bg-sidebar/95 backdrop-blur-sm",
        collapsed && "p-2"
      )}>
        <Link 
          to="/profile"
          className={cn(
            "flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-200 cursor-pointer group",
            "hover:bg-sidebar-accent hover:scale-[1.02]",
            collapsed && "justify-center p-2"
          )}
          title={collapsed ? "D'Busana Admin" : undefined}
        >
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center p-1 transition-all duration-200",
            "group-hover:shadow-lg",
            actualTheme === 'dark' 
              ? "bg-gradient-to-br from-gray-800 to-black shadow-md shadow-black/50" 
              : "bg-gradient-to-br from-gray-900 to-black shadow-md shadow-gray-900/30"
          )}>
            <img 
              src={dbusanaLogo} 
              alt="D'Busana Admin" 
              className="w-full h-full object-contain filter brightness-110"
            />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">D'Busana Admin</p>
                <p className={cn(
                  "text-xs truncate transition-colors duration-200",
                  actualTheme === 'dark' 
                    ? "text-sidebar-foreground/70" 
                    : "text-sidebar-foreground/60"
                )}>admin@dbusana.com</p>
              </div>
              <User className={cn(
                "w-4 h-4 transition-colors duration-200",
                actualTheme === 'dark' 
                  ? "text-sidebar-foreground/50" 
                  : "text-sidebar-foreground/40"
              )} />
            </>
          )}
        </Link>
      </div>
    </div>
  );
}