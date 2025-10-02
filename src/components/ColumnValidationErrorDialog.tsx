import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, FileX, Download, CheckCircle, X, FileText, ArrowRight, Zap } from 'lucide-react';
import { FlexibleColumnValidationResult } from '../utils/flexibleColumnValidator';

interface ColumnValidationErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  validation: FlexibleColumnValidationResult;
  importType: string;
  fileName: string;
  onDownloadTemplate: () => void;
  onProceedAnyway?: () => void; // Optional callback to proceed with flexible matching
}

export function ColumnValidationErrorDialog({
  isOpen,
  onClose,
  validation,
  importType,
  fileName,
  onDownloadTemplate,
  onProceedAnyway
}: ColumnValidationErrorDialogProps) {
  
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

  const getImportTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'sales': 'bg-green-500',
      'products': 'bg-purple-500',
      'stock': 'bg-orange-500',
      'advertising': 'bg-blue-500',
      'advertising-settlement': 'bg-yellow-500'
    };
    return colorMap[type] || 'bg-gray-500';
  };

  if (!validation) return null;

  // Check if this is a high-confidence flexible match that could proceed
  const canProceedWithFlexibleMatch = !validation.isValid && 
    validation.confidence >= 70 && 
    validation.unmatchedExpected.length <= 2 &&
    Object.keys(validation.columnMappings).length >= validation.expectedColumns.length * 0.8;

  const dialogTitle = validation.isValid 
    ? "Import Berhasil - Kolom Cocok" 
    : canProceedWithFlexibleMatch 
      ? "Smart Column Matching - Perlu Konfirmasi"
      : "Import Dibatalkan - Kolom Tidak Sesuai";

  const dialogIcon = validation.isValid 
    ? <CheckCircle className="w-6 h-6 text-green-600" />
    : canProceedWithFlexibleMatch
      ? <Zap className="w-6 h-6 text-yellow-600" />
      : <FileX className="w-6 h-6 text-red-600" />;

  const headerBgColor = validation.isValid 
    ? "bg-green-100" 
    : canProceedWithFlexibleMatch 
      ? "bg-yellow-100" 
      : "bg-red-100";

  const headerTextColor = validation.isValid 
    ? "text-green-900" 
    : canProceedWithFlexibleMatch 
      ? "text-yellow-900" 
      : "text-red-900";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${headerBgColor} rounded-lg`}>
              {dialogIcon}
            </div>
            <div className="flex-1">
              <DialogTitle className={`text-xl ${headerTextColor}`}>
                {dialogTitle}
              </DialogTitle>
              <p className={`text-sm ${headerTextColor.replace('900', '700')} mt-1`}>
                File "{fileName}" - {validation.confidence}% kecocokan kolom
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Type Info & Confidence Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${getImportTypeColor(importType)} text-white rounded-lg`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">Import Type</h3>
                    <p className="text-sm text-blue-700">{getImportTypeDisplayName(importType)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 ${validation.confidence >= 80 ? 'border-green-300 bg-green-50' : validation.confidence >= 60 ? 'border-yellow-300 bg-yellow-50' : 'border-red-300 bg-red-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg text-white ${validation.confidence >= 80 ? 'bg-green-500' : validation.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`font-medium ${validation.confidence >= 80 ? 'text-green-900' : validation.confidence >= 60 ? 'text-yellow-900' : 'text-red-900'}`}>
                      Confidence Score
                    </h3>
                    <p className={`text-sm ${validation.confidence >= 80 ? 'text-green-700' : validation.confidence >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>
                      {validation.confidence}% - {validation.confidence >= 80 ? 'Sangat Baik' : validation.confidence >= 60 ? 'Dapat Diterima' : 'Perlu Perbaikan'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column Mappings - Show how columns were matched */}
          {Object.keys(validation.columnMappings).length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  Smart Column Matching ({Object.keys(validation.columnMappings).length} kolom berhasil dipasangkan)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(validation.columnMappings).map(([actualCol, expectedCol], index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-white rounded border border-green-200">
                    <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      "{actualCol}"
                    </span>
                    <ArrowRight className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-mono text-green-700 bg-green-100 px-2 py-1 rounded">
                      "{expectedCol}"
                    </span>
                    <Badge className="bg-green-100 text-green-700 text-xs ml-auto">✓ Cocok</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Unmatched Expected Columns */}
          {validation.unmatchedExpected.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-800">
                  📋 Kolom yang Belum Ditemukan ({validation.unmatchedExpected.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {validation.unmatchedExpected.map((column, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <X className="w-3 h-3 text-red-500 flex-shrink-0" />
                      <span className="text-sm font-mono text-red-700">"{column}"</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unmatched Actual Columns */}
          {validation.unmatchedActual.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-yellow-800">
                  ➕ Kolom yang Tidak Dikenali ({validation.unmatchedActual.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {validation.unmatchedActual.map((column, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      <span className="text-sm font-mono text-yellow-700">"{column}"</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {validation.suggestions && validation.suggestions.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-800">
                  💡 Saran Smart Matching
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {validation.suggestions.map((suggestion, index) => (
                    <div key={index} className="text-sm text-blue-700">
                      • {suggestion}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {canProceedWithFlexibleMatch && onProceedAnyway && (
              <Button
                onClick={onProceedAnyway}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Lanjutkan Import dengan Smart Matching ({validation.confidence}%)
              </Button>
            )}
            
            <Button
              onClick={onDownloadTemplate}
              variant={canProceedWithFlexibleMatch ? "outline" : "default"}
              className={canProceedWithFlexibleMatch ? "flex-1" : "flex-1 bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template Standar
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Tutup
            </Button>
          </div>

          {/* Info Notice */}
          <div className={`border rounded-lg p-4 ${validation.isValid ? 'bg-green-50 border-green-200' : canProceedWithFlexibleMatch ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3">
              {validation.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : canProceedWithFlexibleMatch ? (
                <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className={`text-sm font-medium ${validation.isValid ? 'text-green-800' : canProceedWithFlexibleMatch ? 'text-yellow-800' : 'text-red-800'}`}>
                  {validation.isValid ? 'Sempurna!' : canProceedWithFlexibleMatch ? 'Smart Matching Available' : 'Perlu Perbaikan'}
                </h4>
                <p className={`text-xs mt-1 ${validation.isValid ? 'text-green-600' : canProceedWithFlexibleMatch ? 'text-yellow-600' : 'text-red-600'}`}>
                  {validation.isValid 
                    ? 'Semua kolom cocok sempurna dengan template. Import dapat dilanjutkan.'
                    : canProceedWithFlexibleMatch 
                      ? `Sistem berhasil mengenali ${Object.keys(validation.columnMappings).length} dari ${validation.expectedColumns.length} kolom yang diperlukan. Anda dapat melanjutkan import dengan smart matching atau menggunakan template standar.`
                      : 'Terlalu banyak kolom yang tidak cocok. Silakan gunakan template standar atau perbaiki nama kolom Anda.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}