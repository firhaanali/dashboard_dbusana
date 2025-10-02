import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { NetProfitSummaryCard } from './NetProfitSummaryCard';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Info,
  ArrowRight,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NetProfitCalculatorPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Net Profit Calculator</CardTitle>
                <p className="text-sm text-gray-600">
                  Perhitungan pendapatan bersih dengan formula yang benar: Total Profit - Biaya Iklan
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Formula Fixed
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Formula Explanation */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Penjelasan Formula Pendapatan Bersih
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">Rumus yang Benar:</h4>
              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                <code className="text-lg font-mono text-gray-800">
                  Net Profit = (Settlement Amount - HPP) - Biaya Iklan
                </code>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>1. Gross Profit:</strong> Settlement Amount - HPP (Harga Pokok Penjualan)</p>
                <p><strong>2. Biaya Iklan:</strong> Total pengeluaran untuk advertising di semua platform</p>
                <p><strong>3. Net Profit:</strong> Gross Profit dikurangi semua biaya operasional termasuk advertising</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <h5 className="font-medium text-green-700">Settlement Amount</h5>
                </div>
                <p className="text-xs text-gray-600">
                  Jumlah yang benar-benar diterima dari marketplace setelah dikurangi fee dan komisi
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-orange-600" />
                  <h5 className="font-medium text-orange-700">HPP (Cost of Goods)</h5>
                </div>
                <p className="text-xs text-gray-600">
                  Harga pokok produk termasuk material, produksi, dan biaya langsung lainnya
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  <h5 className="font-medium text-red-700">Biaya Iklan</h5>
                </div>
                <p className="text-xs text-gray-600">
                  Semua pengeluaran advertising di TikTok Ads, Google Ads, Facebook Ads, dll
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Profit Calculation Display */}
      <NetProfitSummaryCard showDetails={true} />

      {/* Why This Formula Matters */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Mengapa Formula Ini Penting?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">1. Akurasi Profitabilitas</h5>
              <p className="text-sm text-gray-600">
                Memastikan semua biaya operasional (termasuk advertising) diperhitungkan untuk mendapatkan 
                gambaran profit yang sesungguhnya.
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">2. Pengambilan Keputusan Bisnis</h5>
              <p className="text-sm text-gray-600">
                Dengan net profit yang akurat, Anda dapat membuat keputusan yang lebih baik tentang 
                alokasi budget advertising dan strategi pricing.
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">3. ROI Advertising yang Realistis</h5>
              <p className="text-sm text-gray-600">
                Mengetahui impact sebenarnya dari spending advertising terhadap profitabilitas bisnis 
                secara keseluruhan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation to Related Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eksplorasi Analytics Lebih Lanjut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/analytics')}
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Analytics Dashboard</span>
              </div>
              <p className="text-xs text-left text-gray-600">
                Lihat analytics lengkap dengan breakdown profit per marketplace dan produk
              </p>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Button>

            <Button 
              variant="outline" 
              onClick={() => navigate('/advertising/roi')}
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-green-600" />
                <span className="font-medium">ROI Analysis</span>
              </div>
              <p className="text-xs text-left text-gray-600">
                Analisis mendalam ROI advertising dengan True Business ROI calculation
              </p>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Button>

            <Button 
              variant="outline" 
              onClick={() => navigate('/reports')}
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Reports Dashboard</span>
              </div>
              <p className="text-xs text-left text-gray-600">
                Laporan komprehensif dengan breakdown net profit dan cost analysis
              </p>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}