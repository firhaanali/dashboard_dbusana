import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, FileText, Download, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useImportData } from '../contexts/ImportDataContext';
import { useImportNotifications } from '../hooks/useImportNotifications';
import { useImportHistory } from '../hooks/useImportHistory';
import { ImportSuccessDialog } from './ImportSuccessDialog';
import { ImportHistory } from './ImportHistory';

import { ImportDuplicateChecker } from './ImportDuplicateChecker';
import { ColumnValidationErrorDialog } from './ColumnValidationErrorDialog';
import { AdvertisingImportSection } from './AdvertisingImport';
// DuplicationFixApplied import removed as per cleanup policy
import { logImportActivity } from '../utils/activityLogger';
import { validateImportColumnsFlexible, FlexibleColumnValidationResult } from '../utils/flexibleColumnValidator';

interface ImportPageProps {
  onImportSuccess?: () => void;
}

// Helper function to get display name for import types
const getImportTypeDisplayName = (type: string): string => {
  const typeMap: Record<string, string> = {
    'sales': 'Data Penjualan',
    'products': 'Data Produk',
    'stock': 'Data Stok',
    'advertising': 'Data Advertising',
    'advertising-settlement': 'Data Settlement Advertising'
  };
  return typeMap[type] || type;
};

export function ImportPage({ onImportSuccess }: ImportPageProps) {
  const [activeTab, setActiveTab] = useState('sales');
  const [isUploading, setIsUploading] = useState(false);
  const [advertisingImportType, setAdvertisingImportType] = useState<'advertising' | 'settlement'>('advertising');
  const [showDuplicateChecker, setShowDuplicateChecker] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; type: string } | null>(null);
  
  // Column validation dialog states
  const [showColumnValidationError, setShowColumnValidationError] = useState(false);
  const [columnValidationResult, setColumnValidationResult] = useState<FlexibleColumnValidationResult | null>(null);
  const [failedFile, setFailedFile] = useState<{ file: File; type: string } | null>(null);
  
  // Get dispatch from context, with fallback for safety
  const context = useImportData();
  const dispatch = context?.dispatch;
  
  // Import notifications hook
  const {
    showSuccessDialog,
    successData,
    showSuccess,
    showError,
    closeDialog,
    navigateToView
  } = useImportNotifications();

  // Import history hook for database logging
  const { createHistoryEntry } = useImportHistory();

  // Column detection patterns for better error messages
  const detectFileType = (fileName: string): string | null => {
    const lowerName = fileName.toLowerCase();
    
    // Settlement patterns (check first, more specific)
    if (lowerName.includes('settlement') || lowerName.includes('advertising-settlement')) {
      return 'advertising-settlement';
    }
    
    // Advertising patterns (check after settlement)
    if (lowerName.includes('advertising') || lowerName.includes('ads') || 
        lowerName.includes('campaign')) {
      return 'advertising';
    }
    
    // Sales patterns
    if (lowerName.includes('sales') || lowerName.includes('penjualan') || 
        lowerName.includes('order') || lowerName.includes('pesanan')) {
      return 'sales';
    }
    
    // Products patterns
    if (lowerName.includes('product') || lowerName.includes('produk') || 
        lowerName.includes('inventory') || lowerName.includes('stock')) {
      return 'products';
    }
    
    return null;
  };

  const getColumnMismatchMessage = (selectedType: string, fileName: string): string => {
    const detectedType = detectFileType(fileName);
    
    // Skip validation for advertising-settlement files with settlement names
    if (selectedType === 'advertising-settlement' && fileName.toLowerCase().includes('settlement')) {
      return '';
    }
    
    if (detectedType && detectedType !== selectedType) {
      const typeNames = {
        'advertising': 'Advertising',
        'advertising-settlement': 'Advertising Settlement',
        'sales': 'Sales Data', 
        'products': 'Products',
        'stock': 'Stock'
      };
      
      return `File "${fileName}" sepertinya adalah data ${typeNames[detectedType as keyof typeof typeNames]}. Anda saat ini berada di tab ${typeNames[selectedType as keyof typeof typeNames] || selectedType}. Silakan pindah ke tab yang sesuai atau periksa kembali file Anda.`;
    }
    
    return '';
  };

  const handleFileUpload = async (file: File, type: string) => {
    if (!file) return;

    // Pre-upload validation - check filename vs selected tab
    const mismatchMessage = getColumnMismatchMessage(type, file.name);
    if (mismatchMessage) {
      showError(type, mismatchMessage);
      return;
    }

    // ⚡ FLEXIBLE COLUMN VALIDATION - Smart Matching
    console.log('🔍 Starting flexible column validation with smart matching...');
    
    try {
      const validation = await validateImportColumnsFlexible(
        file, 
        type as 'sales' | 'products' | 'stock' | 'advertising' | 'advertising-settlement'
      );
      
      // Check if validation failed with low confidence
      if (!validation.isValid && validation.confidence < 70) {
        // ❌ CANCEL IMPORT - Low confidence match
        console.error('🚫 IMPORT DIBATALKAN - Kolom tidak dapat dikenali:', {
          expectedColumns: validation.expectedColumns,
          actualColumns: validation.actualColumns,
          columnMappings: validation.columnMappings,
          confidence: validation.confidence
        });
        
        // Column validation error will be logged by backend if import fails
        console.log('📝 Column validation failed - backend will log this if user proceeds');
        
        // Show detailed column validation error dialog
        setColumnValidationResult(validation);
        setFailedFile({ file, type });
        setShowColumnValidationError(true);
        return;
      }
      
      // If validation passed or has good confidence, continue
      if (validation.isValid) {
        console.log('✅ Column validation passed - exact match');
      } else if (validation.confidence >= 70) {
        console.log(`⚡ Smart matching successful - ${validation.confidence}% confidence`);
        // Show dialog but allow user to proceed
        setColumnValidationResult(validation);
        setFailedFile({ file, type });
        setShowColumnValidationError(true);
        return;
      }
      
    } catch (validationError) {
      console.error('❌ Column validation process failed:', validationError);
      
      // Validation process failure - backend will log this if user proceeds
      console.log('📝 Validation process failed - will be logged by backend if import proceeds');
      
      showError(type, `❌ **VALIDASI GAGAL**\\n\\nTidak dapat memvalidasi struktur file.\\n\\n**Error**: ${validationError instanceof Error ? validationError.message : 'Unknown error'}\\n\\n📝 **Solusi:**\\n1. Periksa apakah file tidak corrupt\\n2. Pastikan menggunakan format .xlsx atau .csv\\n3. Download template baru jika diperlukan`);
      return;
    }

    // Check for duplicates before proceeding
    setPendingFile({ file, type });
    setShowDuplicateChecker(true);
  };

  const handleDuplicateCheckResult = async (confirmed: boolean) => {
    setShowDuplicateChecker(false);
    
    if (!confirmed || !pendingFile) {
      setPendingFile(null);
      return;
    }

    const { file, type } = pendingFile;
    setPendingFile(null);
    
    // Proceed with actual upload
    await performFileUpload(file, type);
  };

  const performFileUpload = async (file: File, type: string) => {
    setIsUploading(true);
    const startTime = Date.now();
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add debugging info for backend
      formData.append('debug', 'true');
      formData.append('originalFileName', file.name);

      const endpoint = type === 'sales' ? '/api/import/sales' : 
                     type === 'products' ? '/api/import/products' : 
                     type === 'stock' ? '/api/import/stock' :
                     type === 'advertising' ? '/api/import/advertising' :
                     type === 'advertising-settlement' ? '/api/import/advertising-settlement' :
                     '/api/import/advertising';

      console.log(`🔄 Uploading ${type} file:`, {
        fileName: file.name,
        fileSize: file.size,
        endpoint,
        type
      });

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'x-development-only': 'true',
        },
        body: formData,
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error(`Server response tidak valid: ${response.status} ${response.statusText}`);
      }

      console.log(`📊 Upload Response:`, {
        status: response.status,
        ok: response.ok,
        result
      });

      if (response.ok) {
        // Calculate processing time
        const processingTime = Date.now() - startTime;
        
        // Prepare enhanced success data
        const successData = {
          type: type as 'sales' | 'products' | 'stock' | 'advertising' | 'advertising-settlement',
          imported: result.data.imported + (result.data.updated || 0), // Include updated records
          total: result.data.totalRows || result.data.total || (result.data.imported + (result.data.updated || 0)),
          errors: result.data.errors || 0,
          duplicates: result.data.duplicates || 0,
          fileName: file.name,
          processingTime,
          summary: {
            'New records': result.data.imported || 0,
            'Updated records': result.data.updated || 0,
            'Total processed': (result.data.imported || 0) + (result.data.updated || 0),
            'Batch ID': result.data.batchId,
            ...result.data.summary
          }
        };

        // ✅ ACTIVITY LOGGING HANDLED BY BACKEND
        // Backend already logs activity to prevent duplication
        console.log('📝 Activity logging is handled by backend to prevent duplication');

        // Show enhanced success notification with dialog for all imports
        showSuccess(successData, {
          showDialog: true, // Always show dialog for all imports
          celebrateIfLarge: true,
          autoNavigate: false
        });

        // Update context with new data if dispatch is available
        if (dispatch) {
          dispatch({
            type: 'IMPORT_SUCCESS',
            payload: {
              type,
              data: result.data,
              timestamp: new Date().toISOString()
            }
          });
        }

        // Trigger success callback
        onImportSuccess?.();
      } else {
        // Failed import activity will be logged by backend
        console.log('📝 Failed import will be logged by backend');

        // Enhanced error handling for specific backend errors
        let errorMessage = result.message || result.error || 'Import failed';
        
        console.error('❌ Import Error Details:', {
          status: response.status,
          message: result.message,
          error: result.error,
          details: result.details,
          stack: result.stack
        });
        
        // Handle specific error cases based on import type
        if (errorMessage.includes('campaignName is not defined') || 
            errorMessage.includes('Campaign Name') ||
            errorMessage.includes('required field') ||
            errorMessage.includes('column') ||
            errorMessage.includes('property')) {
          
          // Generate specific error message based on import type
          if (type === 'advertising-settlement') {
            errorMessage = `❌ KOLOM TIDAK DITEMUKAN: Backend tidak dapat menemukan kolom yang diperlukan untuk ADVERTISING SETTLEMENT.\\n\\n🔧 MASALAH UMUM:\\n• File Excel mungkin menggunakan nama kolom yang berbeda\\n• Backend mencari kolom settlement: Order ID, Type, Order Created Time, Order Settled Time, Settlement Amount\\n• Struktur file tidak sesuai dengan template settlement\\n\\n📝 SOLUSI:\\n1. Download template ADVERTISING SETTLEMENT yang benar\\n2. Pastikan kolom sesuai dengan template settlement\\n3. Jika masih error, coba convert ke format CSV terlebih dahulu\\n\\n💡 TIPS: Kolom advertising settlement yang diperlukan:\\n• Order ID, Type, Order Created Time, Order Settled Time, Settlement Amount, Account Name, Marketplace, Currency`;
          } else if (type === 'advertising') {
            errorMessage = `❌ KOLOM TIDAK DITEMUKAN: Backend tidak dapat menemukan kolom yang diperlukan untuk ADVERTISING CAMPAIGN.\\n\\n🔧 MASALAH UMUM:\\n• File Excel mungkin menggunakan nama kolom yang berbeda\\n• Backend mencari kolom campaign: Campaign Name, Date Range Start, Date Range End\\n• Struktur file tidak sesuai dengan template campaign\\n\\n📝 SOLUSI:\\n1. Download template ADVERTISING CAMPAIGN yang benar\\n2. Pastikan kolom sesuai dengan template campaign\\n3. Jika masih error, coba convert ke format CSV terlebih dahulu\\n\\n💡 TIPS: Kolom advertising campaign yang diperlukan:\\n• Campaign Name, Spending, Impressions, CTR, CPC, ROAS, Date Range Start, Date Range End`;
          } else {
            errorMessage = `❌ KOLOM TIDAK DITEMUKAN: Backend tidak dapat menemukan kolom yang diperlukan.\\n\\n🔧 MASALAH UMUM:\\n• File Excel mungkin menggunakan nama kolom yang berbeda\\n• Struktur file tidak sesuai dengan yang diharapkan\\n\\n📝 SOLUSI:\\n1. Download template yang benar dari tombol "Download Template"\\n2. Pastikan kolom sesuai dengan template\\n3. Jika masih error, coba convert ke format CSV terlebih dahulu`;
          }
        } else if (errorMessage.includes('No valid data found')) {
          const detectedType = detectFileType(file.name);
          if (detectedType && detectedType !== type) {
            const typeNames = {
              'advertising': 'Advertising',
              'advertising-settlement': 'Advertising Settlement',
              'sales': 'Sales Data', 
              'products': 'Products',
              'stock': 'Stock'
            };
            errorMessage = `❌ DATA MISMATCH: File ini tampaknya berisi data ${typeNames[detectedType as keyof typeof typeNames]}, namun Anda mencoba import sebagai ${typeNames[type as keyof typeof typeNames]}.\\n\\n🔄 SOLUSI: Pindah ke tab "${typeNames[detectedType as keyof typeof typeNames]}" dan coba upload ulang.`;
          } else {
            errorMessage = `❌ FORMAT ERROR: File tidak mengandung data yang valid untuk ${type}.\\n\\n📋 PETUNJUK:\\n• Pastikan file Excel memiliki kolom yang sesuai\\n• Download template yang benar dari tombol "Download Template"\\n• Periksa apakah data ada di sheet pertama`;
          }
        } else if (response.status === 500) {
          errorMessage = `❌ SERVER ERROR: Backend mengalami masalah internal.\\n\\n🔧 KEMUNGKINAN PENYEBAB:\\n• Struktur kolom tidak sesuai dengan yang diharapkan backend\\n• File Excel menggunakan format yang tidak didukung\\n• Backend mencari kolom dengan nama spesifik yang tidak ada\\n\\n📝 LANGKAH PERBAIKAN:\\n1. Download template terbaru dari "Download Template"\\n2. Copy data Anda ke template tersebut\\n3. Pastikan tidak ada kolom kosong di baris pertama\\n4. Save file dalam format .xlsx\\n\\n🆘 DETAIL ERROR: ${errorMessage}`;
        } else if (result.message && result.message.includes('400')) {
          errorMessage = `❌ BAD REQUEST: Format file atau struktur kolom tidak sesuai.\\n\\n📝 LANGKAH PERBAIKAN:\\n• Download template yang benar\\n• Pastikan nama kolom sesuai dengan template\\n• Periksa format data (tanggal, angka, dll.)`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Import error:', error);
      
      // Show enhanced error notification
      showError(type, error instanceof Error ? error.message : 'Terjadi kesalahan saat import');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async (type: string) => {
    const templateUrls = {
      sales: '/api/import/templates/sales',
      products: '/api/import/templates/products',
      stock: '/api/import/templates/stock',
      advertising: '/api/import/templates/advertising',
      'advertising-settlement': '/api/import/templates/advertising-settlement'
    };

    try {
      const url = `http://localhost:3001${templateUrls[type as keyof typeof templateUrls]}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-development-only': 'true',
        },
      });
      
      if (!response.ok) {
        toast.error('Template download failed', {
          description: 'Failed to download template. Backend might not be running.'
        });
        return;
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${type}_template.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Template download failed', {
        description: 'Backend connection issue. Please check if backend is running.'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-card-foreground">Import Data</h2>
          <p className="text-muted-foreground">Upload file Excel atau CSV</p>
        </div>
        <div className="flex items-center gap-3">
          <ImportHistory />
        </div>
      </div>

      {/* Duplication fix notification removed as per cleanup policy */}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Data</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="advertising">Advertising</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <ImportSection
            title="Import Sales Data"
            description="Upload data penjualan"
            type="sales"
            acceptedFormats=".xlsx,.xls,.csv"
            onFileUpload={handleFileUpload}
            onDownloadTemplate={downloadTemplate}
            isUploading={isUploading}
            requiredFields={['Order ID', 'Seller SKU', 'Product Name', 'Quantity', 'Order Amount', 'Created Time', 'Customer', 'Province', 'Regency & City']}
          />
        </TabsContent>

        <TabsContent value="products">
          <ImportSection
            title="Import Products Data"
            description="Upload master data produk"
            type="products"
            acceptedFormats=".xlsx,.xls,.csv"
            onFileUpload={handleFileUpload}
            onDownloadTemplate={downloadTemplate}
            isUploading={isUploading}
            requiredFields={['Product Code', 'Product Name', 'Category', 'Price', 'Stock Quantity']}
          />
        </TabsContent>

        <TabsContent value="stock">
          <ImportSection
            title="Import Stock Data"
            description="Upload data stock"
            type="stock"
            acceptedFormats=".xlsx,.xls,.csv"
            onFileUpload={handleFileUpload}
            onDownloadTemplate={downloadTemplate}
            isUploading={isUploading}
            requiredFields={['Product Code', 'Stock Quantity', 'Min Stock', 'Location']}
          />
        </TabsContent>

        <TabsContent value="advertising">
          <AdvertisingImportSection
            advertisingImportType={advertisingImportType}
            setAdvertisingImportType={setAdvertisingImportType}
            onFileUpload={(file, internalType) => {
              // FIX: Convert 'settlement' to 'advertising-settlement' for proper notification
              const actualType = internalType === 'settlement' ? 'advertising-settlement' : 
                               internalType === 'advertising' ? 'advertising' : internalType;
              handleFileUpload(file, actualType);
            }}
            onDownloadTemplate={(internalType) => {
              // FIX: Convert 'settlement' to 'advertising-settlement' for proper template download
              const actualType = internalType === 'settlement' ? 'advertising-settlement' : 
                               internalType === 'advertising' ? 'advertising' : internalType;
              downloadTemplate(actualType);
            }}
            isUploading={isUploading}
          />
        </TabsContent>
      </Tabs>
      
      {/* Import Success Dialog */}
      {successData && (
        <ImportSuccessDialog
          isOpen={showSuccessDialog}
          onClose={closeDialog}
          data={successData}
          onNavigate={navigateToView}
        />
      )}

      {/* Import Duplicate Checker */}
      <ImportDuplicateChecker
        file={pendingFile?.file || null}
        importType={pendingFile?.type || ''}
        onProceed={handleDuplicateCheckResult}
        onCancel={() => {
          setShowDuplicateChecker(false);
          setPendingFile(null);
        }}
        isOpen={showDuplicateChecker}
      />

      {/* Column Validation Error Dialog */}
      {columnValidationResult && failedFile && (
        <ColumnValidationErrorDialog
          isOpen={showColumnValidationError}
          onClose={() => {
            setShowColumnValidationError(false);
            setColumnValidationResult(null);
            setFailedFile(null);
          }}
          validation={columnValidationResult}
          importType={failedFile.type}
          fileName={failedFile.file.name}
          onDownloadTemplate={() => {
            downloadTemplate(failedFile.type);
            setShowColumnValidationError(false);
            setColumnValidationResult(null);
            setFailedFile(null);
          }}
          onProceedAnyway={() => {
            // User confirmed to proceed with flexible matching
            if (failedFile) {
              setShowColumnValidationError(false);
              setColumnValidationResult(null);
              
              // Proceed with duplicate check and upload
              setPendingFile(failedFile);
              setFailedFile(null);
              setShowDuplicateChecker(true);
            }
          }}
        />
      )}
    </div>
  );
}

interface ImportSectionProps {
  title: string;
  description: string;
  type: string;
  acceptedFormats: string;
  onFileUpload: (file: File, type: string) => void;
  onDownloadTemplate: (type: string) => void;
  isUploading: boolean;
  requiredFields: string[];
}

function ImportSection({
  title,
  description,
  type,
  acceptedFormats,
  onFileUpload,
  onDownloadTemplate,
  isUploading,
  requiredFields
}: ImportSectionProps) {
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
      onFileUpload(e.dataTransfer.files[0], type);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0], type);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            {type === 'advertising' ? (
              <TrendingUp className="w-5 h-5 text-accent-primary" />
            ) : type === 'sales' ? (
              <FileSpreadsheet className="w-5 h-5 text-accent-primary" />
            ) : type === 'products' ? (
              <FileSpreadsheet className="w-5 h-5 text-accent-primary" />
            ) : (
              <FileSpreadsheet className="w-5 h-5 text-accent-primary" />
            )}
            {title}
          </CardTitle>
          <p className="text-muted-foreground">{description}</p>
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
              onClick={() => onDownloadTemplate(type)}
              className="border-accent-border text-accent-primary hover:bg-accent-secondary"
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
              Mendukung file: {acceptedFormats.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')}
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
              accept={acceptedFormats}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}