import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Database, 
  Server, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  BACKEND_TROUBLESHOOTING_STEPS, 
  BACKEND_COMMON_ERRORS,
  checkBackendRequirements 
} from '../../utils/backendConnectionGuide';
import { checkBackendAvailability } from '../../utils/quickBackendFix';

interface BackendSetupGuideProps {
  onClose?: () => void;
}

const BackendSetupGuide: React.FC<BackendSetupGuideProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [requirements, setRequirements] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const checkRequirements = async () => {
    setChecking(true);
    try {
      const [reqs, status] = await Promise.all([
        checkBackendRequirements(),
        checkBackendAvailability()
      ]);
      
      setRequirements(reqs);
      setBackendStatus(status ? 'online' : 'offline');
    } catch (error) {
      setBackendStatus('offline');
    } finally {
      setChecking(false);
    }
  };

  React.useEffect(() => {
    checkRequirements();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const CommandBlock = ({ commands }: { commands: string[] }) => (
    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
      {commands.map((cmd, index) => (
        <div key={index} className="flex items-center justify-between group">
          <span className="flex-1">
            {cmd.startsWith('#') ? (
              <span className="text-gray-500">{cmd}</span>
            ) : (
              <span>$ {cmd}</span>
            )}
          </span>
          {!cmd.startsWith('#') && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 ml-2"
              onClick={() => copyToClipboard(cmd)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );

  const RequirementCheck = ({ label, status, description }: { 
    label: string; 
    status: boolean | null; 
    description: string;
  }) => (
    <div className="flex items-center justify-between p-3 border rounded">
      <div className="flex items-center space-x-3">
        {status === null ? (
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
        ) : status ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
      </div>
      <Badge variant={status === null ? 'outline' : status ? 'default' : 'destructive'}>
        {status === null ? 'Checking' : status ? 'OK' : 'Error'}
      </Badge>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Backend Setup Guide</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Setup D'Busana backend server untuk menggunakan data real
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={backendStatus === 'online' ? 'default' : 'secondary'}>
              {backendStatus === 'checking' ? 'Checking...' : 
               backendStatus === 'online' ? 'Connected' : 'Offline'}
            </Badge>
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <Tabs defaultValue="quick-start" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quick-start">Quick Start</TabsTrigger>
              <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="errors">Common Errors</TabsTrigger>
            </TabsList>

            <TabsContent value="quick-start" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Terminal className="h-4 w-4" />
                      <span>Start Backend Server</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Jalankan perintah berikut di terminal:
                    </p>
                    
                    <CommandBlock commands={[
                      'cd backend',
                      'npm install',
                      'npm start'
                    ]} />
                    
                    <div className="text-xs text-gray-500">
                      Server akan berjalan di http://localhost:3001
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span>Database Setup</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Pastikan PostgreSQL running:
                    </p>
                    
                    <CommandBlock commands={[
                      '# Check PostgreSQL status',
                      'sudo service postgresql status',
                      '# Start if not running',
                      'sudo service postgresql start'
                    ]} />
                    
                    <div className="text-xs text-gray-500">
                      Database credentials harus dikonfigurasi di backend/.env
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Verification Step
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                        Setelah server berjalan, buka <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">http://localhost:3001/api/status</code> di browser.
                        Jika berhasil, akan muncul pesan JSON dengan "success": true.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open('http://localhost:3001/api/status', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Test API
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="troubleshooting" className="space-y-4">
              <div className="space-y-4">
                {BACKEND_TROUBLESHOOTING_STEPS.map((step, index) => (
                  <Card key={index} className={currentStep === index ? 'ring-2 ring-blue-500' : ''}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Step {index + 1}: {step.title}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStep(currentStep === index ? -1 : index)}
                        >
                          {currentStep === index ? 'Collapse' : 'Expand'}
                        </Button>
                      </CardTitle>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </CardHeader>
                    
                    {currentStep === index && (
                      <CardContent className="space-y-3">
                        <CommandBlock commands={step.commands} />
                        
                        <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200">
                          <div className="text-sm text-green-700 dark:text-green-300">
                            <strong>Expected Result:</strong> {step.expectedResult}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">System Requirements Check</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkRequirements}
                    disabled={checking}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${checking ? 'animate-spin' : ''}`} />
                    Check Again
                  </Button>
                </div>

                <div className="space-y-3">
                  <RequirementCheck
                    label="Node.js & Backend Server"
                    status={requirements?.nodeJs ?? null}
                    description="Backend server running on port 3001"
                  />
                  
                  <RequirementCheck
                    label="NPM Dependencies"
                    status={requirements?.npm ?? null}
                    description="Required Node.js packages installed"
                  />
                  
                  <RequirementCheck
                    label="PostgreSQL Database"
                    status={requirements?.postgresql ?? null}
                    description="Database connection and queries working"
                  />
                  
                  <RequirementCheck
                    label="Port 3001 Available"
                    status={requirements?.port3001Available ?? null}
                    description="Backend API endpoint accessible"
                  />
                </div>

                {requirements && Object.values(requirements).every(req => req === true) && (
                  <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-green-700 dark:text-green-300">
                          All requirements met! Backend is ready.
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              <div className="space-y-4">
                {Object.entries(BACKEND_COMMON_ERRORS).map(([error, info]) => (
                  <Card key={error}>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600 dark:text-red-400">
                        {error}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{info.problem}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="font-medium">Solutions:</h4>
                        <ul className="space-y-1">
                          {info.solutions.map((solution, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{solution}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                💡 Dashboard tetap berfungsi dengan fallback data jika backend belum tersedia
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={checkRequirements}
                  disabled={checking}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${checking ? 'animate-spin' : ''}`} />
                  Recheck Status
                </Button>
                
                {onClose && (
                  <Button onClick={onClose}>
                    Close Guide
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackendSetupGuide;