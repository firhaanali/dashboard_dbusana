import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { AffiliateEndorseKPICarousel } from './AffiliateEndorseKPICarousel';
import { 
  Users,
  DollarSign,
  Plus,
  Calendar,
  TrendingUp,
  TrendingDown,
  Save,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Star,
  BarChart3,
  Target,
  Trash2,
  Package,
  Coins,
  Percent,
  Merge,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDateSimple } from '../utils/dateUtils';
import { logActivity } from '../utils/activityLogger';
import { AffiliateEndorseMergeDialog } from './AffiliateEndorseMergeDialog';
import { useProductHPP } from '../hooks/useProductHPP';

interface ProductSale {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalSales: number;
  commissionPercentage: number;
  commissionAmount: number;
  netAmount: number;
  hpp?: number; // HPP per unit
  totalHPP: number; // Total HPP (quantity * hpp)
  grossProfit: number; // Total Sales - Total HPP
  netProfit: number; // Gross Profit - Commission
}

interface EndorseEntry {
  id?: string;
  startDate: string;
  endDate: string;
  affiliateName: string;
  affiliateType: string;
  campaignName: string;
  endorseFee: number;
  targetSales: number;
  actualSales: number;
  paymentMethod: string;
  platform: string[];
  contentType: string;
  followers: number;
  engagement: number;
  reference?: string;
  notes?: string;
  status: string;
  roi?: number;
  productSales: ProductSale[];
  totalCommission: number;
  totalNetAmount: number;
}

