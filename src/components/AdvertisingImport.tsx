import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Target,
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { showAdvertisingImportSuccess } from './EnhancedImportToast';
import { preValidateImportFile, formatColumnValidationError, ColumnValidationResult } from '../utils/strictColumnValidator';
import { ColumnValidationErrorDialog } from './ColumnValidationErrorDialog';

interface ImportResult {
  success: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  importedRecords: number;
  errors?: string[];
  batchId?: string;
}

interface AdvertisingImportData {
  campaign_name: string;
  campaign_type: string;
  platform: string;
  ad_group_name?: string;
  keyword?: string;
  ad_creative?: string;
  date_range_start: string;
  date_range_end: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
  marketplace?: string;
  nama_produk?: string; // NEW: For True Business ROI
}

// Sample data template with product names
const sampleData: AdvertisingImportData[] = [
  {
    campaign_name: "Summer Fashion Collection 2024",
    campaign_type: "social",
    platform: "tiktok_ads",
    ad_group_name: "Women Clothing",
    keyword: "dress fashion trendy",
    ad_creative: "Summer Dress Collection Video",
    date_range_start: "2024-06-01",
    date_range_end: "2024-06-30",
    impressions: 15000,
    clicks: 450,
    conversions: 25,
    cost: 750000,
    revenue: 2500000,
    marketplace: "TikTok Shop",
    nama_produk: "Dress Summer Collection" // NEW: Product attribution
  },
  {
    campaign_name: "Ramadan Fashion Collection",
    campaign_type: "search",
    platform: "google_ads",
    ad_group_name: "Muslim Fashion",
    keyword: "baju muslim ramadan",
    ad_creative: "Elegant Ramadan Collection",
    date_range_start: "2024-03-01",
    date_range_end: "2024-04-30",
    impressions: 25000,
    clicks: 800,
    conversions: 60,
    cost: 1200000,
    revenue: 6000000,
    marketplace: "Shopee",
    nama_produk: "Blouse Modern Chic" // NEW: Product attribution
  }
];

// Export untuk ImportPage
export function AdvertisingImportSection({ 
  advertisingImportType, 
  setAdvertisingImportType, 
  onFileUpload, 
  onDownloadTemplate, 
  isUploading 
}: {
  advertisingImportType: 'advertising' | 'settlement';
  setAdvertisingImportType: (type: 'advertising' | 'settlement') => void;
  onFileUpload: (file: File, type: string) => void;
  onDownloadTemplate: (type: string) => void;
  isUploading: boolean;
}) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0], advertisingImportType);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0], advertisingImportType);
    }
  };

  const getRequiredFields = () => {
    if (advertisingImportType === 'settlement') {
      return ['Order ID', 'Type', 'Order Created Time', 'Order Settled Time', 'Settlement Amount', 'Account Name', 'Marketplace', 'Currency'];
    } else {
      return ['Campaign Name', 'Date Range Start', 'Date Range End', 'Platform', 'Cost', 'Impressions', 'Clicks', 'Conversions', 'Nama Produk'];
    }
  };

  const getTitle = () => {
    return advertisingImportType === 'settlement' ? 'Import Advertising Settlement Data' : 'Import Advertising Campaign Data';
  };

  const getDescription = () => {
    if (advertisingImportType === 'settlement') {
      return 'Upload data settlement advertising dari marketplace';
    } else {
      return 'Upload data campaign advertising dengan nama produk';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <TrendingUp className="w-5 h-5 text-accent-primary" />
            {getTitle()}
          </CardTitle>
          <p className="text-muted-foreground">{getDescription()}</p>
          {/* Dropdown positioned absolutely to avoid affecting layout */}
          <div className="absolute top-6 right-6">
            <Select value={advertisingImportType} onValueChange={(value: 'advertising' | 'settlement') => setAdvertisingImportType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advertising">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Campaign Data
                  </div>
                </SelectItem>
                <SelectItem value="settlement">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Settlement Data
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Download Template */}
          <div className="flex items-center justify-between p-4 bg-accent-muted border border-accent-border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-accent-primary" />
              <div>
                <p className="font-medium text-accent-secondary-foreground">Download Template</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => onDownloadTemplate(advertisingImportType)}
              className="border-accent-border text-accent-primary hover:bg-accent-secondary"
              disabled={isUploading}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-accent-primary bg-accent-secondary' 
                : 'border-border hover:border-accent-border'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">
              Drop file di sini atau klik untuk upload
            </h3>
            <p className="text-muted-foreground mb-4">
              Mendukung file: XLSX, XLS, CSV
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mb-2"
            >
              {isUploading ? 'Uploading...' : 'Pilih File'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>


        </CardContent>
      </Card>
    </div>
  );
}

