import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calculator, TrendingUp, Percent, DollarSign, RefreshCw, Save, History, Database, Package } from 'lucide-react';
import TikTokCommissionTemplates from './TikTokCommissionTemplates';
import TikTokCommissionHistory from './TikTokCommissionHistory';
import TikTokProductHPPManager from './TikTokProductHPPManager';
import { useTikTokCommissionHistory } from '../hooks/useTikTokCommissionHistory';
import { useProductHPP, ProductHPP } from '../hooks/useProductHPP';

interface CommissionInputs {
  productPrice: number;
  platformCommission: number;
  dynamicCommission: number;
  extraBoostCommission: number;
  cashbackCommission: number;
  affiliateCommission: number;
}

interface ExtendedCalculationResult extends CalculationResult {
  hpp?: number;
  actualProfit?: number;
  actualProfitMargin?: number;
}

interface CalculationResult {
  totalCommissionAmount: number;
  totalCommissionPercentage: number;
  settlementAmount: number;
  netProfitMargin: number;
}

const TikTokCommissionCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CommissionInputs>({
    productPrice: 0,
    platformCommission: 0,
    dynamicCommission: 0,
    extraBoostCommission: 0,
    cashbackCommission: 0,
    affiliateCommission: 0
  });

  const [result, setResult] = useState<ExtendedCalculationResult>({
    totalCommissionAmount: 0,
    totalCommissionPercentage: 0,
    settlementAmount: 0,
    netProfitMargin: 0,
    hpp: 0,
    actualProfit: 0,
    actualProfitMargin: 0
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [productName, setProductName] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('calculator');
  const [selectedProduct, setSelectedProduct] = useState<ProductHPP | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  // Fixed processing fee
  const PROCESSING_FEE = 1250;

  const { addCalculation } = useTikTokCommissionHistory();
  const { products, searchProducts } = useProductHPP();

  // Auto calculate when inputs change
  useEffect(() => {
    calculateCommissions();
  }, [inputs, selectedProduct]);

  const calculateCommissions = () => {
    if (inputs.productPrice <= 0) {
      setResult({
        totalCommissionAmount: 0,
        totalCommissionPercentage: 0,
        settlementAmount: 0,
        netProfitMargin: 0,
        hpp: selectedProduct?.hpp || 0,
        actualProfit: 0,
        actualProfitMargin: 0
      });
      return;
    }

    setIsCalculating(true);

    // Calculate commission amounts
    const platformAmount = (inputs.productPrice * inputs.platformCommission) / 100;
    const dynamicAmount = (inputs.productPrice * inputs.dynamicCommission) / 100;
    const extraBoostAmount = (inputs.productPrice * inputs.extraBoostCommission) / 100;
    const cashbackAmount = (inputs.productPrice * inputs.cashbackCommission) / 100;
    const affiliateAmount = (inputs.productPrice * inputs.affiliateCommission) / 100;

    const totalCommissionAmount = 
      platformAmount +
      dynamicAmount + 
      extraBoostAmount + 
      cashbackAmount + 
      affiliateAmount;

    // Deduct commissions and processing fee from product price
    const settlementAmount = inputs.productPrice - totalCommissionAmount - PROCESSING_FEE;
    const totalCommissionPercentage = (totalCommissionAmount / inputs.productPrice) * 100;
    const netProfitMargin = (settlementAmount / inputs.productPrice) * 100;

    // Calculate actual profit if HPP is available (from selected product only)
    const hpp = selectedProduct?.hpp || 0;
    const actualProfit = hpp > 0 ? settlementAmount - hpp : 0;
    const actualProfitMargin = hpp > 0 && settlementAmount > 0 ? (actualProfit / inputs.productPrice) * 100 : 0;

    setTimeout(() => {
      setResult({
        totalCommissionAmount,
        totalCommissionPercentage,
        settlementAmount,
        netProfitMargin,
        hpp,
        actualProfit,
        actualProfitMargin
      });
      setIsCalculating(false);
    }, 300);
  };

  const handleInputChange = (field: keyof CommissionInputs, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setInputs(prev => ({
      ...prev,
      [field]: Math.max(0, numericValue) // Ensure non-negative values
    }));
  };

  const resetCalculator = () => {
    setInputs({
      productPrice: 0,
      platformCommission: 0,
      dynamicCommission: 0,
      extraBoostCommission: 0,
      cashbackCommission: 0,
      affiliateCommission: 0
    });
    setSelectedProduct(null);
    setSelectedProductId('');
    setProductName('');
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setProductName(product.nama_produk);
      // Optional: Auto-fill product price if available
      // setInputs(prev => ({ ...prev, productPrice: product.suggested_price || prev.productPrice }));
    }
  };

  const handleProductSelectFromHPPManager = (product: ProductHPP) => {
    setSelectedProduct(product);
    setSelectedProductId(product.id);
    setProductName(product.nama_produk);
    setActiveTab('calculator');
  };

  const applyTemplate = (template: Omit<CommissionInputs, 'productPrice' | 'platformCommission' | 'dynamicCommission' | 'extraBoostCommission' | 'cashbackCommission' | 'affiliateCommission'> & CommissionInputs) => {
    setInputs(template);
  };

  const saveCalculation = () => {
    if (inputs.productPrice <= 0) {
      alert('Masukkan harga produk terlebih dahulu');
      return;
    }

    const calculationId = addCalculation({
      productPrice: inputs.productPrice,
      platformCommission: inputs.platformCommission,
      dynamicCommission: inputs.dynamicCommission,
      extraBoostCommission: inputs.extraBoostCommission,
      cashbackCommission: inputs.cashbackCommission,
      affiliateCommission: inputs.affiliateCommission,
      totalCommissionAmount: result.totalCommissionAmount,
      settlementAmount: result.settlementAmount,
      netProfitMargin: result.netProfitMargin,
      productName: productName.trim() || undefined,
      notes: notes.trim() || undefined,
      processingFee: PROCESSING_FEE
    });

    // Clear optional fields after saving
    setProductName('');
    setNotes('');
    
    // Switch to history tab to show saved calculation
    setActiveTab('history');
  };

  const applyHistoryCalculation = (calculation: CommissionInputs) => {
    setInputs(calculation);
    setActiveTab('calculator');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(2)}%`;
  };

  const getCommissionBreakdown = () => {
    if (inputs.productPrice <= 0) return [];

    return [
      {
        name: 'Komisi Platform',
        percentage: inputs.platformCommission,
        amount: (inputs.productPrice * inputs.platformCommission) / 100
      },
      {
        name: 'Komisi Dinamis',
        percentage: inputs.dynamicCommission,
        amount: (inputs.productPrice * inputs.dynamicCommission) / 100
      },
      {
        name: 'Komisi Xtra Boost Program',
        percentage: inputs.extraBoostCommission,
        amount: (inputs.productPrice * inputs.extraBoostCommission) / 100
      },
      {
        name: 'Komisi Cashback',
        percentage: inputs.cashbackCommission,
        amount: (inputs.productPrice * inputs.cashbackCommission) / 100
      },
      {
        name: 'Komisi Affiliate',
        percentage: inputs.affiliateCommission,
        amount: (inputs.productPrice * inputs.affiliateCommission) / 100
      },
      {
        name: 'Biaya Pemrosesan',
        percentage: 0,
        amount: PROCESSING_FEE,
        isFixed: true
      }
    ].filter(item => item.percentage > 0 || item.isFixed);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kalkulator Komisi TikTok</h1>
          <p className="text-muted-foreground">
            Hitung settlement amount setelah dikurangi berbagai komisi TikTok
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={resetCalculator}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Kalkulator
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database HPP
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Riwayat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Input Perhitungan
            </CardTitle>
            <CardDescription>
              Masukkan harga produk dan persentase komisi yang berlaku
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="productSelect" className="text-sm font-medium">
                Pilih Produk (Opsional)
              </Label>
              <Select value={selectedProductId} onValueChange={handleProductSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk dari database HPP" />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <SelectItem value="no-products" disabled>
                      Belum ada produk di database
                    </SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{product.nama_produk}</span>
                          <Badge variant="secondary" className="ml-2">
                            HPP: {formatCurrency(product.hpp)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <Package className="h-4 w-4 text-blue-600" />
                  <div className="text-sm">
                    <span className="font-medium">{selectedProduct.nama_produk}</span>
                    <span className="text-muted-foreground ml-2">
                      HPP: {formatCurrency(selectedProduct.hpp)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Product Price - Required */}
            <div className="space-y-2">
              <Label htmlFor="productPrice" className="text-sm font-medium">
                Harga Produk <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productPrice"
                type="number"
                placeholder="169000"
                value={inputs.productPrice || ''}
                onChange={(e) => handleInputChange('productPrice', e.target.value)}
                className="text-right"
              />
              <p className="text-xs text-muted-foreground">
                Harga jual produk dalam Rupiah
              </p>
            </div>

            <Separator />

            {/* Commission Inputs - All Optional */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Persentase Komisi (Opsional)
              </h4>

              {/* Platform Commission */}
              <div className="space-y-2">
                <Label htmlFor="platformCommission">Komisi Platform (%)</Label>
                <Input
                  id="platformCommission"
                  type="number"
                  step="0.1"
                  placeholder="3"
                  value={inputs.platformCommission || ''}
                  onChange={(e) => handleInputChange('platformCommission', e.target.value)}
                  className="text-right"
                />
              </div>

              {/* Dynamic Commission */}
              <div className="space-y-2">
                <Label htmlFor="dynamicCommission">Komisi Dinamis (%)</Label>
                <Input
                  id="dynamicCommission"
                  type="number"
                  step="0.1"
                  placeholder="8"
                  value={inputs.dynamicCommission || ''}
                  onChange={(e) => handleInputChange('dynamicCommission', e.target.value)}
                  className="text-right"
                />
              </div>

              {/* Extra Boost Commission */}
              <div className="space-y-2">
                <Label htmlFor="extraBoostCommission">Komisi Xtra Boost Program (%)</Label>
                <Input
                  id="extraBoostCommission"
                  type="number"
                  step="0.1"
                  placeholder="1.5"
                  value={inputs.extraBoostCommission || ''}
                  onChange={(e) => handleInputChange('extraBoostCommission', e.target.value)}
                  className="text-right"
                />
              </div>

              {/* Cashback Commission */}
              <div className="space-y-2">
                <Label htmlFor="cashbackCommission">Komisi Cashback (%)</Label>
                <Input
                  id="cashbackCommission"
                  type="number"
                  step="0.1"
                  placeholder="3"
                  value={inputs.cashbackCommission || ''}
                  onChange={(e) => handleInputChange('cashbackCommission', e.target.value)}
                  className="text-right"
                />
              </div>

              {/* Affiliate Commission */}
              <div className="space-y-2">
                <Label htmlFor="affiliateCommission">Komisi Affiliate (%)</Label>
                <Input
                  id="affiliateCommission"
                  type="number"
                  step="0.1"
                  placeholder="5"
                  value={inputs.affiliateCommission || ''}
                  onChange={(e) => handleInputChange('affiliateCommission', e.target.value)}
                  className="text-right"
                />
              </div>



            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Hasil Perhitungan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inputs.productPrice > 0 ? (
                <div className="space-y-4">
                  {/* Settlement Amount - Main Result */}
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-sm text-muted-foreground mb-1">
                      Settlement Amount Diterima
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {isCalculating ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Menghitung...
                        </div>
                      ) : (
                        formatCurrency(result.settlementAmount)
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatPercentage(result.netProfitMargin)} dari harga produk
                    </div>
                  </div>

                  {/* Actual Profit Section - Show if HPP is available (from product or manual) */}
                  {result.hpp && result.hpp > 0 && (
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-sm text-muted-foreground mb-1">
                        Profit Aktual (Settlement - HPP)
                      </div>
                      <div className={`text-2xl font-bold ${result.actualProfit && result.actualProfit > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(result.actualProfit || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatPercentage(result.actualProfitMargin || 0)} margin profit aktual
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 pt-1 border-t border-purple-200 dark:border-purple-800">
                        HPP: {formatCurrency(result.hpp)} • ROI: {result.hpp > 0 ? formatPercentage((result.actualProfit || 0) / result.hpp * 100) : '0%'}
                      </div>
                    </div>
                  )}

                  {/* Net Profit Breakdown Card */}
                  {result.hpp && result.hpp > 0 && (
                    <Card className="border-2 border-dashed border-orange-200 dark:border-orange-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-orange-700 dark:text-orange-300">
                          Breakdown Perhitungan Hasil Bersih
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm">Harga Produk</span>
                          <span className="font-medium">{formatCurrency(inputs.productPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm text-red-600">Dikurangi Total Komisi</span>
                          <span className="font-medium text-red-600">-{formatCurrency(result.totalCommissionAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm text-orange-600">Dikurangi Biaya Pemrosesan</span>
                          <span className="font-medium text-orange-600">-{formatCurrency(PROCESSING_FEE)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b-2 border-green-200 dark:border-green-800">
                          <span className="text-sm font-medium text-green-600">Settlement Amount</span>
                          <span className="font-bold text-green-600">{formatCurrency(result.settlementAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm text-blue-600">Dikurangi HPP {selectedProduct ? '(Database)' : '(Manual)'}</span>
                          <span className="font-medium text-blue-600">-{formatCurrency(result.hpp)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 px-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <span className="font-bold text-purple-700 dark:text-purple-300">Hasil Bersih (Profit Aktual)</span>
                          <span className={`font-bold text-lg ${result.actualProfit && result.actualProfit > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(result.actualProfit || 0)}
                          </span>
                        </div>
                        <div className="text-center text-xs text-muted-foreground pt-2">
                          Margin Profit: {formatPercentage(result.actualProfitMargin || 0)} • ROI: {result.hpp > 0 ? formatPercentage((result.actualProfit || 0) / result.hpp * 100) : '0%'}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Commission Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-xs text-muted-foreground">Total Komisi</div>
                      <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(result.totalCommissionAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPercentage(result.totalCommissionPercentage)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-xs text-muted-foreground">
                        {result.hpp && result.hpp > 0 ? `HPP ${selectedProduct ? 'Produk' : 'Manual'}` : 'Harga Produk'}
                      </div>
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {result.hpp && result.hpp > 0 ? formatCurrency(result.hpp) : formatCurrency(inputs.productPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.hpp && result.hpp > 0 ? `HPP ${formatPercentage((result.hpp || 0) / inputs.productPrice * 100)}` : '100%'}
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t border-border">
                    <Button 
                      onClick={saveCalculation}
                      className="w-full flex items-center gap-2"
                      disabled={isCalculating}
                    >
                      <Save className="h-4 w-4" />
                      Simpan Perhitungan
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Masukkan harga produk untuk mulai menghitung</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commission Breakdown */}
          {getCommissionBreakdown().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Rincian Komisi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getCommissionBreakdown().map((commission, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {commission.isFixed ? 'Fixed' : formatPercentage(commission.percentage)}
                        </Badge>
                        <span className="text-sm">{commission.name}</span>
                      </div>
                      <div className={`text-sm font-medium ${commission.isFixed ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                        -{formatCurrency(commission.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tips Perhitungan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Pilih produk dari database HPP untuk analisis profit yang akurat</p>
                <p>• Biaya pemrosesan sebesar {formatCurrency(PROCESSING_FEE)} otomatis dipotong</p>
                <p>• Semua field komisi bersifat opsional</p>
                <p>• Settlement amount = Harga produk - Total komisi - Biaya pemrosesan</p>
                <p>• Profit aktual = Settlement amount - HPP</p>
                <p>• Import data HPP dari Excel di tab Database HPP</p>
                <p>• Gunakan titik (.) untuk angka desimal</p>
                <p>• Hasil perhitungan otomatis update saat input berubah</p>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

          {/* Templates Section - Moved to bottom */}
          <TikTokCommissionTemplates onApplyTemplate={applyTemplate} />
        </TabsContent>

        <TabsContent value="database">
          <TikTokProductHPPManager onProductSelect={handleProductSelectFromHPPManager} />
        </TabsContent>

        <TabsContent value="history">
          <TikTokCommissionHistory onApplyCalculation={applyHistoryCalculation} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TikTokCommissionCalculator;