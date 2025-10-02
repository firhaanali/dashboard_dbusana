import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  History, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Package,
  BarChart3,
  DollarSign,
  RefreshCw,
  FileCheck,
  Database,
  Activity,
  Target,
  Filter
} from 'lucide-react';
import { useImportHistory, ImportHistoryEntry } from '../hooks/useImportHistory';

export function ImportHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    history,
    loading,
    error,
    statistics,
    typeBreakdown,
    pagination
  } = useImportHistory({
    page: 1,
    limit: 50,
    type: selectedType || undefined,
    status: selectedStatus || undefined,
    autoRefresh: isOpen // Auto refresh when dialog is open
  });



  const getTypeIcon = (type: string) => {
    const icons = {
      sales: DollarSign,
      products: Package,
      stock: BarChart3,
      advertising: TrendingUp,
      'advertising-settlement': Target
    };
    
    const IconComponent = icons[type as keyof typeof icons] || FileText;
    return <IconComponent className="w-4 h-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      sales: 'text-green-600 dark:text-green-400',
      products: 'text-blue-600 dark:text-blue-400',
      stock: 'text-purple-600 dark:text-purple-400',
      advertising: 'text-orange-600 dark:text-orange-400',
      'advertising-settlement': 'text-pink-600 dark:text-pink-400'
    };
    
    return colors[type as keyof typeof colors] || 'text-gray-600 dark:text-gray-400';
  };

  const getTypeBgColor = (type: string) => {
    const colors = {
      sales: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
      products: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
      stock: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
      advertising: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
      'advertising-settlement': 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800'
    };
    
    return colors[type as keyof typeof colors] || 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700';
  };

  const getTypeDisplayName = (type: string) => {
    const names = {
      sales: 'Sales Data',
      products: 'Products Data',
      stock: 'Stock Data',
      advertising: 'Advertising Data',
      'advertising-settlement': 'Advertising Settlement'
    };
    
    return names[type as keyof typeof names] || type;
  };

  const getSuccessColor = (successRate: number) => {
    if (successRate === 100) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30';
    if (successRate >= 90) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30';
    if (successRate >= 75) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30';
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format numbers with K/M abbreviations for better space efficiency
  const formatNumberCompact = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toLocaleString('id-ID');
    }
  };

  // Truncate text with ellipsis
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getDaysSinceLastImport = () => {
    if (history.length === 0) return 0;
    const lastImport = new Date(history[0].timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastImport.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusBadgeStyle = (successRate: number) => {
    if (successRate === 100) return 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
    if (successRate >= 90) return 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    if (successRate >= 75) return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
  };



  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <History className="w-4 h-4" />
          Import History
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[95vw] md:max-w-5xl max-h-[90vh] md:max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Riwayat Import Data
              </DialogTitle>
              <DialogDescription className="dark:text-gray-300">
                History lengkap semua import data yang pernah dilakukan dengan detail statistik
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Enhanced Statistics Overview - Dark Mode Optimized */}
          {statistics && !error && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 min-w-0">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className="flex items-center justify-center mb-1 md:mb-2">
                    <Database className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-blue-700 dark:text-blue-300 truncate" title={statistics.total_imports.toString()}>
                    {statistics.total_imports}
                  </div>
                  <div className="text-xs md:text-sm text-blue-600 dark:text-blue-400 truncate">Total Imports</div>
                </CardContent>
              </Card>
              
              <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 min-w-0">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className="flex items-center justify-center mb-1 md:mb-2">
                    <FileCheck className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-green-700 dark:text-green-300 truncate" title={statistics.total_records_imported.toLocaleString('id-ID')}>
                    {statistics.total_records_imported > 999999 
                      ? `${(statistics.total_records_imported / 1000000).toFixed(1)}M`
                      : statistics.total_records_imported > 999
                      ? `${(statistics.total_records_imported / 1000).toFixed(1)}K`
                      : statistics.total_records_imported.toLocaleString('id-ID')
                    }
                  </div>
                  <div className="text-xs md:text-sm text-green-600 dark:text-green-400 truncate">Records Imported</div>
                </CardContent>
              </Card>
              
              <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 min-w-0">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className="flex items-center justify-center mb-1 md:mb-2">
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-purple-700 dark:text-purple-300 truncate">
                    {Math.round(statistics.average_success_rate)}%
                  </div>
                  <div className="text-xs md:text-sm text-purple-600 dark:text-purple-400 truncate">Avg Success Rate</div>
                </CardContent>
              </Card>
              
              <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 min-w-0">
                <CardContent className="p-3 md:p-4 text-center">
                  <div className="flex items-center justify-center mb-1 md:mb-2">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-orange-700 dark:text-orange-300 truncate">
                    {getDaysSinceLastImport()}
                  </div>
                  <div className="text-xs md:text-sm text-orange-600 dark:text-orange-400 truncate">Days Since Last Import</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filter and Action Bar - Dark Mode Optimized */}
          {!error && (
            <div className="border rounded-lg p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:justify-between items-start gap-3">
                {/* Type Breakdown Badges */}
                <div className="flex gap-1 md:gap-2 flex-wrap w-full md:w-auto">
                  {Object.entries(typeBreakdown).map(([type, data]) => (
                    <Badge 
                      key={type} 
                      variant="outline" 
                      className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 text-xs md:text-sm ${getTypeBgColor(type)} min-w-0`}
                    >
                      <div className={getTypeColor(type)}>
                        {getTypeIcon(type)}
                      </div>
                      <span className={`font-medium truncate max-w-[80px] md:max-w-none ${getTypeColor(type)}`} title={getTypeDisplayName(type)}>
                        {getTypeDisplayName(type)}
                      </span>
                      <span className="bg-white dark:bg-gray-700 rounded-full px-1.5 md:px-2 py-0.5 text-xs font-bold flex-shrink-0 text-gray-900 dark:text-gray-100">
                        {data.count}
                      </span>
                    </Badge>
                  ))}
                </div>
                

              </div>
            </div>
          )}

          {/* Import History List */}
          <ScrollArea className="h-[450px] pr-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">Loading import history...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mengambil data riwayat import</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Backend Tidak Tersedia</h3>
                <p className="text-red-600 dark:text-red-400 mb-4 max-w-md mx-auto">
                  Server backend belum running. Import history membutuhkan koneksi ke database.
                </p>
                <div className="space-y-3">
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md mx-auto">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">💡 Cara Menjalankan Backend:</h4>
                    <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 text-left">
                      <li>1. Buka terminal di folder <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">backend/</code></li>
                      <li>2. Jalankan: <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">npm run dev</code></li>
                      <li>3. Tunggu server running di port 3001</li>
                      <li>4. Refresh halaman ini</li>
                    </ol>
                  </div>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Halaman
                  </Button>
                </div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <History className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Belum ada riwayat import</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-1">Import data akan muncul di sini</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Silakan upload file Excel atau CSV untuk memulai</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <Card 
                    key={entry.id} 
                    className="border-l-4 hover:shadow-md transition-shadow duration-200 min-w-0 dark:hover:shadow-gray-900/50" 
                    style={{
                      borderLeftColor: (entry.success_rate || 0) === 100 ? '#10b981' : 
                                     (entry.success_rate || 0) >= 90 ? '#3b82f6' :
                                     (entry.success_rate || 0) >= 75 ? '#f59e0b' : '#ef4444'
                    }}
                  >
                    <CardContent className="p-3 md:p-4">
                      <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
                        <div className="flex items-start gap-3 md:gap-4 w-full md:flex-1">
                          {/* Type Icon */}
                          <div className={`p-2 md:p-3 rounded-lg ${getTypeBgColor(entry.import_type)} flex-shrink-0`}>
                            <div className={getTypeColor(entry.import_type)}>
                              {getTypeIcon(entry.import_type)}
                            </div>
                          </div>
                          
                          {/* Import Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base truncate" title={`${getTypeDisplayName(entry.import_type)} Import`}>
                                {getTypeDisplayName(entry.import_type)} Import
                              </span>
                              <Badge 
                                variant="outline"
                                className={`${getStatusBadgeStyle(entry.success_rate || 0)} font-medium text-xs flex-shrink-0 w-fit`}
                              >
                                {Math.round(entry.success_rate || 0)}%
                              </Badge>
                            </div>
                            
                            {/* Import Meta */}
                            <div className="space-y-1 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                                <span className="flex items-center gap-1 flex-shrink-0">
                                  <Calendar className="w-3 h-3" />
                                  <span className="truncate">{formatDate(entry.timestamp)}</span>
                                </span>
                                {entry.processing_time_ms && (
                                  <span className="flex items-center gap-1 flex-shrink-0">
                                    <Clock className="w-3 h-3" />
                                    {entry.processing_time_ms}ms
                                  </span>
                                )}
                              </div>
                              
                              {entry.file_name && (
                                <div className="flex items-center gap-1">
                                  <FileText className="w-3 h-3 flex-shrink-0" />
                                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate max-w-[200px] md:max-w-[300px] text-gray-900 dark:text-gray-100" title={entry.file_name}>
                                    {entry.file_name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Import Results */}
                        <div className="text-right w-full md:w-auto flex-shrink-0">
                          <div className="mb-2">
                            <div className="text-sm md:text-lg font-bold text-green-600 dark:text-green-400 truncate" title={`${entry.imported_records.toLocaleString('id-ID')} imported`}>
                              {entry.imported_records > 999999 
                                ? `${(entry.imported_records / 1000000).toFixed(1)}M imported`
                                : entry.imported_records > 999
                                ? `${(entry.imported_records / 1000).toFixed(1)}K imported`
                                : `${entry.imported_records.toLocaleString('id-ID')} imported`
                              }
                            </div>
                            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate" title={`dari ${entry.total_records.toLocaleString('id-ID')} total`}>
                              dari {entry.total_records > 999999 
                                ? `${(entry.total_records / 1000000).toFixed(1)}M`
                                : entry.total_records > 999
                                ? `${(entry.total_records / 1000).toFixed(1)}K`
                                : entry.total_records.toLocaleString('id-ID')
                              } total
                            </div>
                          </div>
                          
                          {/* Error/Duplicate Summary */}
                          {(entry.failed_records > 0 || entry.duplicate_records > 0) && (
                            <div className="flex flex-wrap gap-1 text-xs justify-end">
                              {entry.failed_records > 0 && (
                                <Badge variant="destructive" className="px-1.5 py-0.5 text-xs">
                                  {entry.failed_records} errors
                                </Badge>
                              )}
                              {entry.duplicate_records > 0 && (
                                <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
                                  {entry.duplicate_records} duplicates
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}