export function AdvertisingImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Column validation dialog states
  const [showColumnValidationError, setShowColumnValidationError] = useState(false);
  const [columnValidationResult, setColumnValidationResult] = useState<ColumnValidationResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('❌ Format file tidak didukung', {
          description: 'Silakan gunakan file Excel (.xlsx, .xls) atau CSV (.csv)'
        });
        return;
      }

      setFile(selectedFile);
      setImportResult(null);
      toast.success('✅ File berhasil dipilih', {
        description: `${selectedFile.name} siap untuk diimport`
      });
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('❌ Silakan pilih file terlebih dahulu');
      return;
    }

    // 🔒 STRICT COLUMN VALIDATION
    console.log('🔍 Starting strict column validation for advertising...');
    
    try {
      const preValidation = await preValidateImportFile(file, 'advertising');
      
      if (!preValidation.canProceed) {
        // ❌ CANCEL ENTIRE IMPORT - Column mismatch detected
        console.error('🚫 ADVERTISING IMPORT DIBATALKAN - Kolom tidak sesuai:', {
          expectedColumns: preValidation.validation.expectedColumns,
          actualColumns: preValidation.validation.actualColumns,
          missingColumns: preValidation.validation.missingColumns,
          extraColumns: preValidation.validation.extraColumns
        });
        
        // Show detailed column validation error dialog
        setColumnValidationResult(preValidation.validation);
        setShowColumnValidationError(true);
        return;
      }
      
      console.log('✅ Advertising column validation passed - proceeding with import');
      
    } catch (validationError) {
      console.error('❌ Advertising column validation process failed:', validationError);
      toast.error('❌ Validasi kolom gagal', {
        description: `Tidak dapat memvalidasi struktur file: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`
      });
      return;
    }

    try {
      setImporting(true);
      setUploadProgress(0);
      
      console.log('📊 Starting advertising data import with True Business ROI...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('import_type', 'advertising');
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('http://localhost:3001/api/import/advertising', {
        method: 'POST',
        body: formData,
        headers: {
          'x-development-only': 'true'
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (response.ok && result.success) {
        const importData: ImportResult = {
          success: true,
          totalRecords: result.data.total || result.data.totalRows || 0,
          validRecords: result.data.imported || 0,
          invalidRecords: result.data.errors || 0,
          importedRecords: result.data.imported || 0,
          batchId: result.data.batchId
        };

        setImportResult(importData);
        
        // Show enhanced advertising import success
        showAdvertisingImportSuccess(
          importData.importedRecords, 
          uploadingFile?.name,
          importData.batchId
        );

        console.log('✅ Import advertising data with product attribution completed:', importData);
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('❌ Import error:', error);
      toast.error('❌ Import gagal', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan sistem'
      });
      
      setImportResult({
        success: false,
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        importedRecords: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/import/templates/advertising', {
        method: 'GET',
        headers: {
          'x-development-only': 'true'
        }
      });
      
      if (!response.ok) {
        toast.error('❌ Template download failed', {
          description: 'Backend connection issue'
        });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'advertising_template_with_nama_produk.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('📥 Template True Business ROI berhasil didownload');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('❌ Template download failed', {
        description: 'Backend connection issue'
      });
    }
  };

  const resetImport = () => {
    setFile(null);
    setImportResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Import Advertising Data</h2>
          <p className="text-gray-600">
            Upload data marketing dan advertising dengan nama produk untuk True Business ROI
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadTemplate} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download Template
          </Button>
          {(file || importResult) && (
            <Button onClick={resetImport} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* True Business ROI Info Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-emerald-900">🎯 True Business ROI Implementation</h4>
            <p className="text-sm text-emerald-800">
              Template sekarang mendukung <strong>Nama Produk</strong> untuk perhitungan ROI yang lebih akurat 
              dengan product attribution. ROI akan menunjukkan accuracy level: HIGH (product attribution), 
              MEDIUM (period estimation), atau LOW (basic only).
            </p>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Upload Advertising Data dengan True Business ROI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button 
                onClick={handleImport} 
                disabled={!file || importing}
                className="gap-2 min-w-[120px]"
              >
                {importing ? (
                  <>
                    <Upload className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Data
                  </>
                )}
              </Button>
            </div>

            {importing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Processing...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>

          {/* Enhanced Import Result */}
          {importResult && (
            <Card className={`theme-transition interactive-hover ${
              importResult.success 
                ? 'border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-green-25 dark:from-green-900/20 dark:to-green-800/10' 
                : 'border-red-200 dark:border-red-700 bg-gradient-to-br from-red-50 to-red-25 dark:from-red-900/20 dark:to-red-800/10'
            }`}>
              <CardContent className="p-6">
                {/* Success Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full ${
                    importResult.success 
                      ? 'bg-green-100 dark:bg-green-800/30' 
                      : 'bg-red-100 dark:bg-red-800/30'
                  }`}>
                    {importResult.success ? (
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold ${
                      importResult.success 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {importResult.success ? '🎉 Import Berhasil Sempurna!' : '❌ Import Gagal'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Data advertising dengan True Business ROI berhasil diproses
                    </p>
                  </div>
                </div>

                {/* Enhanced Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-card dark:bg-card/50 p-3 rounded-lg border theme-transition">
                    <div className="text-2xl font-bold text-foreground">
                      {importResult.totalRecords.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Total Records
                    </div>
                  </div>
                  
                  <div className="bg-card dark:bg-card/50 p-3 rounded-lg border theme-transition">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {importResult.validRecords.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Valid Records
                    </div>
                  </div>
                  
                  <div className="bg-card dark:bg-card/50 p-3 rounded-lg border theme-transition">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {importResult.importedRecords.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Imported
                    </div>
                  </div>
                  
                  <div className="bg-card dark:bg-card/50 p-3 rounded-lg border theme-transition">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {importResult.invalidRecords.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Errors
                    </div>
                  </div>
                </div>

                {/* Success Rate Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Tingkat Keberhasilan</span>
                    <Badge variant={importResult.success ? "default" : "destructive"} className="px-3 py-1">
                      {Math.round((importResult.importedRecords / importResult.totalRecords) * 100)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary dark:bg-muted rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                        importResult.success 
                          ? 'bg-gradient-to-r from-green-500 to-green-400' 
                          : 'bg-gradient-to-r from-red-500 to-red-400'
                      }`}
                      style={{ 
                        width: `${Math.round((importResult.importedRecords / importResult.totalRecords) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Batch ID */}
                {importResult.batchId && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 dark:bg-muted/20 px-3 py-2 rounded-lg">
                    <FileText className="w-4 h-4" />
                    <span>Batch ID: <span className="font-mono font-semibold">{importResult.batchId}</span></span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Required Fields Info with Nama Produk highlighted */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">Required Fields</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Campaign Name', 'Date Range Start', 'Date Range End', 'Platform', 
                    'Cost', 'Impressions', 'Clicks', 'Conversions', 'Nama Produk'
                  ].map((field) => (
                    <Badge key={field} variant="outline" className={`${
                      field === 'Nama Produk' 
                        ? 'text-emerald-700 border-emerald-300 bg-emerald-50' 
                        : 'text-blue-700 border-blue-300'
                    }`}>
                      {field}
                      {field === 'Nama Produk' && (
                        <span className="ml-1 text-xs">🎯 True ROI</span>
                      )}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  <strong>Nama Produk</strong> diperlukan untuk perhitungan True Business ROI dengan product attribution yang akurat.
                </p>
              </div>
            </div>
          </div>

          {/* Sample Data Preview with Product Names */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="space-y-3 flex-1">
                <h4 className="font-medium text-gray-900">Sample Data Preview dengan Nama Produk</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-2 text-gray-700">Campaign Name</th>
                        <th className="text-left p-2 text-gray-700">Platform</th>
                        <th className="text-left p-2 text-gray-700">Cost</th>
                        <th className="text-left p-2 text-gray-700">Revenue</th>
                        <th className="text-left p-2 text-gray-700">Marketplace</th>
                        <th className="text-left p-2 text-emerald-700">Nama Produk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleData.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="p-2 text-gray-900">{item.campaign_name}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">
                              {item.platform.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-2 text-gray-900">Rp {item.cost.toLocaleString('id-ID')}</td>
                          <td className="p-2 text-green-600">Rp {item.revenue.toLocaleString('id-ID')}</td>
                          <td className="p-2 text-gray-700">{item.marketplace}</td>
                          <td className="p-2 text-emerald-700 font-medium">{item.nama_produk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Validation Error Dialog */}
      {columnValidationResult && (
        <ColumnValidationErrorDialog
          isOpen={showColumnValidationError}
          onClose={() => {
            setShowColumnValidationError(false);
            setColumnValidationResult(null);
          }}
          validation={columnValidationResult}
          importType="advertising"
          fileName={file?.name || 'unknown file'}
          onDownloadTemplate={() => {
            downloadTemplate();
            setShowColumnValidationError(false);
            setColumnValidationResult(null);
          }}
        />
      )}
    </div>
  );
}