interface CampaignSummary {
  totalSpent: number;
  totalSales: number;
  totalCommission: number;
  totalNetAmount: number;
  totalHPP: number; // Total HPP dari semua produk
  totalGrossProfit: number; // Total Sales - Total HPP
  totalNetProfit: number; // Gross Profit - Commission - Endorse Fee
  averageROI: number;
  activeEndorsers: number;
  completedCampaigns: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export function AffiliateEndorseManager() {
  const [loading, setLoading] = useState(true); // Start with loading = true
  const [endorseEntries, setEndorseEntries] = useState<EndorseEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [campaignSummary, setCampaignSummary] = useState<CampaignSummary>({
    totalSpent: 0,
    totalSales: 0,
    totalCommission: 0,
    totalNetAmount: 0,
    totalHPP: 0,
    totalGrossProfit: 0,
    totalNetProfit: 0,
    averageROI: 0,
    activeEndorsers: 0,
    completedCampaigns: 0
  });

  // HPP integration
  const { products: hppProducts, findProductByName } = useProductHPP();

  // Merge Dialog State
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [existingEndorsements, setExistingEndorsements] = useState<any[]>([]);
  const [pendingMergeData, setPendingMergeData] = useState<any>(null);
  
  // Form state for new endorse entry
  const [newEntry, setNewEntry] = useState<EndorseEntry>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    affiliateName: '',
    affiliateType: '',
    campaignName: '',
    endorseFee: 0,
    targetSales: 0,
    actualSales: 0,
    paymentMethod: '',
    platform: [],
    contentType: '',
    followers: 0,
    engagement: 0,
    reference: '',
    notes: '',
    status: 'active',
    productSales: [],
    totalCommission: 0,
    totalNetAmount: 0,
    roi: 0
  });

  // Configuration options
  const affiliateTypes = [
    'Micro Influencer (1K-100K)',
    'Macro Influencer (100K-1M)',
    'Mega Influencer (1M+)',
    'Content Creator',
    'Fashion Blogger',
    'Celebrity',
    'Brand Ambassador'
  ];

  const platforms = [
    'TikTok Shop',
    'Shopee',
    'Lazada',
    'Tokopedia'
  ];

  const contentTypes = [
    'Product Review',
    'Live Streaming',
    'TikTok Video',
    'Shopee Live',
    'Product Showcase',
    'Unboxing Video',
    'Try-on Review',
    'Multiple Content'
  ];

  const paymentMethods = [
    'Bank Transfer',
    'E-Wallet (Dana/OVO/Gopay)',
    'Cash',
    'Product Exchange',
    'Commission Based',
    'Hybrid (Fee + Commission)'
  ];

  const statusOptions = [
    'active',
    'completed',
    'cancelled',
    'pending'
  ];

  const handleInputChange = (field: keyof EndorseEntry, value: string | number | string[]) => {
    setNewEntry(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Auto-calculate ROI if both fees and sales are available
      if (field === 'endorseFee' || field === 'actualSales') {
        if (updated.endorseFee > 0 && updated.actualSales > 0) {
          updated.roi = ((updated.actualSales - updated.endorseFee) / updated.endorseFee) * 100;
        }
      }
      
      return updated;
    });
  };

  const addProductSale = () => {
    setNewEntry(prev => ({
      ...prev,
      productSales: [
        ...prev.productSales,
        {
          productName: '',
          quantity: 0,
          unitPrice: 0,
          totalSales: 0,
          commissionPercentage: 0,
          commissionAmount: 0,
          netAmount: 0,
          hpp: 0,
          totalHPP: 0,
          grossProfit: 0,
          netProfit: 0
        }
      ]
    }));
  };

  const updateProductSale = (index: number, field: keyof ProductSale, value: string | number) => {
    setNewEntry(prev => {
      const updatedProductSales = [...prev.productSales];
      
      // Update the specific field first
      if (field === 'productName') {
        updatedProductSales[index] = {
          ...updatedProductSales[index],
          [field]: String(value)
        };
        
        // Auto-lookup HPP when product name changes
        const productName = String(value);
        if (productName.trim()) {
          const hppProduct = findProductByName(productName);
          if (hppProduct) {
            updatedProductSales[index].hpp = hppProduct.hpp;
            console.log(`🔍 Found HPP for ${productName}: ${hppProduct.hpp}`);
          } else {
            updatedProductSales[index].hpp = 0;
            console.log(`⚠️ No HPP found for ${productName}`);
          }
        }
      } else {
        const numValue = Number(value);
        updatedProductSales[index] = {
          ...updatedProductSales[index],
          [field]: isNaN(numValue) ? 0 : numValue
        };
      }

      // Auto-calculate when quantity, unitPrice, commissionPercentage, or hpp changes
      if (field === 'quantity' || field === 'unitPrice' || field === 'commissionPercentage' || field === 'productName') {
        const quantity = updatedProductSales[index].quantity || 0;
        const unitPrice = updatedProductSales[index].unitPrice || 0;
        const commissionPercentage = updatedProductSales[index].commissionPercentage || 0;
        const hpp = updatedProductSales[index].hpp || 0;
        
        // Calculate total sales (quantity * unit price)
        const totalSales = quantity * unitPrice;
        updatedProductSales[index].totalSales = totalSales;
        
        // Calculate commission amount (total sales * commission percentage / 100)
        const commissionAmount = totalSales * (commissionPercentage / 100);
        updatedProductSales[index].commissionAmount = commissionAmount;
        
        // Calculate net amount (total sales - commission amount)
        const netAmount = totalSales - commissionAmount;
        updatedProductSales[index].netAmount = netAmount;
        
        // Calculate HPP values
        const totalHPP = quantity * hpp;
        updatedProductSales[index].totalHPP = totalHPP;
        
        // Calculate gross profit (total sales - total HPP)
        const grossProfit = totalSales - totalHPP;
        updatedProductSales[index].grossProfit = grossProfit;
        
        // Calculate net profit (gross profit - commission)
        const netProfit = grossProfit - commissionAmount;
        updatedProductSales[index].netProfit = netProfit;
      }

      // Calculate totals from all products
      const totalCommission = updatedProductSales.reduce((sum, product) => sum + (product.commissionAmount || 0), 0);
      const actualSales = updatedProductSales.reduce((sum, product) => sum + (product.totalSales || 0), 0);
      const totalNetAmount = updatedProductSales.reduce((sum, product) => sum + (product.netAmount || 0), 0);

      const result = {
        ...prev,
        productSales: updatedProductSales,
        totalCommission,
        actualSales,
        totalNetAmount
      };

      // Auto-calculate ROI when actualSales changes
      if (result.endorseFee > 0 && result.actualSales > 0) {
        result.roi = ((result.actualSales - result.endorseFee) / result.endorseFee) * 100;
      } else {
        result.roi = 0;
      }

      return result;
    });
  };

  const removeProductSale = (index: number) => {
    setNewEntry(prev => {
      const updatedProductSales = prev.productSales.filter((_, i) => i !== index);
      
      // Recalculate totals
      const totalCommission = updatedProductSales.reduce((sum, product) => sum + (product.commissionAmount || 0), 0);
      const actualSales = updatedProductSales.reduce((sum, product) => sum + (product.totalSales || 0), 0);
      const totalNetAmount = updatedProductSales.reduce((sum, product) => sum + (product.netAmount || 0), 0);

      const result = {
        ...prev,
        productSales: updatedProductSales,
        totalCommission,
        actualSales,
        totalNetAmount
      };

      // Recalculate ROI
      if (result.endorseFee > 0 && result.actualSales > 0) {
        result.roi = ((result.actualSales - result.endorseFee) / result.endorseFee) * 100;
      } else {
        result.roi = 0;
      }

      return result;
    });
  };

  const handlePlatformChange = (platform: string, checked: boolean) => {
    setNewEntry(prev => {
      const currentPlatforms = Array.isArray(prev.platform) ? prev.platform : [prev.platform].filter(Boolean);
      let updatedPlatforms;
      
      if (checked) {
        updatedPlatforms = [...currentPlatforms, platform];
      } else {
        updatedPlatforms = currentPlatforms.filter(p => p !== platform);
      }
      
      return {
        ...prev,
        platform: updatedPlatforms
      };
    });
  };

  // Fetch endorse entries with graceful error handling
  const fetchEndorseEntries = async (forceRefresh = false) => {
    try {
      if (forceRefresh || endorseEntries.length === 0) {
        setLoading(true);
      }
      
      const response = await fetch('http://localhost:3001/api/affiliate-endorse?limit=100&sortBy=created_at&sortOrder=desc', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data && result.data.endorsements) {
          const entries: EndorseEntry[] = result.data.endorsements.map((endorsement: any) => {
            
            // Handle product sales from stored JSON or database
            let productSales = [];
            let calculatedActualSales = endorsement.actual_sales || 0;
            let totalCommission = endorsement.total_commission || 0;
            
            if (endorsement.product_sales && endorsement.product_sales.length > 0) {
              // Use stored product sales data and recalculate totals
              productSales = endorsement.product_sales.map((product: any) => {
                const totalSales = product.totalSales || product.total_sales || 0;
                const commissionAmount = product.commissionAmount || product.commission || 0;
                const commissionPercentage = totalSales > 0 && commissionAmount > 0 
                  ? (commissionAmount / totalSales * 100) 
                  : (product.commissionPercentage || 0);
                const netAmount = totalSales - commissionAmount;
                const hpp = product.hpp || 0;
                const totalHPP = (product.quantity || 0) * hpp;
                const grossProfit = totalSales - totalHPP;
                const netProfit = grossProfit - commissionAmount;

                return {
                  productName: product.productName || product.product_name || '',
                  quantity: product.quantity || 0,
                  unitPrice: product.unitPrice || product.unit_price || 0,
                  totalSales,
                  commissionPercentage,
                  commissionAmount,
                  netAmount,
                  hpp,
                  totalHPP,
                  grossProfit,
                  netProfit
                };
              });
              
              // Recalculate totals from product sales for accuracy
              calculatedActualSales = productSales.reduce((sum: number, product: any) => sum + (product.totalSales || 0), 0);
              totalCommission = productSales.reduce((sum: number, product: any) => sum + (product.commissionAmount || 0), 0);
            }

            const totalNetAmount = productSales.reduce((sum: number, product: any) => sum + (product.netAmount || 0), 0);

            // Use calculated actual sales if available from products, otherwise use stored value
            const finalActualSales = calculatedActualSales;
            
            // Fix ROI: Recalculate based on actual sales and endorse fee
            let finalROI = endorsement.roi || 0;
            if (finalActualSales > 0 && endorsement.endorse_fee > 0) {
              finalROI = ((finalActualSales - endorsement.endorse_fee) / endorsement.endorse_fee) * 100;
            }

            const entry = {
              id: endorsement.id,
              startDate: endorsement.start_date,
              endDate: endorsement.end_date,
              affiliateName: endorsement.affiliate_name,
              affiliateType: endorsement.affiliate_type,
              campaignName: endorsement.campaign_name,
              endorseFee: endorsement.endorse_fee,
              targetSales: endorsement.target_sales,
              actualSales: finalActualSales, // Use calculated value from product sales
              paymentMethod: endorsement.payment_method,
              platform: endorsement.platform || [],
              contentType: endorsement.content_type,
              followers: endorsement.followers || 0,
              engagement: endorsement.engagement || 0,
              reference: endorsement.reference,
              notes: endorsement.notes,
              status: endorsement.status,
              productSales,
              totalCommission: totalCommission,
              totalNetAmount,
              roi: finalROI
            };

            return entry;
          });

          setEndorseEntries(entries);
          calculateCampaignSummary(entries);
        } else {
          setEndorseEntries([]);
          calculateCampaignSummary([]);
        }
      } else {
        console.warn('API not available, using fallback data');
        setEndorseEntries([]);
        calculateCampaignSummary([]);
      }
    } catch (error) {
      console.warn('Backend not available, using fallback data for affiliate endorse entries');
      // Use fallback empty data for clean dashboard display
      setEndorseEntries([]);
      calculateCampaignSummary([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateCampaignSummary = (entries: EndorseEntry[]) => {
    const totalSpent = entries.reduce((sum, entry) => sum + entry.endorseFee, 0);
    const totalSales = entries.reduce((sum, entry) => sum + entry.actualSales, 0);
    const totalCommission = entries.reduce((sum, entry) => sum + (entry.totalCommission || 0), 0);
    const totalNetAmount = entries.reduce((sum, entry) => sum + (entry.totalNetAmount || 0), 0);
    
    // Calculate HPP-based metrics
    const totalHPP = entries.reduce((sum, entry) => {
      return sum + (entry.productSales || []).reduce((productSum, product) => {
        return productSum + (product.totalHPP || 0);
      }, 0);
    }, 0);
    
    const totalGrossProfit = entries.reduce((sum, entry) => {
      return sum + (entry.productSales || []).reduce((productSum, product) => {
        return productSum + (product.grossProfit || 0);
      }, 0);
    }, 0);
    
    const totalNetProfit = totalGrossProfit - totalCommission - totalSpent;
    
    const averageROI = entries.length > 0 ? entries.reduce((sum, entry) => sum + (entry.roi || 0), 0) / entries.length : 0;
    const activeEndorsers = entries.filter(entry => entry.status === 'active').length;
    const completedCampaigns = entries.filter(entry => entry.status === 'completed').length;

    setCampaignSummary({
      totalSpent,
      totalSales,
      totalCommission,
      totalNetAmount,
      totalHPP,
      totalGrossProfit,
      totalNetProfit,
      averageROI,
      activeEndorsers,
      completedCampaigns
    });
  };

  // Load data on component mount and set up refresh interval
  useEffect(() => {
    fetchEndorseEntries(true); // Force initial load
    
    // Set up auto-refresh every 30 seconds when not loading
    const refreshInterval = setInterval(() => {
      if (!loading && !showAddForm) {
        fetchEndorseEntries();
      }
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI Carousel */}
      <AffiliateEndorseKPICarousel 
        campaignSummary={campaignSummary}
        loading={loading}
      />

      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-primary">Affiliate & Endorse Manager</h2>
          <p className="text-muted-foreground">
            Kelola campaign affiliate dan endorsement untuk D'Busana
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddForm(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Campaign
          </Button>
        </div>
      </div>

      {/* Add New Campaign Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Tambah Campaign Affiliate Endorse Baru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Nama Campaign *</Label>
                <Input
                  id="campaignName"
                  value={newEntry.campaignName}
                  onChange={(e) => handleInputChange('campaignName', e.target.value)}
                  placeholder="Nama campaign endorse"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliateName">Nama Affiliate/Endorser *</Label>
                <Input
                  id="affiliateName"
                  value={newEntry.affiliateName}
                  onChange={(e) => handleInputChange('affiliateName', e.target.value)}
                  placeholder="Nama influencer/affiliate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliateType">Tipe Affiliate</Label>
                <Select 
                  value={newEntry.affiliateType} 
                  onValueChange={(value) => handleInputChange('affiliateType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe affiliate" />
                  </SelectTrigger>
                  <SelectContent>
                    {affiliateTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endorseFee">Biaya Endorse *</Label>
                <Input
                  id="endorseFee"
                  type="number"
                  value={newEntry.endorseFee}
                  onChange={(e) => handleInputChange('endorseFee', Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Tanggal Mulai</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newEntry.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal Selesai</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newEntry.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>Platform *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platforms.map((platform) => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform}
                      checked={Array.isArray(newEntry.platform) ? newEntry.platform.includes(platform) : false}
                      onCheckedChange={(checked) => handlePlatformChange(platform, checked as boolean)}
                    />
                    <Label htmlFor={platform} className="text-sm">{platform}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Sales Section with HPP Integration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg">Detail Penjualan Produk</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addProductSale}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Produk
                </Button>
              </div>

              {newEntry.productSales.map((product, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    {/* Product Input Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Nama Produk</Label>
                        <Input
                          value={product.productName}
                          onChange={(e) => updateProductSale(index, 'productName', e.target.value)}
                          placeholder="Nama produk"
                        />
                        {product.hpp > 0 && (
                          <p className="text-xs text-green-600">✓ HPP: {formatCurrency(product.hpp)}/unit</p>
                        )}
                        {product.productName && product.hpp === 0 && (
                          <p className="text-xs text-orange-600">⚠️ HPP tidak ditemukan</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Kuantitas</Label>
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => updateProductSale(index, 'quantity', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Harga Satuan</Label>
                        <Input
                          type="number"
                          value={product.unitPrice}
                          onChange={(e) => updateProductSale(index, 'unitPrice', Number(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Komisi (%)</Label>
                        <Input
                          type="number"
                          value={product.commissionPercentage}
                          onChange={(e) => updateProductSale(index, 'commissionPercentage', Number(e.target.value))}
                          placeholder="0"
                          step="0.1"
                        />
                      </div>
                    </div>

                    {/* HPP & Profit Analysis for Product */}
                    {product.productName && (
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg space-y-2">
                        <Label className="text-sm font-medium text-blue-700">Analisis Profit per Produk</Label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-600">Total Sales</p>
                            <p className="text-sm font-medium text-blue-600">
                              {formatCurrency(product.totalSales)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600">Total HPP</p>
                            <p className="text-sm font-medium text-red-600">
                              {formatCurrency(product.totalHPP)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600">Gross Profit</p>
                            <p className={`text-sm font-bold ${
                              product.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(product.grossProfit)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600">Komisi</p>
                            <p className="text-sm font-medium text-orange-600">
                              {formatCurrency(product.commissionAmount)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600">Net Profit</p>
                            <p className={`text-sm font-bold ${
                              product.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(product.netProfit)}
                            </p>
                          </div>
                        </div>
                        {product.hpp === 0 && product.productName && (
                          <div className="flex items-center gap-2 text-orange-600 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            <span>HPP tidak ditemukan untuk produk ini. Profit tidak dapat dihitung akurat.</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeProductSale(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Summary */}
              {newEntry.productSales.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Total Penjualan</Label>
                      <p className="font-semibold text-blue-600">{formatCurrency(newEntry.actualSales)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Total Komisi</Label>
                      <p className="font-semibold text-orange-600">{formatCurrency(newEntry.totalCommission)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Net Amount</Label>
                      <p className="font-semibold">{formatCurrency(newEntry.totalNetAmount)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">ROI</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{newEntry.roi?.toFixed(1)}%</p>
                        {(newEntry.roi || 0) > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                disabled={loading}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Menyimpan...' : 'Simpan Campaign'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endorsement List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Daftar Campaign Affiliate & Endorse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {endorseEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada campaign affiliate & endorse</p>
                <p className="text-sm">Klik "Tambah Campaign" untuk membuat campaign pertama</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {endorseEntries.map((entry) => (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4>{entry.campaignName}</h4>
                          <Badge variant={
                            entry.status === 'active' ? 'default' :
                            entry.status === 'completed' ? 'secondary' :
                            entry.status === 'cancelled' ? 'destructive' : 'outline'
                          }>
                            {entry.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{entry.affiliateName}</p>
                        <p className="text-sm text-muted-foreground">{entry.affiliateType}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <span className={`text-sm ${(entry.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ROI: {(entry.roi || 0).toFixed(1)}%
                          </span>
                          {(entry.roi || 0) >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDateSimple(entry.startDate)} - {formatDateSimple(entry.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Biaya Endorse</Label>
                        <p className="text-sm">{formatCurrency(entry.endorseFee)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Penjualan Aktual</Label>
                        <p className="text-sm font-medium">{formatCurrency(entry.actualSales)}</p>
                        {entry.productSales && entry.productSales.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {entry.productSales.length} produk
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Komisi</Label>
                        <p className="text-sm">{formatCurrency(entry.totalCommission || 0)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Net Amount</Label>
                        <p className="text-sm">{formatCurrency(entry.totalNetAmount || 0)}</p>
                      </div>
                    </div>

                    {/* HPP & Profit Analysis for this entry */}
                    {entry.productSales && entry.productSales.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <Label className="text-xs font-medium text-blue-700 mb-2 block">Analisis Keuntungan HPP</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-600">Total HPP</p>
                            <p className="text-sm font-semibold text-red-600">
                              {formatCurrency(entry.productSales.reduce((sum, product) => sum + (product.totalHPP || 0), 0))}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600">Gross Profit</p>
                            <p className={`text-sm font-bold ${
                              entry.productSales.reduce((sum, product) => sum + (product.grossProfit || 0), 0) >= 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(entry.productSales.reduce((sum, product) => sum + (product.grossProfit || 0), 0))}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600">Net Profit</p>
                            <p className={`text-sm font-bold ${
                              entry.productSales.reduce((sum, product) => sum + (product.netProfit || 0), 0) >= 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(entry.productSales.reduce((sum, product) => sum + (product.netProfit || 0), 0))}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600">Final Profit</p>
                            <p className={`text-sm font-bold ${
                              (entry.productSales.reduce((sum, product) => sum + (product.netProfit || 0), 0) - entry.endorseFee) >= 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(entry.productSales.reduce((sum, product) => sum + (product.netProfit || 0), 0) - entry.endorseFee)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{formatNumber(entry.followers)} followers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>{entry.engagement}% engagement</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>{entry.platform.join(', ')}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}