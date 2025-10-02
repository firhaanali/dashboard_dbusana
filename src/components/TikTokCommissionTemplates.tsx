import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Lightbulb, TrendingUp, Star, Zap } from 'lucide-react';

interface CommissionTemplate {
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  productPrice: number;
  platformCommission: number;
  dynamicCommission: number;
  extraBoostCommission: number;
  cashbackCommission: number;
  affiliateCommission: number;
  category: 'popular' | 'recommended' | 'special';
}

interface TikTokCommissionTemplatesProps {
  onApplyTemplate: (template: Omit<CommissionTemplate, 'name' | 'description' | 'icon' | 'category'>) => void;
}

const templates: CommissionTemplate[] = [
  {
    name: 'Fashion Basic',
    description: 'Template standar untuk produk fashion dengan komisi dinamis saja',
    icon: TrendingUp,
    category: 'popular',
    productPrice: 169000,
    platformCommission: 0,
    dynamicCommission: 8,
    extraBoostCommission: 0,
    cashbackCommission: 0,
    affiliateCommission: 0
  },
  {
    name: 'Promosi Lengkap',
    description: 'Semua komisi aktif untuk promosi maksimal',
    icon: Star,
    category: 'recommended',
    productPrice: 199000,
    platformCommission: 8,
    dynamicCommission: 5.5,
    extraBoostCommission: 2,
    cashbackCommission: 1.5,
    affiliateCommission: 20
  },
  {
    name: 'Affiliate 15%',
    description: 'Semua komisi aktif dengan fokus affiliate 15%',
    icon: Zap,
    category: 'special',
    productPrice: 199000,
    platformCommission: 8,
    dynamicCommission: 5.5,
    extraBoostCommission: 2,
    cashbackCommission: 1.5,
    affiliateCommission: 15
  },
  {
    name: 'Affiliate 10%',
    description: 'Semua komisi aktif dengan fokus affiliate 10%',
    icon: TrendingUp,
    category: 'popular',
    productPrice: 199000,
    platformCommission: 8,
    dynamicCommission: 5.5,
    extraBoostCommission: 2,
    cashbackCommission: 1.5,
    affiliateCommission: 10
  }
];

const TikTokCommissionTemplates: React.FC<TikTokCommissionTemplatesProps> = ({ onApplyTemplate }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'popular':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'recommended':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'special':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'popular':
        return 'Populer';
      case 'recommended':
        return 'Direkomendasikan';
      case 'special':
        return 'Spesial';
      default:
        return '';
    }
  };

  const calculateQuickResult = (template: CommissionTemplate) => {
    const PROCESSING_FEE = 1250;
    const totalCommissionAmount = 
      (template.productPrice * template.platformCommission / 100) +
      (template.productPrice * template.dynamicCommission / 100) +
      (template.productPrice * template.extraBoostCommission / 100) +
      (template.productPrice * template.cashbackCommission / 100) +
      (template.productPrice * template.affiliateCommission / 100);
    
    return template.productPrice - totalCommissionAmount - PROCESSING_FEE;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActiveCommissions = (template: CommissionTemplate) => {
    const commissions = [];
    if (template.platformCommission > 0) commissions.push(`Platform ${template.platformCommission}%`);
    if (template.dynamicCommission > 0) commissions.push(`Dinamis ${template.dynamicCommission}%`);
    if (template.extraBoostCommission > 0) commissions.push(`Xtra Boost ${template.extraBoostCommission}%`);
    if (template.cashbackCommission > 0) commissions.push(`Cashback ${template.cashbackCommission}%`);
    if (template.affiliateCommission > 0) commissions.push(`Affiliate ${template.affiliateCommission}%`);
    commissions.push('Biaya Pemrosesan Rp 1.250');
    return commissions;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Template Perhitungan Cepat
        </CardTitle>
        <CardDescription>
          Gunakan template siap pakai untuk perhitungan komisi yang umum digunakan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template, index) => (
            <div
              key={index}
              className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <template.icon className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">{template.name}</h4>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getCategoryColor(template.category)}`}
                >
                  {getCategoryLabel(template.category)}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {template.description}
              </p>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Harga Produk:</span>
                  <span className="font-medium">{formatCurrency(template.productPrice)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Settlement:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(calculateQuickResult(template))}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-1">Komisi Aktif:</div>
                <div className="flex flex-wrap gap-1">
                  {getActiveCommissions(template).map((commission, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0.5">
                      {commission}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => onApplyTemplate({
                  productPrice: template.productPrice,
                  platformCommission: template.platformCommission,
                  dynamicCommission: template.dynamicCommission,
                  extraBoostCommission: template.extraBoostCommission,
                  cashbackCommission: template.cashbackCommission,
                  affiliateCommission: template.affiliateCommission
                })}
              >
                Gunakan Template
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TikTokCommissionTemplates;