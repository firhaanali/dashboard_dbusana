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
import { Upload, Download, Plus, Gift, Users, TrendingUp, DollarSign, Package, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { showAffiliateSamplesImportSuccess } from './EnhancedImportToast';
import { enhancedApiWrapper } from '../utils/enhancedApiWrapper';
import { useImportData } from '../contexts/ImportDataContext';
import { useLanguageUtils } from '../hooks/useLanguageUtils';

interface AffiliateSample {
  id: string;
  affiliate_name: string;
  affiliate_platform?: string;
  affiliate_contact?: string;
  product_name: string;
  product_sku?: string;
  quantity_given: number;
  product_cost: number;
  total_cost: number;
  shipping_cost: number;
  packaging_cost: number;
  campaign_name?: string;
  expected_reach?: number;
  content_type?: string;
  given_date: string;
  expected_content_date?: string;
  actual_content_date?: string;
  content_delivered: boolean;
  performance_notes?: string;
  roi_estimate?: number;
  status: string;
}

interface AffiliateSamplesAnalytics {
  totalSamples: number;
  totalQuantityGiven: number;
  totalProductCost: number;
  totalShippingCost: number;
  totalPackagingCost: number;
  totalInvestment: number;
  contentDelivered: number;
  contentDeliveryRate: number;
  averageCostPerSample: number;
  averageROI: number;
  totalExpectedReach: number;
}

// AffiliateSamplesManager - Database-driven component
export function AffiliateSamplesManager() {
  const [samples, setSamples] = useState<AffiliateSample[]>([]);
  const [analytics, setAnalytics] = useState<AffiliateSamplesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Import functionality and language support
  const { handleFileUpload, isImporting, importProgress } = useImportData();
  const { formatCurrency: formatCurrencyLocalized, t } = useLanguageUtils();
  const [newSample, setNewSample] = useState({
    affiliate_name: '',
    affiliate_platform: '',
    affiliate_contact: '',
    product_name: '',
    product_sku: '',
    quantity_given: 1,
    product_cost: 0,
    total_cost: 0,
    shipping_cost: 0,
    packaging_cost: 0,
    campaign_name: '',
    expected_reach: 0,
    content_type: '',
    given_date: new Date().toISOString().split('T')[0],
    expected_content_date: '',
    actual_content_date: '',
    content_delivered: false,
    performance_notes: '',
    roi_estimate: 0,
    status: 'sent'
  });

  const platforms = [
    { value: 'Instagram', label: 'Instagram' },
    { value: 'TikTok', label: 'TikTok' },
    { value: 'YouTube', label: 'YouTube' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Twitter', label: 'Twitter' }
  ];

  const statusTypes = [
    { value: 'planned', label: 'Planned', variant: 'secondary' as const },
    { value: 'sent', label: 'Sent', variant: 'default' as const },
    { value: 'delivered', label: 'Delivered', variant: 'default' as const },
    { value: 'content_created', label: 'Content Created', variant: 'default' as const },
    { value: 'completed', label: 'Completed', variant: 'default' as const }
  ];

  const contentTypes = [
    { value: 'post', label: 'Post' },
    { value: 'story', label: 'Story' },
    { value: 'video', label: 'Video' },
    { value: 'review', label: 'Review' },
    { value: 'unboxing', label: 'Unboxing' }
  ];

  const fetchSamplesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching affiliate samples data with params:', {
        period: selectedPeriod,
        platform: selectedPlatform,
        status: selectedStatus
      });

      const params = new URLSearchParams({
        affiliate_platform: selectedPlatform,
        status: selectedStatus,
        limit: '50'
      });

      const [dataResponse, analyticsResponse] = await Promise.all([
        enhancedApiWrapper(`/api/affiliate-samples?${params}`),
        enhancedApiWrapper(`/api/affiliate-samples/analytics?period=${selectedPeriod}&affiliate_platform=${selectedPlatform}`)
      ]);
      if (dataResponse.success && dataResponse.data) {
        console.log('✅ Affiliate samples data loaded successfully:', dataResponse.data.length, 'records');
        setSamples(dataResponse.data);
      } else {
        console.warn('⚠️ No affiliate samples data available');
        setSamples([]);
      }

      if (analyticsResponse.success && analyticsResponse.data?.overview) {
        console.log('✅ Affiliate samples analytics loaded successfully');
        setAnalytics(analyticsResponse.data.overview);
      } else {
        console.warn('⚠️ No affiliate samples analytics available');
        setAnalytics(null);
      }

    } catch (error) {
      console.error('❌ Error fetching affiliate samples data:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setSamples([]);
      setAnalytics(null);
      
      toast.error('Gagal memuat data affiliate samples', {
        description: 'Periksa koneksi backend dan pastikan data sudah diimport',
        action: {
          label: 'Coba Lagi',
          onClick: () => fetchSamplesData()
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSample = async () => {
    try {
      // Validation
      if (!newSample.affiliate_name.trim()) {
        toast.error('Masukkan nama affiliate yang valid');
        return;
      }
      
      if (!newSample.product_name.trim()) {
        toast.error('Masukkan nama produk yang valid');
        return;
      }

      if (newSample.quantity_given <= 0) {
        toast.error('Masukkan quantity yang valid');
        return;
      }

      if (newSample.product_cost <= 0) {
        toast.error('Masukkan HPP yang valid');
        return;
      }

      // Calculate total cost
      const totalCost = newSample.product_cost * newSample.quantity_given;
      const sampleData = {
        ...newSample,
        total_cost: totalCost,
        // Ensure dates are in correct format
        given_date: new Date(newSample.given_date).toISOString(),
        expected_content_date: newSample.expected_content_date ? new Date(newSample.expected_content_date).toISOString() : null,
        actual_content_date: newSample.actual_content_date ? new Date(newSample.actual_content_date).toISOString() : null
      };

      console.log('📝 Adding affiliate sample:', sampleData);

      const response = await enhancedApiWrapper('/api/affiliate-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData)
      });

      if (response.success) {
        toast.success('Data affiliate sample berhasil ditambahkan');
        setShowAddDialog(false);
        setNewSample({
          affiliate_name: '',
          affiliate_platform: '',
          affiliate_contact: '',
          product_name: '',
          product_sku: '',
          quantity_given: 1,
          product_cost: 0,
          total_cost: 0,
          shipping_cost: 0,
          packaging_cost: 0,
          campaign_name: '',
          expected_reach: 0,
          content_type: '',
          given_date: new Date().toISOString().split('T')[0],
          expected_content_date: '',
          actual_content_date: '',
          content_delivered: false,
          performance_notes: '',
          roi_estimate: 0,
          status: 'sent'
        });
        fetchSamplesData();
      } else {
        throw new Error(response.error || 'Gagal menambahkan data');
      }
    } catch (error) {
      console.error('Error adding sample:', error);
      toast.error('Gagal menambahkan data affiliate sample', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat menambahkan data'
      });
    }
  };

  useEffect(() => {
    fetchSamplesData();
  }, [selectedPeriod, selectedPlatform, selectedStatus]);

  const handleImportSamples = async (file: File) => {
    try {
      const result = await handleFileUpload(file, 'affiliate_samples');
      await fetchSamplesData(); // Refresh data after import
      
      // Show enhanced success toast
      const importedCount = result?.data?.imported || samples.length;
      const importToastData = {
        type: 'sales' as const, // Using sales as placeholder since affiliate samples isn't in the type union
        imported: importedCount,
        total: importedCount,
        fileName: file.name
      };
      showAffiliateSamplesImportSuccess(importToastData);
    } catch (error) {
      console.error('Error importing affiliate samples data:', error);
      toast.error('Gagal import data affiliate samples');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      console.log('📥 Downloading affiliate samples template...');
      
      const url = 'http://localhost:3001/api/templates/affiliate-samples-template.xlsx';
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
      link.download = 'affiliate-samples-template.xlsx';
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

  const getStatusBadge = (status: string) => {
    const statusType = statusTypes.find(s => s.value === status);
    return (
      <Badge variant={statusType?.variant || 'secondary'}>
        {statusType?.label || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Affiliate Samples</h1>
            {error && (
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                <Gift className="h-3 w-3 mr-1" />
                Connection Error
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Kelola pemberian produk sample ke affiliate untuk promosi dan review
            {error && (
              <span className="text-red-600 ml-2">
                • {error}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button
            onClick={() => document.getElementById('samples-file-input')?.click()}
            variant="outline"
            size="sm"
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import Data'}
          </Button>
          <input
            id="samples-file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImportSamples(file);
                e.target.value = '';
              }
            }}
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Sample
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Affiliate Sample</DialogTitle>
                <DialogDescription>
                  Tambahkan data pemberian sample baru ke affiliate
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="affiliate_name">Nama Affiliate</Label>
                    <Input
                      id="affiliate_name"
                      value={newSample.affiliate_name}
                      onChange={(e) => setNewSample({...newSample, affiliate_name: e.target.value})}
                      placeholder="Nama influencer/affiliate"
                    />
                  </div>
                  <div>
                    <Label htmlFor="affiliate_platform">Platform</Label>
                    <Select 
                      value={newSample.affiliate_platform} 
                      onValueChange={(value) => setNewSample({...newSample, affiliate_platform: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map(platform => (
                          <SelectItem key={platform.value} value={platform.value}>
                            {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="affiliate_contact">Kontak Affiliate</Label>
                    <Input
                      id="affiliate_contact"
                      value={newSample.affiliate_contact}
                      onChange={(e) => setNewSample({...newSample, affiliate_contact: e.target.value})}
                      placeholder="Email/phone/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaign_name">Nama Campaign</Label>
                    <Input
                      id="campaign_name"
                      value={newSample.campaign_name}
                      onChange={(e) => setNewSample({...newSample, campaign_name: e.target.value})}
                      placeholder="Nama kolaborasi/campaign"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product_name">Nama Produk</Label>
                    <Input
                      id="product_name"
                      value={newSample.product_name}
                      onChange={(e) => setNewSample({...newSample, product_name: e.target.value})}
                      placeholder="Produk yang diberikan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_sku">SKU Produk</Label>
                    <Input
                      id="product_sku"
                      value={newSample.product_sku}
                      onChange={(e) => setNewSample({...newSample, product_sku: e.target.value})}
                      placeholder="Kode SKU (opsional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity_given">Quantity</Label>
                    <Input
                      id="quantity_given"
                      type="number"
                      value={newSample.quantity_given}
                      onChange={(e) => setNewSample({...newSample, quantity_given: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_cost">HPP per Item</Label>
                    <Input
                      id="product_cost"
                      type="number"
                      value={newSample.product_cost}
                      onChange={(e) => setNewSample({...newSample, product_cost: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Total Cost</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {formatCurrency(newSample.product_cost * newSample.quantity_given)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping_cost">Biaya Shipping</Label>
                    <Input
                      id="shipping_cost"
                      type="number"
                      value={newSample.shipping_cost}
                      onChange={(e) => setNewSample({...newSample, shipping_cost: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="packaging_cost">Biaya Packaging</Label>
                    <Input
                      id="packaging_cost"
                      type="number"
                      value={newSample.packaging_cost}
                      onChange={(e) => setNewSample({...newSample, packaging_cost: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="content_type">Tipe Konten</Label>
                    <Select 
                      value={newSample.content_type} 
                      onValueChange={(value) => setNewSample({...newSample, content_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe konten" />
                      </SelectTrigger>
                      <SelectContent>
                        {contentTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expected_reach">Expected Reach</Label>
                    <Input
                      id="expected_reach"
                      type="number"
                      value={newSample.expected_reach}
                      onChange={(e) => setNewSample({...newSample, expected_reach: parseInt(e.target.value) || 0})}
                      placeholder="Perkiraan audience reach"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="given_date">Tanggal Diberikan</Label>
                    <Input
                      id="given_date"
                      type="date"
                      value={newSample.given_date}
                      onChange={(e) => setNewSample({...newSample, given_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expected_content_date">Expected Content Date</Label>
                    <Input
                      id="expected_content_date"
                      type="date"
                      value={newSample.expected_content_date}
                      onChange={(e) => setNewSample({...newSample, expected_content_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="actual_content_date">Actual Content Date</Label>
                    <Input
                      id="actual_content_date"
                      type="date"
                      value={newSample.actual_content_date}
                      onChange={(e) => setNewSample({...newSample, actual_content_date: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="content_delivered"
                      checked={newSample.content_delivered}
                      onChange={(e) => setNewSample({...newSample, content_delivered: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="content_delivered" className="text-sm">
                      Content Delivered
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={newSample.status} 
                      onValueChange={(value) => setNewSample({...newSample, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusTypes.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="roi_estimate">ROI Estimate (%)</Label>
                    <Input
                      id="roi_estimate"
                      type="number"
                      value={newSample.roi_estimate}
                      onChange={(e) => setNewSample({...newSample, roi_estimate: parseFloat(e.target.value) || 0})}
                      placeholder="Perkiraan ROI"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="performance_notes">Performance Notes</Label>
                  <Textarea
                    id="performance_notes"
                    value={newSample.performance_notes}
                    onChange={(e) => setNewSample({...newSample, performance_notes: e.target.value})}
                    placeholder="Catatan performa campaign"
                  />
                </div>

                <Button onClick={handleAddSample} className="w-full">
                  Tambah Sample
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[120px]">
              <Label>Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full">
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
            <div className="min-w-[120px]">
              <Label>Platform</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {platforms.map(platform => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {statusTypes.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalSamples || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.totalQuantityGiven || 0} items diberikan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.totalInvestment || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(analytics?.averageCostPerSample || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Delivery</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(analytics?.contentDeliveryRate || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.contentDelivered || 0} konten delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(analytics?.averageROI || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Dari campaign samples
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analytics?.totalExpectedReach || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">
                Expected audience reach
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Recent Affiliate Samples</CardTitle>
            <CardDescription>
              Daftar sample yang diberikan ke affiliate terbaru
              {samples.length > 0 && (
                <span className="ml-2 text-primary font-medium">
                  ({samples.length} records)
                </span>
              )}
            </CardDescription>
          </div>
          {samples.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSamplesData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading || isImporting ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                {isImporting && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {Math.round(importProgress || 0)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {isImporting ? 'Mengimport data affiliate samples...' : 'Memuat data affiliate samples...'}
                </p>
                {isImporting && (
                  <p className="text-xs text-muted-foreground">
                    Mohon tunggu proses import selesai
                  </p>
                )}
              </div>
              {!isImporting && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSamplesData}
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              )}
            </div>
          ) : samples.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Gift className="h-16 w-16 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">
                  Belum ada data affiliate samples
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Mulai dengan mengimport data atau menambahkan data affiliate sample secara manual
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <Button
                  onClick={() => document.getElementById('samples-file-input')?.click()}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
                <Button onClick={() => setShowAddDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Manual
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Tanggal</TableHead>
                    <TableHead className="min-w-[120px]">Affiliate</TableHead>
                    <TableHead className="min-w-[80px]">Platform</TableHead>
                    <TableHead className="min-w-[150px]">Produk</TableHead>
                    <TableHead className="min-w-[60px]">Qty</TableHead>
                    <TableHead className="min-w-[120px]">Total Cost</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[80px]">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samples.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {new Date(item.given_date).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[120px] truncate" title={item.affiliate_name}>
                          {item.affiliate_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.affiliate_platform || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate" title={item.product_name}>
                          {item.product_name}
                        </div>
                        {item.product_sku && (
                          <div className="text-xs text-muted-foreground">
                            SKU: {item.product_sku}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{item.quantity_given}</span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.total_cost + item.shipping_cost + item.packaging_cost)}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        {item.roi_estimate ? (
                          <Badge variant="secondary" className="text-xs">
                            {item.roi_estimate}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}