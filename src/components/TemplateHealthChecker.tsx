import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface TemplateHealth {
  template: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time?: string;
  size?: number;
  error?: string;
  details: string;
}

interface TemplateHealthData {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  healthy_templates: number;
  total_templates: number;
  checks: TemplateHealth[];
  timestamp: string;
}

interface Template {
  name: string;
  filename: string;
  description: string;
  endpoint: string;
  status: string;
  health: string;
}

export function TemplateHealthChecker() {
  const [healthData, setHealthData] = useState<TemplateHealthData | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch health check and templates list
      const [healthResponse, templatesResponse] = await Promise.all([
        fetch('/api/templates-enhanced/health'),
        fetch('/api/templates-enhanced/')
      ]);

      if (healthResponse.ok) {
        const healthResult = await healthResponse.json();
        if (healthResult.success) {
          setHealthData(healthResult.data);
        }
      }

      if (templatesResponse.ok) {
        const templatesResult = await templatesResponse.json();
        if (templatesResult.success) {
          setTemplates(templatesResult.data.templates);
        }
      }

    } catch (error) {
      console.error('Error fetching template health:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async (endpoint: string, filename: string) => {
    try {
      console.log(`📋 Downloading template: ${filename}`);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');

      if (!contentType?.includes('spreadsheetml') && !contentType?.includes('excel')) {
        console.warn('⚠️ Unexpected content type:', contentType);
      }

      if (contentLength && parseInt(contentLength) < 1000) {
        throw new Error(`File too small (${contentLength} bytes), likely corrupted`);
      }

      const blob = await response.blob();

      if (blob.size < 1000) {
        throw new Error(`Downloaded file too small (${blob.size} bytes), likely corrupted`);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Template ${filename} berhasil didownload`, {
        description: `Size: ${(blob.size / 1024).toFixed(1)} KB`
      });

    } catch (error) {
      console.error(`Error downloading ${filename}:`, error);
      toast.error(`Gagal download ${filename}`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'unhealthy': return <Badge variant="destructive">Unhealthy</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Checking template health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Template Health Monitor</h2>
          <p className="text-muted-foreground">Monitor status dan kesehatan template generation</p>
        </div>
        <Button onClick={fetchHealthData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Health Status */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(healthData.overall_status)}
              Overall Template Health
            </CardTitle>
            <CardDescription>
              {healthData.healthy_templates}/{healthData.total_templates} templates are healthy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(healthData.overall_status)}
              <span className="text-sm text-muted-foreground">
                Last checked: {new Date(healthData.timestamp).toLocaleString('id-ID')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Template Health */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle>Template Status Details</CardTitle>
            <CardDescription>Individual health check results for each template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthData.checks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <h4 className="font-medium">{check.template}</h4>
                      <p className="text-sm text-muted-foreground">{check.details}</p>
                      {check.error && (
                        <p className="text-sm text-red-600 mt-1">Error: {check.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {check.response_time && (
                      <span className="text-xs text-muted-foreground">{check.response_time}</span>
                    )}
                    {check.size && (
                      <span className="text-xs text-muted-foreground">
                        {(check.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                    {getStatusBadge(check.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Downloads */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Templates</CardTitle>
            <CardDescription>Download templates for data import</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    {getStatusBadge(template.health)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <Button
                    onClick={() => handleDownloadTemplate(template.endpoint, template.filename)}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {template.filename}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to fetch template health data: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Template Usage Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p><strong>Cara menggunakan template:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Download template yang sesuai dengan jenis data yang ingin diimport</li>
              <li>Buka file Excel dan isi data sesuai format yang tertera</li>
              <li>Perhatikan tab "Instructions" untuk panduan detail</li>
              <li>Pastikan format tanggal menggunakan YYYY-MM-DD</li>
              <li>Angka tidak boleh menggunakan koma atau titik sebagai pemisah ribuan</li>
              <li>Field yang wajib diisi (required) harus ada nilainya</li>
              <li>Save file dan upload melalui fitur Import Data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}