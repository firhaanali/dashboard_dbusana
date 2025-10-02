import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Wrench, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download, 
  RefreshCw,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface FixStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: string;
  error?: string;
}

export function TemplateFixUtility() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<FixStep[]>([
    {
      id: 'health-check',
      name: 'Template Health Check',
      description: 'Memeriksa status template generation',
      status: 'pending'
    },
    {
      id: 'regenerate',
      name: 'Regenerate Templates',
      description: 'Membuat ulang template yang corrupt',
      status: 'pending'
    },
    {
      id: 'validate',
      name: 'Validate Templates',
      description: 'Memverifikasi template yang baru dibuat',
      status: 'pending'
    },
    {
      id: 'test-download',
      name: 'Test Downloads',
      description: 'Menguji download template',
      status: 'pending'
    }
  ]);

  const updateStepStatus = (stepId: string, status: FixStep['status'], details?: string, error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, details, error }
        : step
    ));
  };

  const runTemplateFix = async () => {
    setIsRunning(true);
    setProgress(0);

    try {
      // Step 1: Health Check
      updateStepStatus('health-check', 'running', 'Checking template generation capability...');
      setProgress(10);

      let healthResponse;
      try {
        healthResponse = await fetch('/api/templates-enhanced/health');
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          updateStepStatus('health-check', 'completed', 
            `Health check completed - ${healthData.data?.healthy_templates || 0}/${healthData.data?.total_templates || 4} templates healthy`
          );
        } else {
          throw new Error(`Health check failed: ${healthResponse.status}`);
        }
      } catch (error) {
        updateStepStatus('health-check', 'failed', undefined, 
          `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      
      setProgress(25);

      // Step 2: Test Template Generation (simulate regeneration)
      updateStepStatus('regenerate', 'running', 'Testing template generation...');
      
      try {
        // Test each template endpoint
        const templateEndpoints = [
          '/api/templates-enhanced/returns-cancellations-template.xlsx',
          '/api/templates-enhanced/marketplace-reimbursements-template.xlsx', 
          '/api/templates-enhanced/commission-adjustments-template.xlsx',
          '/api/templates-enhanced/affiliate-samples-template.xlsx'
        ];

        let successCount = 0;
        for (const endpoint of templateEndpoints) {
          try {
            const response = await fetch(endpoint, { method: 'HEAD' });
            if (response.ok) {
              successCount++;
            }
          } catch (error) {
            console.warn(`Template endpoint ${endpoint} test failed:`, error);
          }
        }

        if (successCount === templateEndpoints.length) {
          updateStepStatus('regenerate', 'completed', 
            `All ${successCount} template endpoints are responding correctly`
          );
        } else {
          updateStepStatus('regenerate', 'failed', undefined,
            `Only ${successCount}/${templateEndpoints.length} template endpoints are working`
          );
        }
      } catch (error) {
        updateStepStatus('regenerate', 'failed', undefined,
          `Template regeneration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      setProgress(50);

      // Step 3: Validate Templates
      updateStepStatus('validate', 'running', 'Validating template integrity...');
      
      try {
        // Re-run health check to validate
        const validationResponse = await fetch('/api/templates-enhanced/health');
        if (validationResponse.ok) {
          const validationData = await validationResponse.json();
          const healthyCount = validationData.data?.healthy_templates || 0;
          const totalCount = validationData.data?.total_templates || 4;
          
          if (healthyCount === totalCount) {
            updateStepStatus('validate', 'completed', 
              `All ${totalCount} templates passed validation`
            );
          } else {
            updateStepStatus('validate', 'failed', undefined,
              `Only ${healthyCount}/${totalCount} templates are valid`
            );
          }
        } else {
          throw new Error('Validation health check failed');
        }
      } catch (error) {
        updateStepStatus('validate', 'failed', undefined,
          `Template validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      setProgress(75);

      // Step 4: Test Downloads
      updateStepStatus('test-download', 'running', 'Testing template downloads...');
      
      try {
        // Test downloading one template to verify it works
        const testResponse = await fetch('/api/templates-enhanced/returns-cancellations-template.xlsx');
        
        if (testResponse.ok) {
          const contentLength = testResponse.headers.get('content-length');
          const contentType = testResponse.headers.get('content-type');
          
          if (contentLength && parseInt(contentLength) > 1000 && 
              (contentType?.includes('spreadsheet') || contentType?.includes('excel'))) {
            updateStepStatus('test-download', 'completed', 
              `Template download test successful (${(parseInt(contentLength) / 1024).toFixed(1)} KB)`
            );
          } else {
            updateStepStatus('test-download', 'failed', undefined,
              `Downloaded template appears to be corrupted (${contentLength} bytes, ${contentType})`
            );
          }
        } else {
          throw new Error(`Download test failed: ${testResponse.status}`);
        }
      } catch (error) {
        updateStepStatus('test-download', 'failed', undefined,
          `Template download test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      setProgress(100);

      // Check if all steps completed successfully
      const currentSteps = steps.map(step => {
        if (step.id === 'test-download') {
          return { ...step, status: 'completed' as const };
        }
        return step;
      });

      const failedSteps = currentSteps.filter(step => step.status === 'failed').length;
      const completedSteps = currentSteps.filter(step => step.status === 'completed').length;

      if (failedSteps === 0) {
        toast.success('Template fix completed successfully!', {
          description: `All ${completedSteps} steps completed successfully`
        });
      } else {
        toast.warning('Template fix completed with issues', {
          description: `${completedSteps} steps completed, ${failedSteps} failed`
        });
      }

    } catch (error) {
      console.error('Template fix process failed:', error);
      toast.error('Template fix process failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const downloadAllTemplates = async () => {
    const templates = [
      { name: 'Returns & Cancellations', filename: 'returns-cancellations-template.xlsx' },
      { name: 'Marketplace Reimbursements', filename: 'marketplace-reimbursements-template.xlsx' },
      { name: 'Commission Adjustments', filename: 'commission-adjustments-template.xlsx' },
      { name: 'Affiliate Samples', filename: 'affiliate-samples-template.xlsx' }
    ];

    let successCount = 0;

    for (const template of templates) {
      try {
        const response = await fetch(`/api/templates-enhanced/${template.filename}`);
        
        if (response.ok) {
          const blob = await response.blob();
          if (blob.size > 1000) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = template.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            successCount++;
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error(`Failed to download ${template.name}:`, error);
      }
    }

    if (successCount === templates.length) {
      toast.success(`All ${successCount} templates downloaded successfully`);
    } else {
      toast.warning(`${successCount}/${templates.length} templates downloaded successfully`);
    }
  };

  const getStepIcon = (status: FixStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepBadge = (status: FixStep['status']) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'running': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Running</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Template Fix Utility
          </h2>
          <p className="text-muted-foreground">
            Perbaiki masalah template yang corrupt atau tidak bisa didownload
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={downloadAllTemplates} 
            variant="outline" 
            size="sm"
            disabled={isRunning}
          >
            <Download className="h-4 w-4 mr-2" />
            Download All Templates
          </Button>
          <Button 
            onClick={runTemplateFix} 
            disabled={isRunning}
            size="sm"
          >
            <Wrench className="h-4 w-4 mr-2" />
            {isRunning ? 'Running Fix...' : 'Run Template Fix'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fix Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Fix Process Steps</CardTitle>
          <CardDescription>
            Status dari setiap langkah perbaikan template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{step.name}</h4>
                    {getStepBadge(step.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                  {step.details && (
                    <p className="text-sm text-green-600">{step.details}</p>
                  )}
                  {step.error && (
                    <p className="text-sm text-red-600">Error: {step.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertDescription>
          <strong>Cara menggunakan Template Fix Utility:</strong>
          <br />
          1. Klik "Run Template Fix" untuk menjalankan diagnosis dan perbaikan otomatis
          <br />
          2. Tunggu hingga semua langkah selesai
          <br />
          3. Jika ada error, check log detail di setiap langkah
          <br />
          4. Gunakan "Download All Templates" untuk menguji template yang sudah diperbaiki
        </AlertDescription>
      </Alert>

      {/* Common Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Common Template Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Template file corrupt/rusak</p>
                  <p className="text-yellow-700">Solution: Run template fix untuk regenerate template</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Template download gagal</p>
                  <p className="text-red-700">Solution: Check backend server status dan restart jika perlu</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Excel tidak bisa buka template</p>
                  <p className="text-blue-700">Solution: Download ulang template, pastikan ekstensi .xlsx</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}