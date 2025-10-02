import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Calendar,
  DollarSign,
  TrendingUp,
  Merge,
  Plus,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ExistingEndorsement {
  id: string;
  campaign_name: string;
  start_date: string;
  end_date: string;
  endorse_fee: number;
  actual_sales: number;
  total_commission: number;
  roi: number;
  product_sales: Array<{
    product_name: string;
    quantity: number;
    total_sales: number;
    commission: number;
  }>;
}

interface ProductSale {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalSales: number;
  commissionAmount: number;
}

interface MergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingEndorsements: ExistingEndorsement[];
  newEndorsementData: any;
  onMergeConfirm: (mergeData: any) => Promise<void>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export function AffiliateEndorseMergeDialog({
  open,
  onOpenChange,
  existingEndorsements = [],
  newEndorsementData,
  onMergeConfirm
}: MergeDialogProps) {
  const [selectedEndorsementId, setSelectedEndorsementId] = useState<string>('');
  const [mergeType, setMergeType] = useState<'extend' | 'replace'>('extend');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedEndorsement = existingEndorsements?.find(e => e.id === selectedEndorsementId);
  
  // Extract data from newEndorsementData with safe defaults
  const affiliateName = newEndorsementData?.affiliateName || '';
  const newEndDate = newEndorsementData?.endDate || '';
  const newProductSales = newEndorsementData?.productSales || [];
  const additionalEndorseFee = newEndorsementData?.endorseFee || 0;
  const additionalTargetSales = newEndorsementData?.targetSales || 0;
  
  // Calculate totals for new data with safe array check
  const newTotalSales = newProductSales?.reduce((sum, p) => sum + (p.totalSales || 0), 0) || 0;
  const newTotalCommission = newProductSales?.reduce((sum, p) => sum + (p.commissionAmount || 0), 0) || 0;

  // Calculate projected totals after merge
  const projectedTotalSales = (selectedEndorsement?.actual_sales || 0) + newTotalSales;
  const projectedEndorseFee = (selectedEndorsement?.endorse_fee || 0) + additionalEndorseFee;
  const projectedCommission = (selectedEndorsement?.total_commission || 0) + newTotalCommission;
  const projectedROI = projectedEndorseFee > 0 ? 
    ((projectedTotalSales - projectedEndorseFee) / projectedEndorseFee) * 100 : 0;

  const handleMergeConfirm = async () => {
    if (!selectedEndorsementId) {
      toast.error('Pilih endorsement yang akan digabung');
      return;
    }

    if (!newEndDate) {
      toast.error('Tanggal berakhir baru harus diisi');
      return;
    }

    try {
      setLoading(true);

      const mergeData = {
        existing_id: selectedEndorsementId,
        new_end_date: newEndDate,
        additional_endorse_fee: additionalEndorseFee,
        additional_target_sales: additionalTargetSales,
        new_product_sales: newProductSales?.map(product => ({
          productName: product.productName,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          totalSales: product.totalSales,
          commissionAmount: product.commissionAmount
        })) || [],
        notes_to_append: additionalNotes,
        merge_type: mergeType
      };

      await onMergeConfirm(mergeData);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error during merge:', error);
      toast.error('Gagal menggabungkan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-800">
            <Merge className="w-5 h-5" />
            Gabung Data Affiliate Endorsement
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Affiliate <strong>{affiliateName}</strong> sudah memiliki data sebelumnya. 
            Pilih data mana yang akan digabung dengan data baru.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Penggabungan Data Affiliate
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Data baru akan digabungkan dengan data yang sudah ada. 
                    Tanggal berakhir akan diperpanjang dan penjualan akan dijumlahkan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Select Existing Endorsement */}
          <div className="space-y-3">
            <Label>Pilih Data Endorsement yang Akan Digabung</Label>
            <Select 
              value={selectedEndorsementId} 
              onValueChange={setSelectedEndorsementId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih campaign endorsement..." />
              </SelectTrigger>
              <SelectContent>
                {existingEndorsements?.map((endorsement) => (
                  <SelectItem key={endorsement.id} value={endorsement.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{endorsement.campaign_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatDate(endorsement.start_date)} - {formatDate(endorsement.end_date)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatCurrency(endorsement.actual_sales)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Merge Type Selection */}
          <div className="space-y-3">
            <Label>Tipe Penggabungan</Label>
            <Select value={mergeType} onValueChange={(value: 'extend' | 'replace') => setMergeType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extend">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Extend - Gabungkan produk yang sama</span>
                  </div>
                </SelectItem>
                <SelectItem value="replace">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Replace - Tambah sebagai produk terpisah</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600">
              {mergeType === 'extend' 
                ? 'Produk dengan nama yang sama akan digabungkan quantity dan sales-nya'
                : 'Semua produk baru akan ditambahkan sebagai entry terpisah'
              }
            </p>
          </div>

          {/* Data Comparison */}
          {selectedEndorsement && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Data */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    Data Saat Ini
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span className="font-medium">
                      {formatDate(selectedEndorsement.start_date)} - {formatDate(selectedEndorsement.end_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(selectedEndorsement.endorse_fee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(selectedEndorsement.actual_sales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Komisi:</span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(selectedEndorsement.total_commission)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ROI:</span>
                    <span className={`font-medium ${selectedEndorsement.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedEndorsement.roi?.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* New Data */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                    <Plus className="w-4 h-4" />
                    Data Baru
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Extend to:</span>
                    <span className="font-medium">
                      {formatDate(newEndDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Additional Fee:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(additionalEndorseFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(newTotalSales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Komisi:</span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(newTotalCommission)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Produk:</span>
                    <span className="font-medium">
                      {newProductSales?.length || 0} item
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Projected Result */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                    <TrendingUp className="w-4 h-4" />
                    Hasil Gabungan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span className="font-medium">
                      {formatDate(selectedEndorsement.start_date)} - {formatDate(newEndDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Biaya:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(projectedEndorseFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Sales:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(projectedTotalSales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Komisi:</span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(projectedCommission)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>New ROI:</span>
                    <span className={`font-medium ${projectedROI > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {projectedROI.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Additional Fees and Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Biaya Endorsement Tambahan</Label>
              <Input
                type="number"
                value={additionalEndorseFee}
                onChange={(e) => {/* This is controlled by parent */}}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Target Sales Tambahan</Label>
              <Input
                type="number"
                value={additionalTargetSales}
                onChange={(e) => {/* This is controlled by parent */}}
                placeholder="0"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label>Catatan Tambahan (Optional)</Label>
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk penggabungan data ini..."
              className="min-h-[60px]"
            />
          </div>

          {/* Product Sales Summary */}
          {newProductSales?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Produk yang Akan Ditambahkan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {newProductSales?.map((product, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.productName}</span>
                        <Badge variant="outline" className="text-xs">
                          {product.quantity}x
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(product.totalSales)}</div>
                        <div className="text-xs text-gray-600">
                          Komisi: {formatCurrency(product.commissionAmount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button 
            onClick={handleMergeConfirm}
            disabled={!selectedEndorsementId || loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Menggabungkan...
              </>
            ) : (
              <>
                <Merge className="w-4 h-4 mr-2" />
                Gabungkan Data
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}