import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calendar, CalendarDays, Upload, Plus, TrendingDown, AlertCircle, Package, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { showReturnsImportSuccess } from './EnhancedImportToast';
import { enhancedApiWrapper } from '../utils/enhancedApiWrapper';
import { useImportData } from '../contexts/ImportDataContext';

interface ReturnsCancellation {
  id: string;
  type: 'return' | 'cancel';
  product_name: string;
  marketplace: string;
  returned_amount: number;
  refund_amount: number;
  restocking_fee: number;
  shipping_cost_loss: number;
  quantity_returned: number;
  original_price: number;
  return_date: string;
  reason: string;
  product_condition: string;
  resellable: boolean;
  created_at: string;
}

interface ReturnsAnalytics {
  totalReturns: number;
  totalReturnedAmount: number;
  totalRefundAmount: number;
  totalRefundLoss: number;
  totalRestockingFees: number;
  totalShippingLoss: number;
  totalQuantityReturned: number;
  averageReturnValue: number;
  resellableItems: number;
  resellableRate: number;
}

// Removed fallback data generators - using clean error handling

export function ReturnsAndCancellationsManager() {
  const [returnsData, setReturnsData] = useState<ReturnsCancellation[]>([]);
  const [analytics, setAnalytics] = useState<ReturnsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Import functionality
  const { handleFileUpload, isImporting, importProgress } = useImportData();
  const [newReturn, setNewReturn] = useState({
    type: 'return',
    product_name: '',
    marketplace: '',
    returned_amount: 0,
    refund_amount: 0,
    restocking_fee: 0,
    shipping_cost_loss: 0,
    quantity_returned: 1,
    original_price: 0,
    return_date: new Date().toISOString().split('T')[0],
    reason: '',
    product_condition: 'used',
    resellable: false
  });

  const fetchReturnsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching returns data with params:', {
        period: selectedPeriod,
        type: selectedType,
        marketplace: selectedMarketplace
      });

      const params = new URLSearchParams({
        type: selectedType,
        marketplace: selectedMarketplace,
        limit: '50'
      });

      // Fetch data from API
      const [dataResponse, analyticsResponse] = await Promise.all([
        enhancedApiWrapper(`/api/returns-cancellations?${params}`),
        enhancedApiWrapper(`/api/returns-cancellations/analytics?period=${selectedPeriod}&type=${selectedType}&marketplace=${selectedMarketplace}`)
      ]);

      // Handle data response
      if (dataResponse.success && dataResponse.data) {
        console.log('✅ Returns data loaded successfully:', dataResponse.data.length, 'records');
        setReturnsData(dataResponse.data);
      } else {
        console.warn('⚠️ Returns data response invalid');
        setReturnsData([]);
        setError('Invalid returns data response');
      }

      // Handle analytics response
      if (analyticsResponse.success && analyticsResponse.data?.overview) {
        console.log('✅ Analytics data loaded successfully');
        setAnalytics(analyticsResponse.data.overview);
      } else {
        console.warn('⚠️ Analytics data response invalid');
        setAnalytics(null);
        if (!error) setError('Invalid analytics data response');
      }

    } catch (error) {
      console.error('❌ Error fetching returns data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setReturnsData([]);
      setAnalytics(null);
      
      toast.error('Failed to load returns data', {
        description: 'Please ensure backend server is running and try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReturn = async () => {
    try {
      const response = await enhancedApiWrapper('/api/returns-cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReturn)
      });

      if (response.success) {
        toast.success('Data return/cancel berhasil ditambahkan');
        setShowAddDialog(false);
        setNewReturn({
          type: 'return',
          product_name: '',
          marketplace: '',
          returned_amount: 0,
          refund_amount: 0,
          restocking_fee: 0,
          shipping_cost_loss: 0,
          quantity_returned: 1,
          original_price: 0,
          return_date: new Date().toISOString().split('T')[0],
          reason: '',
          product_condition: 'used',
          resellable: false
        });
        fetchReturnsData();
      } else {
        throw new Error(response.error || 'Gagal menambahkan data');
      }
    } catch (error) {
      console.error('Error adding return:', error);
      toast.error('Gagal menambahkan data return/cancel');
    }
  };

  useEffect(() => {
    fetchReturnsData();
  }, [selectedPeriod, selectedType, selectedMarketplace]);

  const handleImportReturns = async (file: File) => {
    try {
      const result = await handleFileUpload(file, 'returns_and_cancellations');
      await fetchReturnsData(); // Refresh data after import
      
      // Show enhanced success toast
      const importedCount = result?.data?.imported || returnsData.length;
      const importToastData = {
        type: 'sales' as const, // Using sales as placeholder since returns isn't in the type union
        imported: importedCount,
        total: importedCount,
        fileName: file.name
      };
      showReturnsImportSuccess(importToastData);
    } catch (error) {
      console.error('Error importing returns data:', error);
      toast.error('Gagal import data returns/cancellations');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      console.log('📋 Attempting to download returns template...');
      
      // Use the correct backend endpoint for returns template
      const url = 'http://localhost:3001/api/templates/returns-cancellations-template.xlsx';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-development-only': 'true',
        },
      });
      
      if (!response.ok) {
        throw new Error('Template download failed');
      }
      
      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'returns-cancellations-template.xlsx';
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
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Returns & Cancellations</h1>
          <p className="text-muted-foreground">
            Monitor dan kelola return produk serta pembatalan pesanan
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button
            onClick={() => document.getElementById('returns-file-input')?.click()}
            variant="outline"
            size="sm"
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import Data'}
          </Button>
          <input
            id="returns-file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImportReturns(file);
                e.target.value = '';
              }
            }}
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Return/Cancel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah Return/Cancellation</DialogTitle>
                <DialogDescription>
                  Tambahkan data return atau cancellation baru
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipe</Label>
                    <Select 
                      value={newReturn.type} 
                      onValueChange={(value) => setNewReturn({...newReturn, type: value as 'return' | 'cancel'})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="return">Return</SelectItem>
                        <SelectItem value="cancel">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="marketplace">Marketplace</Label>
                    <Select 
                      value={newReturn.marketplace} 
                      onValueChange={(value) => setNewReturn({...newReturn, marketplace: value})}
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

                <div>
                  <Label htmlFor="product_name">Nama Produk</Label>
                  <Input
                    id="product_name"
                    value={newReturn.product_name}
                    onChange={(e) => setNewReturn({...newReturn, product_name: e.target.value})}
                    placeholder="Masukkan nama produk"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="returned_amount">Jumlah Return</Label>
                    <Input
                      id="returned_amount"
                      type="number"
                      value={newReturn.returned_amount}
                      onChange={(e) => setNewReturn({...newReturn, returned_amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="refund_amount">Jumlah Refund</Label>
                    <Input
                      id="refund_amount"
                      type="number"
                      value={newReturn.refund_amount}
                      onChange={(e) => setNewReturn({...newReturn, refund_amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity_returned">Jumlah Qty</Label>
                    <Input
                      id="quantity_returned"
                      type="number"
                      value={newReturn.quantity_returned}
                      onChange={(e) => setNewReturn({...newReturn, quantity_returned: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="return_date">Tanggal Return</Label>
                    <Input
                      id="return_date"
                      type="date"
                      value={newReturn.return_date}
                      onChange={(e) => setNewReturn({...newReturn, return_date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Alasan</Label>
                  <Textarea
                    id="reason"
                    value={newReturn.reason}
                    onChange={(e) => setNewReturn({...newReturn, reason: e.target.value})}
                    placeholder="Alasan return/cancel"
                  />
                </div>

                <Button onClick={handleAddReturn} className="w-full">
                  Tambah Data
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
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
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="cancel">Cancel</SelectItem>
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
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalReturns}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalQuantityReturned} items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Return Loss</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.totalRefundLoss)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(analytics.averageReturnValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resellable Rate</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.resellableRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.resellableItems} items dapat dijual kembali
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics.totalRestockingFees + analytics.totalShippingLoss)}
              </div>
              <p className="text-xs text-muted-foreground">
                Restocking + Shipping loss
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Returns & Cancellations</CardTitle>
          <CardDescription>
            Daftar return dan cancellation terbaru
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || isImporting ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              {isImporting && (
                <p className="ml-2 text-sm text-muted-foreground">
                  Importing data... {importProgress}%
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Return Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnsData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.return_date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'return' ? 'destructive' : 'secondary'}>
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">
                      {item.product_name}
                    </TableCell>
                    <TableCell>{item.marketplace}</TableCell>
                    <TableCell>{item.quantity_returned}</TableCell>
                    <TableCell>{formatCurrency(item.returned_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={item.resellable ? 'default' : 'outline'}>
                        {item.resellable ? 'Resellable' : 'Not Resellable'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}