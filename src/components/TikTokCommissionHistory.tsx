import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  History, 
  Trash2, 
  Download, 
  Upload, 
  BarChart3, 
  Clock,
  TrendingUp,
  FileText,
  Copy,
  Archive
} from 'lucide-react';
import { useTikTokCommissionHistory } from '../hooks/useTikTokCommissionHistory';

interface TikTokCommissionHistoryProps {
  onApplyCalculation: (calculation: any) => void;
}

const TikTokCommissionHistory: React.FC<TikTokCommissionHistoryProps> = ({ onApplyCalculation }) => {
  const {
    history,
    removeCalculation,
    clearHistory,
    getTotalCalculations,
    getAverageSettlement,
    getMostUsedCommissions,
    exportHistory,
    importHistory
  } = useTikTokCommissionHistory();

  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActiveCommissionsCount = (calculation: any): number => {
    let count = 0;
    if (calculation.platformCommission > 0) count++;
    if (calculation.dynamicCommission > 0) count++;
    if (calculation.extraBoostCommission > 0) count++;
    if (calculation.cashbackCommission > 0) count++;
    if (calculation.affiliateCommission > 0) count++;
    return count;
  };

  const handleExport = () => {
    const data = exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiktok-commission-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importData.trim()) {
      const success = importHistory(importData);
      if (success) {
        setImportData('');
        setShowImport(false);
        alert('Riwayat berhasil diimpor!');
      } else {
        alert('Format file tidak valid. Pastikan file yang diimpor adalah hasil export dari aplikasi ini.');
      }
    }
  };

  const handleApplyCalculation = (calculation: any) => {
    onApplyCalculation({
      productPrice: calculation.productPrice,
      platformCommission: calculation.platformCommission,
      dynamicCommission: calculation.dynamicCommission,
      extraBoostCommission: calculation.extraBoostCommission,
      cashbackCommission: calculation.cashbackCommission,
      affiliateCommission: calculation.affiliateCommission
    });
  };

  const mostUsed = getMostUsedCommissions();

  return (
    <div className="space-y-6">
      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistik Perhitungan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {getTotalCalculations()}
              </div>
              <div className="text-xs text-muted-foreground">Total Perhitungan</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(getAverageSettlement())}
              </div>
              <div className="text-xs text-muted-foreground">Rata-rata Settlement</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(mostUsed.marketplace || 0).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Dinamis</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {(mostUsed.affiliate || 0).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Affiliate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Perhitungan
          </CardTitle>
          <CardDescription>
            Riwayat 20 perhitungan terakhir Anda
          </CardDescription>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            {history.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => {
                  if (confirm('Hapus semua riwayat perhitungan?')) {
                    clearHistory();
                  }
                }}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showImport && (
            <div className="mb-4 p-4 border border-border rounded-lg bg-muted/50">
              <Label htmlFor="importData" className="text-sm font-medium">
                Import Data JSON
              </Label>
              <textarea
                id="importData"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste exported JSON data here..."
                className="w-full mt-2 p-2 text-sm border border-border rounded-md h-32 resize-none"
              />
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" onClick={handleImport}>
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setShowImport(false);
                  setImportData('');
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada riwayat perhitungan</p>
              <p className="text-sm">Mulai hitung komisi untuk menyimpan riwayat</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {history.map((calculation, index) => (
                  <div
                    key={calculation.id}
                    className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(calculation.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {getActiveCommissionsCount(calculation)} komisi aktif
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCalculation(calculation.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Harga Produk</div>
                        <div className="font-medium">{formatCurrency(calculation.productPrice)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Settlement</div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(calculation.settlementAmount)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                      <div>
                        <div className="text-muted-foreground">Total Komisi</div>
                        <div className="text-red-600">
                          {formatCurrency(calculation.totalCommissionAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Net Profit Margin</div>
                        <div className="text-blue-600">
                          {(calculation.netProfitMargin || 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {(calculation.productName || calculation.notes) && (
                      <>
                        <Separator className="my-2" />
                        <div className="text-xs space-y-1">
                          {calculation.productName && (
                            <div>
                              <span className="text-muted-foreground">Produk: </span>
                              <span>{calculation.productName}</span>
                            </div>
                          )}
                          {calculation.notes && (
                            <div>
                              <span className="text-muted-foreground">Catatan: </span>
                              <span>{calculation.notes}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyCalculation(calculation)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Copy className="h-3 w-3" />
                        Gunakan
                      </Button>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        {(calculation.netProfitMargin || 0).toFixed(1)}% margin
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TikTokCommissionHistory;