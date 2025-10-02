import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Upload, Download, Plus, TrendingDown, Percent, AlertTriangle, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { showCommissionAdjustmentsImportSuccess } from './EnhancedImportToast';
import { enhancedApiWrapper } from '../utils/enhancedApiWrapper';
import { useImportData } from '../contexts/ImportDataContext';
import { useLanguageUtils } from '../hooks/useLanguageUtils';

interface CommissionAdjustment {
  id: string;
  original_order_id?: string;
  original_sales_id?: string;
  adjustment_type: string;
  reason?: string;
  original_commission: number;
  adjustment_amount: number;
  final_commission: number;
  marketplace: string;
  commission_rate?: number;
  dynamic_rate_applied: boolean;
  transaction_date: string;
  adjustment_date: string;
  product_name?: string;
  quantity: number;
  product_price: number;
}

interface CommissionAnalytics {
  totalAdjustments: number;
  totalOriginalCommission: number;
  totalAdjustmentAmount: number;
  totalFinalCommission: number;
  totalLoss: number;
  impactRate: number;
  averageAdjustment: number;
  averageCommissionRate: number;
  dynamicRateAffected: number;
  dynamicRatePercentage: number;
}

// CommissionAdjustmentsManager - Database-driven component

export function CommissionAdjustmentsManager() {
  const [adjustments, setAdjustments] = useState<CommissionAdjustment[]>([]);
  const [analytics, setAnalytics] = useState<CommissionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Import functionality
  const { handleFileUpload, isImporting, importProgress } = useImportData();
  const { formatCurrency: formatCurrencyLocalized, t } = useLanguageUtils();
  const [newAdjustment, setNewAdjustment] = useState({
    original_order_id: '',
    adjustment_type: 'return_commission_loss',
    reason: '',
    original_commission: 0,
    adjustment_amount: 0,
    final_commission: 0,
    marketplace: '',
    commission_rate: 0,
    dynamic_rate_applied: false,
    transaction_date: new Date().toISOString().split('T')[0],
    adjustment_date: new Date().toISOString().split('T')[0],
    product_name: '',
    quantity: 1,
    product_price: 0
  });

  const adjustmentTypes = [
    { value: 'return_commission_loss', label: 'Kehilangan Komisi dari Return' },
    { value: 'dynamic_commission', label: 'Komisi Dinamis' },
    { value: 'platform_penalty', label: 'Penalti Platform' }
  ];

  const fetchAdjustmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching commission adjustment data with params:', {
        period: selectedPeriod,
        type: selectedType,
        marketplace: selectedMarketplace
      });

      const params = new URLSearchParams({
        adjustment_type: selectedType,
        marketplace: selectedMarketplace,
        limit: '50'
      });

      const [dataResponse, analyticsResponse] = await Promise.all([
        enhancedApiWrapper(`/api/commission-adjustments?${params}`),
        enhancedApiWrapper(`/api/commission-adjustments/analytics?period=${selectedPeriod}&adjustment_type=${selectedType}&marketplace=${selectedMarketplace}`)
      ]);

      if (dataResponse.success && dataResponse.data) {
        console.log('✅ Commission adjustment data loaded successfully:', dataResponse.data.length, 'records');
        setAdjustments(dataResponse.data);
      } else {
        console.warn('⚠️ No commission adjustment data available');
        setAdjustments([]);
      }

      if (analyticsResponse.success && analyticsResponse.data?.overview) {
        console.log('✅ Commission adjustment analytics loaded successfully');
        setAnalytics(analyticsResponse.data.overview);
      } else {
        console.warn('⚠️ No commission adjustment analytics available');
        setAnalytics(null);
      }

    } catch (error) {
      console.error('❌ Error fetching commission adjustment data:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setAdjustments([]);
      setAnalytics(null);
      
      toast.error('Gagal memuat data commission adjustment', {
        description: 'Periksa koneksi backend dan pastikan data sudah diimport',
        action: {
          label: 'Coba Lagi',
          onClick: () => fetchAdjustmentData()
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdjustment = async () => {
    try {
      // Validation
      if (!newAdjustment.marketplace) {
        toast.error('Pilih marketplace terlebih dahulu');
        return;
      }
      
      if (!newAdjustment.original_order_id.trim()) {
        toast.error('Masukkan Order ID yang valid');
        return;
      }

      if (newAdjustment.original_commission === 0) {
        toast.error('Masukkan komisi asli yang valid');
        return;
      }

      // Calculate final commission
      const finalCommission = newAdjustment.original_commission + newAdjustment.adjustment_amount;
      const adjustmentData = {
        ...newAdjustment,
        final_commission: finalCommission,
        // Ensure dates are in correct format
        transaction_date: new Date(newAdjustment.transaction_date).toISOString(),
        adjustment_date: new Date(newAdjustment.adjustment_date).toISOString()
      };

      console.log('📝 Adding commission adjustment:', adjustmentData);

      const response = await enhancedApiWrapper('/api/commission-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustmentData)
      });

      if (response.success) {
        toast.success('Data commission adjustment berhasil ditambahkan');
        setShowAddDialog(false);
        setNewAdjustment({
          original_order_id: '',
          adjustment_type: 'return_commission_loss',
          reason: '',
          original_commission: 0,
          adjustment_amount: 0,
          final_commission: 0,
          marketplace: '',
          commission_rate: 0,
          dynamic_rate_applied: false,
          transaction_date: new Date().toISOString().split('T')[0],
          adjustment_date: new Date().toISOString().split('T')[0],
          product_name: '',
          quantity: 1,
          product_price: 0
        });
        fetchAdjustmentData();
      } else {
        throw new Error(response.error || 'Gagal menambahkan data');
      }
    } catch (error) {
      console.error('Error adding commission adjustment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal menambahkan data commission adjustment';
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchAdjustmentData();
  }, [selectedPeriod, selectedType, selectedMarketplace]);

  const handleImportAdjustments = async (file: File) => {
    try {
      const result = await handleFileUpload(file, 'commission_adjustments');
      await fetchAdjustmentData(); // Refresh data after import
      
      // Show enhanced success toast
      const importedCount = result?.data?.imported || adjustments.length;
      const importToastData = {
        type: 'sales' as const, // Using sales as placeholder since commission adjustments isn't in the type union
        imported: importedCount,
        total: importedCount,
        fileName: file.name
      };
      showCommissionAdjustmentsImportSuccess(importToastData);
    } catch (error) {
      console.error('Error importing commission adjustment data:', error);
      toast.error('Gagal import data commission adjustment');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      console.log('📋 Downloading commission adjustments template...');
      
      const url = 'http://localhost:3001/api/templates/commission-adjustments-template.xlsx';
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
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'commission-adjustments-template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Template downloaded successfully!');
      
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Template download failed', {
        description: 'Backend connection issue. Please check if backend is running.'
      });
    }
  };

  const formatCurrency = (amount: number) => {
    // Use localized currency formatting from useLanguageUtils
    return formatCurrencyLocalized(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Commission Adjustments</h1>
            {error && (
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                <TrendingDown className="h-3 w-3 mr-1" />
                Connection Error
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Kelola penyesuaian komisi dari platform marketplace dan kebijakan dinamis
            {error && (
              <span className="text-red-600 ml-2">
                • {error}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchAdjustmentData} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button
            onClick={() => document.getElementById('adjustment-file-input')?.click()}
            variant="outline"
            size="sm"
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import Data'}
          </Button>
          <input
            id="adjustment-file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImportAdjustments(file);
                e.target.value = '';
              }
            }}
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Commission Adjustment</DialogTitle>
                <DialogDescription>
                  Tambahkan penyesuaian komisi baru
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adjustment_type">Tipe Adjustment</Label>
                    <Select 
                      value={newAdjustment.adjustment_type} 
                      onValueChange={(value) => setNewAdjustment({...newAdjustment, adjustment_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {adjustmentTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="marketplace">Marketplace</Label>
                    <Select 
                      value={newAdjustment.marketplace} 
                      onValueChange={(value) => setNewAdjustment({...newAdjustment, marketplace: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih marketplace" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TikTok Shop">TikTok Shop</SelectItem>
                        <SelectItem value="Shopee">Shopee</SelectItem>
                        <SelectItem value="Tokopedia">Tokopedia</SelectItem>
                        <SelectItem value="Lazada">Lazada</SelectItem>
                        <SelectItem value="Blibli">Blibli</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="original_order_id">Order ID Asli</Label>
                    <Input
                      id="original_order_id"
                      value={newAdjustment.original_order_id}
                      onChange={(e) => setNewAdjustment({...newAdjustment, original_order_id: e.target.value})}
                      placeholder="ID order yang terdampak"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_name">Nama Produk</Label>
                    <Input
                      id="product_name"
                      value={newAdjustment.product_name}
                      onChange={(e) => setNewAdjustment({...newAdjustment, product_name: e.target.value})}
                      placeholder="Nama produk"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="original_commission">Komisi Asli</Label>
                    <Input
                      id="original_commission"
                      type="number"
                      value={newAdjustment.original_commission}
                      onChange={(e) => setNewAdjustment({...newAdjustment, original_commission: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adjustment_amount">Jumlah Adjustment</Label>
                    <Input
                      id="adjustment_amount"
                      type="number"
                      value={newAdjustment.adjustment_amount}
                      onChange={(e) => setNewAdjustment({...newAdjustment, adjustment_amount: parseFloat(e.target.value) || 0})}
                      placeholder="Negatif untuk pengurangan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commission_rate">Rate Komisi (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      step="0.01"
                      value={newAdjustment.commission_rate}
                      onChange={(e) => setNewAdjustment({...newAdjustment, commission_rate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newAdjustment.quantity}
                      onChange={(e) => setNewAdjustment({...newAdjustment, quantity: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_price">Harga Produk</Label>
                    <Input
                      id="product_price"
                      type="number"
                      value={newAdjustment.product_price}
                      onChange={(e) => setNewAdjustment({...newAdjustment, product_price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="dynamic_rate_applied"
                      checked={newAdjustment.dynamic_rate_applied}
                      onChange={(e) => setNewAdjustment({...newAdjustment, dynamic_rate_applied: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="dynamic_rate_applied" className="text-sm">
                      Dynamic Rate
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transaction_date">Tanggal Transaksi</Label>
                    <Input
                      id="transaction_date"
                      type="date"
                      value={newAdjustment.transaction_date}
                      onChange={(e) => setNewAdjustment({...newAdjustment, transaction_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adjustment_date">Tanggal Adjustment</Label>
                    <Input
                      id="adjustment_date"
                      type="date"
                      value={newAdjustment.adjustment_date}
                      onChange={(e) => setNewAdjustment({...newAdjustment, adjustment_date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Alasan</Label>
                  <Textarea
                    id="reason"
                    value={newAdjustment.reason}
                    onChange={(e) => setNewAdjustment({...newAdjustment, reason: e.target.value})}
                    placeholder="Alasan adjustment"
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">Komisi Final:</div>
                  <div className="text-lg font-bold">
                    {formatCurrency(newAdjustment.original_commission + newAdjustment.adjustment_amount)}
                  </div>
                </div>

                <Button onClick={handleAddAdjustment} className="w-full">
                  Tambah Adjustment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <Label>Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 Hari</SelectItem>
                  <SelectItem value="30d">30 Hari</SelectItem>
                  <SelectItem value="90d">90 Hari</SelectItem>
                  <SelectItem value="1y">1 Tahun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipe</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {adjustmentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Marketplace</Label>
              <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="TikTok Shop">TikTok Shop</SelectItem>
                  <SelectItem value="Shopee">Shopee</SelectItem>
                  <SelectItem value="Tokopedia">Tokopedia</SelectItem>
                  <SelectItem value="Lazada">Lazada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loss</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(analytics.totalLoss)}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalAdjustments} adjustments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impact Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.impactRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                dari komisi asli terdampak
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dynamic Rate Impact</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.dynamicRatePercentage.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.dynamicRateAffected} dari dynamic rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Adjustment</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.averageAdjustment)}</div>
              <p className="text-xs text-muted-foreground">
                per adjustment
              </p>
            </CardContent>
          </Card>
        </div>
      ) : !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No analytics data available</p>
              <p className="text-xs">Import commission adjustment data to see analytics</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commission Adjustments</CardTitle>
          <CardDescription>
            Daftar penyesuaian komisi terbaru
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || isImporting ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isImporting ? 'Importing Commission Adjustment Data...' : 'Loading Commission Adjustment Data...'}
                </p>
                {isImporting && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Progress: {importProgress}%
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Komisi Asli</TableHead>
                  <TableHead>Adjustment</TableHead>
                  <TableHead>Komisi Final</TableHead>
                  <TableHead>Dynamic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.length > 0 ? (
                  adjustments.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.adjustment_date).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>{item.marketplace}</TableCell>
                      <TableCell>
                        {adjustmentTypes.find(t => t.value === item.adjustment_type)?.label || item.adjustment_type}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.original_order_id || 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(item.original_commission)}</TableCell>
                      <TableCell className={item.adjustment_amount < 0 ? 'text-destructive' : 'text-green-600'}>
                        {formatCurrency(item.adjustment_amount)}
                      </TableCell>
                      <TableCell>{formatCurrency(item.final_commission)}</TableCell>
                      <TableCell>
                        {item.dynamic_rate_applied && (
                          <Badge variant="secondary" className="text-xs">
                            Dynamic
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {error ? (
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                          <p>Tidak dapat memuat data commission adjustment</p>
                          <p className="text-xs">{error}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={fetchAdjustmentData}
                            className="mt-2"
                          >
                            Coba Lagi
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <DollarSign className="h-8 w-8 text-muted-foreground" />
                          <p>Belum ada data commission adjustment</p>
                          <p className="text-xs">Import data atau tambah adjustment manual</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}