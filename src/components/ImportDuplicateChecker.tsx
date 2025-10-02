import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileCheck, Calendar, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AccessibleDialog } from './ui/accessible-dialog';
import { debugDuplicateChecker } from '../utils/duplicateCheckerDebug';
import { Card, CardContent } from './ui/card';

interface ImportDuplicateInfo {
  isDuplicate: boolean;
  previousImports: {
    id: string;
    file_name: string;
    imported_at: string;
    total_records: number;
    imported_records: number;
    batch_name: string;
    similarity_score: number;
    date_range?: {
      start: string;
      end: string;
    };
  }[];
  fileHash?: string;
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  recommendations: string[];
}

interface ImportDuplicateCheckerProps {
  file: File | null;
  importType: string;
  onProceed: (confirmed: boolean) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function ImportDuplicateChecker({
  file,
  importType,
  onProceed,
  onCancel,
  isOpen
}: ImportDuplicateCheckerProps) {
  const [checking, setChecking] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<ImportDuplicateInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      checkForDuplicates();
    }
  }, [isOpen, file]);

  const checkForDuplicates = async () => {
    if (!file) return;
    
    setChecking(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importType', importType);

      const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';
      
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${baseUrl}/api/import/check-duplicates`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Duplicate check response:', result);
        
        // Extract data from response structure
        const duplicateData = result.success && result.data ? result.data : result;
        setDuplicateInfo({
          isDuplicate: duplicateData.isDuplicate || false,
          previousImports: duplicateData.previousImports || [],
          riskLevel: duplicateData.riskLevel || 'low',
          warnings: duplicateData.warnings || [],
          recommendations: duplicateData.recommendations || [],
          fileHash: duplicateData.fileHash
        });
      } else {
        console.warn('⚠️ Duplicate check failed, using fallback');
        const errorText = await response.text();
        console.log('Response error:', errorText);
        
        // Fallback - proceed without check
        setDuplicateInfo({
          isDuplicate: false,
          previousImports: [],
          riskLevel: 'low',
          warnings: ['Duplicate check unavailable - proceeding with caution'],
          recommendations: ['Monitor import results for potential duplicates']
        });
      }
    } catch (error) {
      console.warn('⚠️ Duplicate check network error:', error);
      
      // Check if it's a timeout/abort error
      const isTimeout = error.name === 'AbortError';
      
      // Enhanced fallback with useful warnings
      setDuplicateInfo({
        isDuplicate: false,
        previousImports: [],
        riskLevel: 'low',
        warnings: [
          isTimeout ? 'Duplicate check timed out' : 'Duplicate checker temporarily unavailable',
          'Import will proceed without duplicate validation'
        ],
        recommendations: [
          'Verify manually if this file was imported before',
          'Check import history after completion',
          'Monitor for duplicate records in the data'
        ]
      });
    } finally {
      setChecking(false);
    }
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost,
        );
      }
    }
    
    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/30';
      default: return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return AlertTriangle;
      case 'medium': return AlertCircle;
      default: return CheckCircle;
    }
  };

  if (!isOpen) return null;

  return (
    <AccessibleDialog
      open={isOpen}
      onOpenChange={() => !checking && onCancel()}
      title="Import Duplicate Check"
      description="Checking for potential duplicate imports in your data"
      className="max-w-2xl sm:max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto bg-card dark:bg-card border-border dark:border-border"
      icon={<Database className="w-5 h-5 text-accent-primary dark:text-accent-primary" />}
    >
      <div className="space-y-4 theme-transition">
          {checking ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-foreground dark:text-white">Checking for duplicates...</span>
            </div>
          ) : duplicateInfo ? (
            <>
              {/* Risk Assessment */}
              <Alert className={`border ${getRiskColor(duplicateInfo.riskLevel)}`}>
                <div className="flex items-start gap-3">
                  {React.createElement(getRiskIcon(duplicateInfo.riskLevel), { className: "w-5 h-5 mt-0.5" })}
                  <div className="flex-1">
                    <AlertDescription>
                      <div className="font-medium mb-2 text-gray-900 dark:text-white">
                        {duplicateInfo.isDuplicate 
                          ? `⚠️ Potential Duplicate Import (Risk: ${duplicateInfo.riskLevel.toUpperCase()})`
                          : '✅ No Duplicates Detected'
                        }
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-200">
                        File: <strong className="text-foreground dark:text-white">{file?.name}</strong> • Type: <strong className="text-foreground dark:text-white">{importType}</strong>
                      </p>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>

              {/* Previous Imports */}
              {duplicateInfo.previousImports.length > 0 && (
                <Card className="bg-card border-border theme-transition">
                  <CardContent className="p-4 theme-transition">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-foreground dark:text-white">
                      <FileCheck className="w-4 h-4" />
                      Similar Previous Imports ({duplicateInfo.previousImports.length})
                    </h4>
                    <div className="space-y-2">
                      {duplicateInfo.previousImports.slice(0, 3).map((imp, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 theme-transition">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-foreground dark:text-white">{imp.file_name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {new Date(imp.imported_at).toLocaleDateString('id-ID')} • 
                              <span className="font-medium text-foreground dark:text-white ml-1">{imp.imported_records}</span> records imported
                            </p>
                            {imp.date_range && (
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                Data range: {imp.date_range.start} to {imp.date_range.end}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            {Math.round(imp.similarity_score * 100)}% similar
                          </Badge>
                        </div>
                      ))}
                      {duplicateInfo.previousImports.length > 3 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowDetails(!showDetails)}
                          className="w-full text-gray-700 dark:text-gray-200"
                        >
                          {showDetails ? 'Show Less' : `Show ${duplicateInfo.previousImports.length - 3} More`}
                        </Button>
                      )}

                      {/* Additional imports if showDetails is true */}
                      {showDetails && duplicateInfo.previousImports.slice(3).map((imp, index) => (
                        <div key={index + 3} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 theme-transition">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-foreground dark:text-white">{imp.file_name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {new Date(imp.imported_at).toLocaleDateString('id-ID')} • 
                              <span className="font-medium text-foreground dark:text-white ml-1">{imp.imported_records}</span> records imported
                            </p>
                            {imp.date_range && (
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                Data range: {imp.date_range.start} to {imp.date_range.end}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            {Math.round(imp.similarity_score * 100)}% similar
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {duplicateInfo.warnings.length > 0 && (
                <div className="space-y-2 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg theme-transition">
                  <h4 className="font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warnings
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                    {duplicateInfo.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {duplicateInfo.recommendations.length > 0 && (
                <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg theme-transition">
                  <h4 className="font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Recommendations
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    {duplicateInfo.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onCancel()}
                  className="flex-1 theme-transition"
                >
                  Cancel Import
                </Button>
                <Button
                  onClick={() => onProceed(true)}
                  className="flex-1 theme-transition"
                  variant={duplicateInfo.isDuplicate && duplicateInfo.riskLevel === 'high' ? "destructive" : "default"}
                >
                  {duplicateInfo.isDuplicate 
                    ? `Proceed with ${duplicateInfo.riskLevel.toUpperCase()} Risk` 
                    : 'Continue Import'
                  }
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300">Unable to check for duplicates. Proceed with caution.</p>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => onCancel()} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => onProceed(true)} className="flex-1">
                  Proceed Anyway
                </Button>
              </div>
            </div>
          )}
      </div>
    </AccessibleDialog>
  );
}