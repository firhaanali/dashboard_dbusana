import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Database, 
  RefreshCw, 
  Info,
  CheckCircle,
  AlertCircle,
  X,
  HelpCircle
} from 'lucide-react';
import { checkBackendAvailability } from '../../utils/quickBackendFix';
import BackendSetupGuide from './BackendSetupGuide';

interface BackendStatusMessageProps {
  showOnlyWhenOffline?: boolean;
  dismissible?: boolean;
}

const BackendStatusMessage: React.FC<BackendStatusMessageProps> = ({
  showOnlyWhenOffline = true,
  dismissible = true
}) => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const isAvailable = await checkBackendAvailability();
      setStatus(isAvailable ? 'online' : 'offline');
    } catch (error) {
      setStatus('offline');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Check every 60 seconds
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Don't show if dismissed
  if (isDismissed) return null;

  // Don't show if online and configured to only show when offline
  if (status === 'online' && showOnlyWhenOffline) return null;

  // Don't show if still checking initially
  if (status === 'checking') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          title: 'Database Connected',
          message: 'Dashboard menggunakan data real dari database PostgreSQL',
          badgeText: 'Online',
          badgeVariant: 'default' as const,
          cardClass: 'border-green-200 bg-green-50 dark:bg-green-950/20'
        };
      case 'offline':
        return {
          icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
          title: 'Fallback Data Active',
          message: 'Dashboard menggunakan fallback data. Untuk data real-time, pastikan backend server berjalan.',
          badgeText: 'Fallback',
          badgeVariant: 'secondary' as const,
          cardClass: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'
        };
      default:
        return {
          icon: <Database className="h-4 w-4 text-blue-500" />,
          title: 'Checking Connection',
          message: 'Memeriksa koneksi database...',
          badgeText: 'Checking',
          badgeVariant: 'outline' as const,
          cardClass: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`${config.cardClass} shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {config.icon}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-sm">{config.title}</h4>
                <Badge variant={config.badgeVariant} className="text-xs">
                  {config.badgeText}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {config.message}
              </p>
              
              {status === 'offline' && (
                <div className="mt-2 space-y-2">
                  <div className="text-xs text-gray-500">
                    <p>💡 Tip: Start backend server dengan <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">cd backend && npm start</code></p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSetupGuide(true)}
                    className="h-7 text-xs"
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Setup Guide
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={checkStatus}
              disabled={isChecking}
              className="h-7 w-7 p-0"
              title="Check connection"
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
            </Button>
            
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="h-7 w-7 p-0"
                title="Dismiss"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Setup Guide Modal */}
      {showSetupGuide && (
        <BackendSetupGuide onClose={() => setShowSetupGuide(false)} />
      )}
    </Card>
  );
};

export default BackendStatusMessage;