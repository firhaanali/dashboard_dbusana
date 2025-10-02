import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Database,
  Server,
  Wifi,
  HelpCircle
} from 'lucide-react';

interface SystemCheck {
  name: string;
  status: 'checking' | 'success' | 'error';
  message?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function SystemStatusPage() {
  const [checks, setChecks] = useState<SystemCheck[]>([
    { name: 'Backend Server', status: 'checking', icon: Server },
    { name: 'Database Connection', status: 'checking', icon: Database },
    { name: 'API Endpoints', status: 'checking', icon: Wifi },
  ]);
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runSystemChecks = async () => {
    setIsRefreshing(true);
    setChecks(prev => prev.map(check => ({ ...check, status: 'checking' as const })));

    // Check Backend Server - Try multiple endpoints in order
    try {
      let backendResponse;
      let endpoint = 'health';
      let endpointUrl = 'http://localhost:3001/health';
      
      // Try endpoints in priority order
      const endpointsToTry = [
        { name: 'health', url: 'http://localhost:3001/health' },
        { name: 'api/status', url: 'http://localhost:3001/api/status' },
        { name: 'api', url: 'http://localhost:3001/api' },
        { name: 'api/test/ping', url: 'http://localhost:3001/api/test/ping' }
      ];
      
      let lastError;
      for (const endpointToTry of endpointsToTry) {
        try {
          backendResponse = await fetch(endpointToTry.url, {
            signal: AbortSignal.timeout(5000)
          });
          
          if (backendResponse.ok) {
            endpoint = endpointToTry.name;
            endpointUrl = endpointToTry.url;
            break;
          }
        } catch (err) {
          lastError = err;
          continue;
        }
      }
      
      if (backendResponse && backendResponse.ok) {
        const data = await backendResponse.json();
        setChecks(prev => prev.map(check => 
          check.name === 'Backend Server' 
            ? { 
                ...check, 
                status: 'success', 
                message: `Server operational (${endpoint}) - Port 3001`
              }
            : check
        ));
      } else {
        throw lastError || new Error('All endpoints failed');
      }
    } catch (error) {
      setChecks(prev => prev.map(check => 
        check.name === 'Backend Server' 
          ? { 
              ...check, 
              status: 'error', 
              message: error instanceof Error && error.message.includes('Failed to fetch') 
                ? 'Backend server not running - please start with npm run dev'
                : `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          : check
      ));
    }

    // Check Database Connection
    try {
      const dbResponse = await fetch('http://localhost:3001/api/dashboard/metrics', {
        signal: AbortSignal.timeout(8000)
      });
      
      if (dbResponse.ok) {
        const data = await dbResponse.json();
        setChecks(prev => prev.map(check => 
          check.name === 'Database Connection' 
            ? { ...check, status: 'success', message: 'PostgreSQL connected and responding' }
            : check
        ));
      } else {
        throw new Error(`Database query failed (${dbResponse.status})`);
      }
    } catch (error) {
      setChecks(prev => prev.map(check => 
        check.name === 'Database Connection' 
          ? { 
              ...check, 
              status: 'error', 
              message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          : check
      ));
    }

    // Check API Endpoints
    try {
      const endpoints = [
        { path: '/sales', name: 'Sales API' },
        { path: '/products', name: 'Products API' },
        { path: '/dashboard/metrics', name: 'Dashboard API' }
      ];
      
      let successCount = 0;
      const results: string[] = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://localhost:3001/api${endpoint.path}`, {
            signal: AbortSignal.timeout(5000)
          });
          if (response.ok) {
            successCount++;
            results.push(`✅ ${endpoint.name}`);
          } else {
            results.push(`❌ ${endpoint.name} (${response.status})`);
          }
        } catch (e) {
          results.push(`❌ ${endpoint.name} (unreachable)`);
        }
      }
      
      if (successCount === endpoints.length) {
        setChecks(prev => prev.map(check => 
          check.name === 'API Endpoints' 
            ? { ...check, status: 'success', message: `All ${endpoints.length} API endpoints responding` }
            : check
        ));
      } else if (successCount > 0) {
        setChecks(prev => prev.map(check => 
          check.name === 'API Endpoints' 
            ? { 
                ...check, 
                status: 'error', 
                message: `${successCount}/${endpoints.length} endpoints working`
              }
            : check
        ));
      } else {
        throw new Error('No API endpoints responding');
      }
    } catch (error) {
      setChecks(prev => prev.map(check => 
        check.name === 'API Endpoints' 
          ? { 
              ...check, 
              status: 'error', 
              message: `API endpoints unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          : check
      ));
    }

    setIsRefreshing(false);
  };

  useEffect(() => {
    runSystemChecks();
  }, []);

  const allSystemsGo = checks.every(check => check.status === 'success');
  const hasErrors = checks.some(check => check.status === 'error');

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">System Status</h1>
          <p className="text-muted-foreground">
            Check system connectivity and backend status
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allSystemsGo && (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              All Systems Operational
            </Badge>
          )}
          {hasErrors && (
            <Badge className="bg-red-100 text-red-800 border-red-300">
              Issues Detected
            </Badge>
          )}
          <Button 
            onClick={runSystemChecks}
            disabled={isRefreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking...' : 'Check Status'}
          </Button>
        </div>
      </div>

      {/* System Checks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {checks.map((check) => {
          const IconComponent = check.icon;
          return (
            <Card key={check.name} className={`border-2 ${getStatusColor(check.status)}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <IconComponent className="h-6 w-6" />
                  <h3 className="font-medium">{check.name}</h3>
                  {getStatusIcon(check.status)}
                </div>
                {check.message && (
                  <p className="text-sm opacity-90">{check.message}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Setup Instructions - Only show when needed */}
      {hasErrors && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Backend Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-300 bg-orange-100">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                To access full dashboard features, please start the backend server.
              </AlertDescription>
            </Alert>

            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-3">Backend Setup:</h4>
              
              <div className="space-y-2 text-sm text-orange-800">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-xs">1</span>
                  <span>Open terminal in backend folder</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-xs">2</span>
                  <span>Run: <code className="bg-gray-100 px-1 rounded">npm run dev</code></span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-xs">3</span>
                  <span>Server will start on port 3001</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={runSystemChecks}
                disabled={isRefreshing}
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Check Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {allSystemsGo && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <span>✅ All systems operational! Dashboard is ready to use.</span>
              <Button 
                onClick={() => window.location.href = '/dashboard'} 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Go to Dashboard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}