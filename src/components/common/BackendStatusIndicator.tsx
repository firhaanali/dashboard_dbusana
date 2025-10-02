import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { checkBackendAvailability } from '../../utils/quickBackendFix';

interface BackendStatusIndicatorProps {
  showInProduction?: boolean;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  compact?: boolean;
}

const BackendStatusIndicator: React.FC<BackendStatusIndicatorProps> = ({
  showInProduction = false,
  position = 'bottom-right',
  compact = true
}) => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const isAvailable = await checkBackendAvailability();
      setStatus(isAvailable ? 'online' : 'offline');
      setLastChecked(new Date());
    } catch (error) {
      setStatus('offline');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isChecking || status === 'checking') {
      return <Clock className="h-3 w-3 animate-spin" />;
    }
    return status === 'online' ? 
      <CheckCircle className="h-3 w-3" /> : 
      <AlertCircle className="h-3 w-3" />;
  };

  const getStatusColor = () => {
    if (isChecking || status === 'checking') return 'bg-blue-500';
    return status === 'online' ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    if (isChecking || status === 'checking') return 'Checking...';
    return status === 'online' ? 'Backend Online' : 'Backend Offline';
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4'
  };

  if (compact) {
    return (
      <div 
        className={`fixed ${positionClasses[position]} z-50 flex items-center space-x-2`}
        title={`${getStatusText()} - Last checked: ${lastChecked.toLocaleTimeString()}`}
      >
        <Badge 
          variant="outline" 
          className={`flex items-center space-x-1 ${getStatusColor()} text-white border-transparent`}
        >
          {getStatusIcon()}
          <span className="text-xs">{status === 'online' ? 'DB' : 'Offline'}</span>
        </Badge>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={checkStatus}
          disabled={isChecking}
          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
          title="Check backend status"
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        
        <div className="text-xs text-gray-500 mb-2">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={checkStatus}
          disabled={isChecking}
          className="w-full"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
          Check Status
        </Button>
        
        {status === 'offline' && (
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-300">
            <p>Using demo data. Start backend server for real data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackendStatusIndicator;