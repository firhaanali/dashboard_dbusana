import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Settings, 
  X, 
  Database, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import BackendStatusIndicator from './BackendStatusIndicator';
import { checkBackendAvailability } from '../../utils/quickBackendFix';

const DevelopmentTools: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showStatusIndicator, setShowStatusIndicator] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const checkBackend = async () => {
    setBackendStatus('checking');
    try {
      const isAvailable = await checkBackendAvailability();
      setBackendStatus(isAvailable ? 'online' : 'offline');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  React.useEffect(() => {
    checkBackend();
  }, []);

  return (
    <>
      {/* Status Indicator */}
      {showStatusIndicator && (
        <BackendStatusIndicator 
          position="bottom-right" 
          compact={true} 
        />
      )}

      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleVisibility}
        className="fixed bottom-4 left-4 z-50 opacity-60 hover:opacity-100"
        title="Development Tools"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* Development Panel */}
      {isVisible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Development Tools</CardTitle>
              <Button variant="ghost" size="sm" onClick={toggleVisibility}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Backend Status */}
              <div className="space-y-2">
                <h4 className="font-medium">Backend Connection</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {backendStatus === 'checking' ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : backendStatus === 'online' ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {backendStatus === 'checking' ? 'Checking...' : 
                       backendStatus === 'online' ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={checkBackend}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                
                {backendStatus === 'offline' && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-300">
                    <p>Backend server not running. Dashboard uses demo data.</p>
                    <p className="mt-1 font-medium">Start backend: cd backend && npm start</p>
                  </div>
                )}
              </div>

              {/* Status Indicator Toggle */}
              <div className="space-y-2">
                <h4 className="font-medium">UI Elements</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status Indicator</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStatusIndicator(!showStatusIndicator)}
                  >
                    {showStatusIndicator ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hidden
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Environment Info */}
              <div className="space-y-2">
                <h4 className="font-medium">Environment</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Mode:</span>
                    <Badge variant="outline" className="ml-1">
                      {process.env.NODE_ENV || 'development'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-500">Data:</span>
                    <Badge variant="outline" className="ml-1">
                      {backendStatus === 'online' ? 'Real' : 'Demo'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reload
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => console.clear()}
                  >
                    Clear Console
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center pt-2 border-t">
                Development tools only visible in dev mode
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default DevelopmentTools;