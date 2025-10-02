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
import { Upload, Download, Plus, DollarSign, Clock, CheckCircle, AlertTriangle, HandCoins } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { showReimbursementsImportSuccess } from './EnhancedImportToast';
import { enhancedApiWrapper } from '../utils/enhancedApiWrapper';
import { useImportData } from '../contexts/ImportDataContext';

interface Reimbursement {
  id: string;
  claim_id: string;
  reimbursement_type: string;
  claim_amount: number;
  approved_amount: number;
  received_amount: number;
  processing_fee: number;
  incident_date: string;
  claim_date: string;
  approval_date?: string;
  received_date?: string;
  affected_order_id?: string;
  product_name?: string;
  marketplace: string;
  status: string;
  notes?: string;
  evidence_provided?: string;
}

interface ReimbursementAnalytics {
  totalClaims: number;
  totalClaimAmount: number;
  totalApprovedAmount: number;
  totalReceivedAmount: number;
  totalProcessingFees: number;
  approvalRate: number;
  recoveryRate: number;
  averageClaimAmount: number;
  averageProcessingTime: number;
}

export function MarketplaceReimbursementManager() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [analytics, setAnalytics] = useState<ReimbursementAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Import functionality
  const { handleFileUpload, isImporting, importProgress } = useImportData();
  const [newReimbursement, setNewReimbursement] = useState({
    claim_id: '',
    reimbursement_type: 'lost_package',
    claim_amount: 0,
    approved_amount: 0,
    received_amount: 0,
    processing_fee: 0,
    incident_date: new Date().toISOString().split('T')[0],
    claim_date: new Date().toISOString().split('T')[0],
    affected_order_id: '',
    product_name: '',
    marketplace: '',
    status: 'pending',
    notes: '',
    evidence_provided: ''
  });

  const reimbursementTypes = [
    { value: 'lost_package', label: 'Paket Hilang' },
    { value: 'fake_checkout', label: 'Checkout Fiktif' },
    { value: 'platform_error', label: 'Error Platform' },
    { value: 'damage_in_transit', label: 'Rusak di Perjalanan' }
  ];

  const statusTypes = [
    { value: 'pending', label: 'Pending', variant: 'secondary' as const },
    { value: 'approved', label: 'Approved', variant: 'default' as const },
    { value: 'rejected', label: 'Rejected', variant: 'destructive' as const },
    { value: 'received', label: 'Received', variant: 'default' as const }
  ];

  const fetchReimbursementData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching reimbursement data with params:', {
        period: selectedPeriod,
        status: selectedStatus,
        marketplace: selectedMarketplace
      });

      const params = new URLSearchParams({
        status: selectedStatus,
        marketplace: selectedMarketplace,
        limit: '50'
      });

      const [dataResponse, analyticsResponse] = await Promise.all([
        enhancedApiWrapper(`/api/marketplace-reimbursements?${params}`),
        enhancedApiWrapper(`/api/marketplace-reimbursements/analytics?period=${selectedPeriod}&status=${selectedStatus}&marketplace=${selectedMarketplace}`)
      ]);

      if (dataResponse.success && dataResponse.data) {
        console.log('✅ Reimbursement data loaded successfully:', dataResponse.data.length, 'records');
        setReimbursements(dataResponse.data);
      } else {
        console.warn('⚠️ No reimbursement data available');
        setReimbursements([]);
      }

      if (analyticsResponse.success && analyticsResponse.data?.overview) {
        console.log('✅ Reimbursement analytics loaded successfully');
        setAnalytics(analyticsResponse.data.overview);
      } else {
        console.warn('⚠️ No reimbursement analytics available');
        setAnalytics(null);
      }

    } catch (error) {
      console.error('❌ Error fetching reimbursement data:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setReimbursements([]);
      setAnalytics(null);
      
      toast.error('Gagal memuat data reimbursement', {
        description: 'Pastikan backend server berjalan dan data sudah diimport'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReimbursement = async () => {
    try {
      const response = await enhancedApiWrapper('/api/marketplace-reimbursements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReimbursement)
      });

      if (response.success) {
        toast.success('Data reimbursement berhasil ditambahkan');
        setShowAddDialog(false);
        setNewReimbursement({
          claim_id: '',
          reimbursement_type: 'lost_package',
          claim_amount: 0,
          approved_amount: 0,
          received_amount: 0,
          processing_fee: 0,
          incident_date: new Date().toISOString().split('T')[0],
          claim_date: new Date().toISOString().split('T')[0],
          affected_order_id: '',
          product_name: '',
          marketplace: '',
          status: 'pending',
          notes: '',
          evidence_provided: ''
        });
        fetchReimbursementData();
      } else {
        throw new Error(response.error || 'Gagal menambahkan data');
      }
    } catch (error) {
      console.error('Error adding reimbursement:', error);
      toast.error('Gagal menambahkan data reimbursement');
    }
  };

  useEffect(() => {
    fetchReimbursementData();
  }, [selectedPeriod, selectedStatus, selectedMarketplace]);

  const handleImportReimbursements = async (file: File) => {
    try {
      console.log('📤 Starting marketplace reimbursements import:', file.name);
      
      // Validate file first
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        throw new Error('Format file tidak valid. Gunakan file Excel (.xlsx, .xls) atau CSV (.csv)');
      }
      
      if (file.size === 0) {
        throw new Error('File kosong. Pastikan file memiliki data yang valid');
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File terlalu besar. Maksimal ukuran file 10MB');
      }
      
      toast('Mengimpor data reimbursement...', { 
        description: `Processing ${file.name}...`,
        duration: 3000 
      });
      
      const result = await handleFileUpload(file, 'marketplace_reimbursements');
      
      if (result && result.success) {
        console.log('✅ Import successful:', result);
        
        // Refresh data after successful import
        await fetchReimbursementData();
        
        // Show enhanced success toast
        const importedCount = result?.data?.imported || result?.data?.processed || 0;
        const duplicateCount = result?.data?.duplicates || 0;
        const errorCount = result?.data?.errors || 0;
        
        const importToastData = {
          type: 'sales' as const, // Using sales as placeholder since reimbursements isn't in the type union
          imported: importedCount,
          total: importedCount + duplicateCount + errorCount,
          errors: errorCount,
          duplicates: duplicateCount,
          fileName: file.name
        };
        showReimbursementsImportSuccess(importToastData);
        
        if (duplicateCount > 0) {
          toast.warning(`${duplicateCount} data duplikat ditemukan`, {
            description: 'Data duplikat dilewati otomatis'
          });
        }
        
        if (errorCount > 0) {
          toast.warning(`${errorCount} data error ditemukan`, {
            description: 'Periksa format data di file Excel'
          });
        }
        
      } else {
        const errorMessage = result?.error || result?.message || 'Import gagal tanpa pesan error';
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('❌ Error importing reimbursement data:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Connection error';
      
      toast.error('Gagal import data reimbursement', {
        description: errorMessage
      });
      
      // If it's a validation error, suggest downloading template
      if (errorMessage.includes('format') || errorMessage.includes('column') || errorMessage.includes('header')) {
        setTimeout(() => {
          toast('💡 Tip: Download template untuk format yang benar', {
            duration: 5000,
            action: {
              label: 'Download Template',
              onClick: handleDownloadTemplate
            }
          });
        }, 2000);
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      console.log('📋 Downloading marketplace reimbursements template...');
      toast('Preparing template download...', { duration: 1500 });
      
      const url = 'http://localhost:3001/api/templates/marketplace-reimbursements-template.xlsx';
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
      link.download = 'marketplace-reimbursements-template.xlsx';
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

  const handleTestTemplate = async () => {
    try {
      console.log('🧪 Testing marketplace reimbursements template generation...');
      toast('Testing template generation...', { duration: 2000 });
      
      const response = await fetch('/api/templates', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const templateInfo = data.data?.templates?.find(
          (t: any) => t.name === 'Marketplace Reimbursements'
        );
        
        if (templateInfo) {
          console.log('✅ Template info:', templateInfo);
          toast.success('Template test berhasil!', {
            description: `${templateInfo.description} - ${templateInfo.status}`
          });
        } else {
          toast.warning('Template ditemukan tapi info tidak lengkap');
        }
      } else {
        throw new Error('Template API tidak tersedia');
      }
      
    } catch (error) {
      console.error('❌ Template test failed:', error);
      toast.error('Template test gagal', {
        description: error instanceof Error ? error.message : 'Connection error'
      });
    }
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
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Marketplace Reimbursement</h1>
            {error && (
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                <HandCoins className="h-3 w-3 mr-1" />
                Connection Error
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Kelola klaim reimbursement dari marketplace untuk paket hilang dan masalah lainnya
            {error && (
              <span className="text-red-600 ml-2">
                • {error}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button
            onClick={() => document.getElementById('reimbursement-file-input')?.click()}
            variant="outline"
            size="sm"
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import Data'}
          </Button>
          <input
            id="reimbursement-file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImportReimbursements(file);
                e.target.value = '';
              }
            }}
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Klaim
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Klaim Reimbursement</DialogTitle>
                <DialogDescription>
                  Buat klaim reimbursement baru untuk marketplace
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="claim_id">Claim ID</Label>
                    <Input
                      id="claim_id"
                      value={newReimbursement.claim_id}
                      onChange={(e) => setNewReimbursement({...newReimbursement, claim_id: e.target.value})}
                      placeholder="ID klaim dari marketplace"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marketplace">Marketplace</Label>
                    <Select 
                      value={newReimbursement.marketplace} 
                      onValueChange={(value) => setNewReimbursement({...newReimbursement, marketplace: value})}
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
                    <Label htmlFor="reimbursement_type">Tipe Reimbursement</Label>
                    <Select 
                      value={newReimbursement.reimbursement_type} 
                      onValueChange={(value) => setNewReimbursement({...newReimbursement, reimbursement_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reimbursementTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={newReimbursement.status} 
                      onValueChange={(value) => setNewReimbursement({...newReimbursement, status: value})}
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="affected_order_id">Order ID Terdampak</Label>
                    <Input
                      id="affected_order_id"
                      value={newReimbursement.affected_order_id}
                      onChange={(e) => setNewReimbursement({...newReimbursement, affected_order_id: e.target.value})}
                      placeholder="ID order yang terdampak"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_name">Nama Produk</Label>
                    <Input
                      id="product_name"
                      value={newReimbursement.product_name}
                      onChange={(e) => setNewReimbursement({...newReimbursement, product_name: e.target.value})}
                      placeholder="Nama produk terdampak"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="claim_amount">Claim Amount</Label>
                    <Input
                      id="claim_amount"
                      type="number"
                      value={newReimbursement.claim_amount}
                      onChange={(e) => setNewReimbursement({...newReimbursement, claim_amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="approved_amount">Approved Amount</Label>
                    <Input
                      id="approved_amount"
                      type="number"
                      value={newReimbursement.approved_amount}
                      onChange={(e) => setNewReimbursement({...newReimbursement, approved_amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="received_amount">Received Amount</Label>
                    <Input
                      id="received_amount"
                      type="number"
                      value={newReimbursement.received_amount}
                      onChange={(e) => setNewReimbursement({...newReimbursement, received_amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="incident_date">Tanggal Kejadian</Label>
                    <Input
                      id="incident_date"
                      type="date"
                      value={newReimbursement.incident_date}
                      onChange={(e) => setNewReimbursement({...newReimbursement, incident_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="claim_date">Tanggal Klaim</Label>
                    <Input
                      id="claim_date"
                      type="date"
                      value={newReimbursement.claim_date}
                      onChange={(e) => setNewReimbursement({...newReimbursement, claim_date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={newReimbursement.notes}
                    onChange={(e) => setNewReimbursement({...newReimbursement, notes: e.target.value})}
                    placeholder="Catatan tambahan"
                  />
                </div>

                <Button onClick={handleAddReimbursement} className="w-full">
                  Tambah Klaim
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
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
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
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalClaims || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(analytics?.totalClaimAmount || 0)} diklaim
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(analytics?.approvalRate || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(analytics?.totalApprovedAmount || 0)} disetujui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.recoveryRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(analytics.totalReceivedAmount)} diterima
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageProcessingTime} hari</div>
              <p className="text-xs text-muted-foreground">
                Rata-rata waktu proses
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reimbursement Claims</CardTitle>
          <CardDescription>
            Daftar klaim reimbursement terbaru
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
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Claim Amount</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reimbursements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      {item.claim_id || 'N/A'}
                    </TableCell>
                    <TableCell>{item.marketplace}</TableCell>
                    <TableCell>
                      {reimbursementTypes.find(t => t.value === item.reimbursement_type)?.label || item.reimbursement_type}
                    </TableCell>
                    <TableCell>{formatCurrency(item.claim_amount)}</TableCell>
                    <TableCell>{formatCurrency(item.received_amount)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {new Date(item.claim_date).toLocaleDateString('id-ID')}
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