/**
 * D'Busana Dashboard Startup Guide
 * Provides information about running the dashboard with or without backend
 */

export interface StartupInfo {
  mode: 'live' | 'demo';
  dataSource: string;
  features: string[];
  limitations?: string[];
  instructions?: string[];
}

export class DashboardStartupGuide {
  static getStartupInfo(backendAvailable: boolean): StartupInfo {
    if (backendAvailable) {
      return {
        mode: 'live',
        dataSource: 'PostgreSQL Database',
        features: [
          'Real business data from database',
          'Data import functionality',
          'Full CRUD operations',
          'Live analytics and reporting',
          'Activity logging',
          'Complete business intelligence'
        ]
      };
    }

    return {
      mode: 'demo',
      dataSource: 'Generated Demo Data',
      features: [
        'Realistic sample business data',
        'Full UI/UX functionality',
        'Interactive charts and analytics',
        'Complete dashboard experience',
        'Perfect for demos and testing'
      ],
      limitations: [
        'Data changes are not persisted',
        'No real import functionality',
        'Generated data refreshes on reload'
      ],
      instructions: [
        'To use real data, start the backend server:',
        '1. Navigate to backend folder: cd backend',
        '2. Install dependencies: npm install',
        '3. Set up database: npm run migrate',
        '4. Start server: npm start',
        '5. Refresh dashboard'
      ]
    };
  }

  static formatBackendUrl(): string {
    return 'http://localhost:3001';
  }

  static getQuickStartCommands(): string[] {
    return [
      'cd backend',
      'npm install',
      'npm run migrate',
      'npm start'
    ];
  }

  static getDashboardFeatures(): string[] {
    return [
      'Multi-marketplace analytics',
      'Sales performance tracking',
      'ROI analysis and advertising metrics',
      'Inventory management',
      'Customer analytics',
      'Financial reporting',
      'Business forecasting',
      'Activity monitoring'
    ];
  }
}

export const startupGuide = DashboardStartupGuide;