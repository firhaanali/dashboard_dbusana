import React, { useState } from 'react';
import { ImportSuccessDialog } from './ImportSuccessDialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Moon, Sun, TestTube, FileSpreadsheet, Package, BarChart3, TrendingUp, Target } from 'lucide-react';

export function ImportSuccessDarkModeTest() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTest, setCurrentTest] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const testCases = [
    {
      id: 'sales-success',
      label: 'Sales - Perfect Success',
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      data: {
        type: 'sales' as const,
        imported: 702,
        total: 702,
        errors: 0,
        duplicates: 0,
        fileName: '07-2025_Sales_Data.xlsx',
        processingTime: 9800,
        summary: {
          'NEW RECORDS': '702',
          'UPDATED RECORDS': '0',
          'TOTAL PROCESSED': '702',
          'BATCH ID': '003e8157-0161-417f-938b-919bcfe568c6'
        }
      }
    },
    {
      id: 'sales-warnings',
      label: 'Sales - With Warnings',
      icon: TrendingUp,
      color: 'text-yellow-600 dark:text-yellow-400',
      data: {
        type: 'sales' as const,
        imported: 680,
        total: 702,
        errors: 15,
        duplicates: 7,
        fileName: '07-2025_Sales_Data_Duplicate.xlsx',
        processingTime: 12450,
        summary: {
          'NEW RECORDS': '680',
          'UPDATED RECORDS': '0',
          'FAILED RECORDS': '15',
          'DUPLICATE RECORDS': '7',
          'TOTAL PROCESSED': '702',
          'BATCH ID': '004f9268-0272-528g-049c-020dcge679d7'
        }
      }
    },
    {
      id: 'products-success',
      label: 'Products - Success',
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400',
      data: {
        type: 'products' as const,
        imported: 245,
        total: 245,
        errors: 0,
        duplicates: 0,
        fileName: 'Product_Catalog_2025.xlsx',
        processingTime: 3200,
        summary: {
          'NEW PRODUCTS': '245',
          'UPDATED PRODUCTS': '0',
          'CATEGORIES': '12',
          'BRANDS': '8'
        }
      }
    },
    {
      id: 'advertising-success',
      label: 'Advertising - Success',
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400',
      data: {
        type: 'advertising' as const,
        imported: 89,
        total: 89,
        errors: 0,
        duplicates: 0,
        fileName: 'TikTok_Ads_Campaign_Jan2025.xlsx',
        processingTime: 2100,
        summary: {
          'CAMPAIGNS': '89',
          'TOTAL SPEND': 'Rp 45,230,000',
          'IMPRESSIONS': '2,450,000',
          'CLICKS': '89,500'
        }
      }
    },
    {
      id: 'settlement-success',
      label: 'Settlement - Success',
      icon: Target,
      color: 'text-red-600 dark:text-red-400',
      data: {
        type: 'advertising-settlement' as const,
        imported: 156,
        total: 156,
        errors: 0,
        duplicates: 0,
        fileName: 'Settlement_TikTok_Jan2025.xlsx',
        processingTime: 4800,
        summary: {
          'SETTLEMENTS': '156',
          'TOTAL AMOUNT': 'Rp 125,670,000',
          'COMMISSION': 'Rp 18,850,500',
          'NET PROFIT': 'Rp 106,819,500'
        }
      }
    },
    {
      id: 'stock-partial',
      label: 'Stock - Partial Success',
      icon: BarChart3,
      color: 'text-purple-600 dark:text-purple-400',
      data: {
        type: 'stock' as const,
        imported: 420,
        total: 450,
        errors: 25,
        duplicates: 5,
        fileName: 'Stock_Update_Jan2025.xlsx',
        processingTime: 6700,
        summary: {
          'UPDATED ITEMS': '420',
          'FAILED UPDATES': '25',
          'DUPLICATES': '5',
          'LOW STOCK ALERTS': '15'
        }
      }
    }
  ];

  const runTest = (testCase: any) => {
    setCurrentTest(testCase);
    setIsDialogOpen(true);
  };

  const getCurrentModeIcon = () => {
    return isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-contrast">Import Success Dialog - Dark Mode Test</h1>
            <p className="text-contrast-secondary mt-1">
              Test berbagai skenario import success dengan dark mode compatibility
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              Mode: {isDarkMode ? 'Dark' : 'Light'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDarkMode}
              className="flex items-center gap-2"
            >
              {getCurrentModeIcon()}
              Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
            </Button>
          </div>
        </div>

        {/* Test Cases */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testCases.map((testCase) => {
            const IconComponent = testCase.icon;
            const successRate = Math.round((testCase.data.imported / testCase.data.total) * 100);
            const hasWarnings = (testCase.data.errors || 0) > 0 || (testCase.data.duplicates || 0) > 0;
            
            return (
              <Card key={testCase.id} className="import-success-bg-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => runTest(testCase)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      testCase.data.type === 'sales' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' :
                      testCase.data.type === 'products' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' :
                      testCase.data.type === 'stock' ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700' :
                      testCase.data.type === 'advertising' ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700' :
                      'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${testCase.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm import-success-text-primary">{testCase.label}</CardTitle>
                      <p className="text-xs import-success-text-secondary mt-1">
                        {testCase.data.imported}/{testCase.data.total} records
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="import-success-text-secondary">Success Rate</span>
                        <Badge 
                          variant={successRate === 100 ? "default" : hasWarnings ? "destructive" : "secondary"}
                          className="text-xs px-2 py-0"
                        >
                          {successRate}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            successRate === 100 ? 'bg-green-500' : 
                            hasWarnings ? 'bg-yellow-500' : 
                            'bg-blue-500'
                          }`}
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2 import-success-text-secondary">
                        <FileSpreadsheet className="w-3 h-3" />
                        <span className="truncate">{testCase.data.fileName}</span>
                      </div>
                      
                      {testCase.data.processingTime && (
                        <div className="import-success-text-secondary">
                          Processing: {testCase.data.processingTime}ms
                        </div>
                      )}

                      {hasWarnings && (
                        <div className="space-y-1">
                          {testCase.data.errors && testCase.data.errors > 0 && (
                            <div className="text-red-600 dark:text-red-400">
                              • {testCase.data.errors} errors
                            </div>
                          )}
                          {testCase.data.duplicates && testCase.data.duplicates > 0 && (
                            <div className="text-yellow-600 dark:text-yellow-400">
                              • {testCase.data.duplicates} duplicates
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <TestTube className="w-3 h-3 mr-1" />
                      Test Dialog
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <Card className="import-success-bg-card">
          <CardHeader>
            <CardTitle className="text-lg import-success-text-primary flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Testing Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="import-success-text-secondary">
                <strong className="import-success-text-primary">Dark Mode Test Checklist:</strong>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium import-success-text-primary">✅ Text Visibility</h4>
                  <ul className="space-y-1 import-success-text-secondary text-xs">
                    <li>• Dialog title clearly visible</li>
                    <li>• Record numbers readable</li>
                    <li>• Labels and descriptions clear</li>
                    <li>• Progress percentage visible</li>
                    <li>• File names readable</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium import-success-text-primary">✅ Color Contrast</h4>
                  <ul className="space-y-1 import-success-text-secondary text-xs">
                    <li>• Icons have proper contrast</li>
                    <li>• Success/warning colors visible</li>
                    <li>• Background/foreground readable</li>
                    <li>• Borders and separators clear</li>
                    <li>• Button text readable</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <p className="import-success-text-secondary text-xs">
                  <strong>How to test:</strong> Toggle antara light/dark mode dan klik setiap test case untuk melihat dialog import success. 
                  Pastikan semua text readable dan colors memiliki contrast yang cukup di kedua mode.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Success Dialog */}
      {currentTest && (
        <ImportSuccessDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          data={currentTest.data}
          onNavigate={(path) => {
            console.log('Navigate to:', path);
            setIsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}