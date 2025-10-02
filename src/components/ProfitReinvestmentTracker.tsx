import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { 
  TrendingUp,
  ArrowRightLeft,
  Package,
  CreditCard,
  Building2,
  ShoppingCart,
  Zap,
  Calendar,
  Plus,
  PieChart,
  Target,
  Wallet,
  ArrowDownUp
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDateSimple } from '../utils/dateUtils';
import { makeApiRequest, withRetry } from '../utils/apiUtils';

interface ProfitReinvestment {
  id: string;
  source_profit_period: string; // e.g., "2024-12" 
  profit_amount: number;
  reinvestment_type: 'raw_materials' | 'debt_payment' | 'equipment' | 'marketing' | 'inventory' | 'other';
  reinvestment_amount: number;
  description: string;
  supplier_name?: string;
  payment_method: string;
  date: string;
  status: 'planned' | 'executed' | 'cancelled';
  notes?: string;
  created_at: string;
}

interface ReinvestmentForm {
  source_profit_period: string;
  profit_amount: string;
  reinvestment_type: 'raw_materials' | 'debt_payment' | 'equipment' | 'marketing' | 'inventory' | 'other';
  reinvestment_amount: string;
  description: string;
  supplier_name: string;
  payment_method: string;
  date: string;
  status: 'planned' | 'executed' | 'cancelled';
  notes: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const reinvestmentTypes = [
  { value: 'raw_materials', label: 'Bahan Baku / Kain', icon: Package, color: 'bg-blue-500' },
  { value: 'debt_payment', label: 'Pembayaran Hutang', icon: CreditCard, color: 'bg-red-500' },
  { value: 'equipment', label: 'Peralatan Produksi', icon: Building2, color: 'bg-purple-500' },
  { value: 'marketing', label: 'Marketing & Promosi', icon: Target, color: 'bg-orange-500' },
  { value: 'inventory', label: 'Tambah Stok Produk', icon: ShoppingCart, color: 'bg-green-500' },
  { value: 'other', label: 'Lainnya', icon: Wallet, color: 'bg-gray-500' }
];

const paymentMethods = [
  'Transfer Bank',
  'Cash',
  'E-Wallet (OVO/GoPay/DANA)',
  'Kartu Kredit',
  'Cicilan',
  'Barter/Trade'
];

export function ProfitReinvestmentTracker() {
  const [loading, setLoading] = useState(false);
  const [reinvestments, setReinvestments] = useState<ProfitReinvestment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<ReinvestmentForm>({
    source_profit_period: new Date().toISOString().substring(0, 7), // YYYY-MM
    profit_amount: '',
    reinvestment_type: 'raw_materials',
    reinvestment_amount: '',
    description: '',
    supplier_name: '',
    payment_method: '',
    date: new Date().toISOString().split('T')[0],
    status: 'planned',
    notes: ''
  });

  // Available profit periods (from API)
  const [availableProfitPeriods, setAvailableProfitPeriods] = useState([]);

  useEffect(() => {
    fetchReinvestments();
    fetchProfitPeriods();
  }, []);

  const fetchReinvestments = async () => {
    setLoading(true);
    try {
      const result = await withRetry(() => 
        makeApiRequest<any>('/cash-flow/profit-reinvestment')
      );
      
      if (result.success && result.data) {
        setReinvestments(result.data.reinvestments || []);
        if (result.data.reinvestments && result.data.reinvestments.length > 0) {
          toast.success('Data reinvestment loaded successfully');
        }
      } else {
        // Handle empty data gracefully without error toast
        setReinvestments([]);
      }
    } catch (error) {
      console.error('Error fetching reinvestments:', error);
      // Set empty array for graceful handling
      setReinvestments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfitPeriods = async () => {
    try {
      const result = await withRetry(() => 
        makeApiRequest<any>('/cash-flow/profit-periods')
      );
      
      if (result.success && result.data) {
        const periods = result.data.profit_periods.map((period: any) => ({
          period: period.period,
          amount: period.available_for_reinvestment,
          label: period.label,
          net_profit: period.net_profit,
          status: period.status
        }));
        setAvailableProfitPeriods(periods);
      }
    } catch (error) {
      console.error('Error fetching profit periods:', error);
      // Set empty array for graceful handling
      setAvailableProfitPeriods([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.reinvestment_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await withRetry(() => 
        makeApiRequest<any>('/cash-flow/profit-reinvestment', {
          method: 'POST',
          body: JSON.stringify({
            source_profit_period: formData.source_profit_period,
            profit_amount: parseFloat(formData.profit_amount),
            reinvestment_type: formData.reinvestment_type,
            reinvestment_amount: parseFloat(formData.reinvestment_amount),
            description: formData.description,
            supplier_name: formData.supplier_name,
            payment_method: formData.payment_method,
            date: formData.date,
            status: formData.status,
            notes: formData.notes
          })
        })
      );

      if (result.success) {
        toast.success('Profit reinvestment recorded successfully');
        setShowAddForm(false);
        resetForm();
        fetchReinvestments();
      } else {
        throw new Error(result.error || 'Failed to record reinvestment');
      }
    } catch (error) {
      console.error('Error recording reinvestment:', error);
      toast.error('Failed to record profit reinvestment');
    }
  };

  const resetForm = () => {
    setFormData({
      source_profit_period: new Date().toISOString().substring(0, 7),
      profit_amount: '',
      reinvestment_type: 'raw_materials',
      reinvestment_amount: '',
      description: '',
      supplier_name: '',
      payment_method: '',
      date: new Date().toISOString().split('T')[0],
      status: 'planned',
      notes: ''
    });
  };

  const handleFormChange = (field: keyof ReinvestmentForm, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-fill profit amount when period changes
      if (field === 'source_profit_period') {
        const selectedPeriod = availableProfitPeriods.find((p: any) => p.period === value);
        if (selectedPeriod) {
          updated.profit_amount = selectedPeriod.amount.toString();
        }
      }
      
      return updated;
    });
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = reinvestmentTypes.find(t => t.value === type);
    return typeConfig ? typeConfig : { icon: Wallet, color: 'bg-gray-500' };
  };

  const calculateSummary = () => {
    const totalReinvested = reinvestments
      .filter(r => r.status === 'executed')
      .reduce((sum, r) => sum + r.reinvestment_amount, 0);
    
    const plannedReinvestment = reinvestments
      .filter(r => r.status === 'planned')
      .reduce((sum, r) => sum + r.reinvestment_amount, 0);

    const totalProfitUsed = reinvestments
      .reduce((sum, r) => sum + r.profit_amount, 0);

    return { totalReinvested, plannedReinvestment, totalProfitUsed };
  };

  const summary = calculateSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Profit Reinvestment Tracker</h1>
          <div className="flex items-center gap-4 mt-3">
            <p className="text-muted-foreground">
              Kelola dan lacak reinvestasi keuntungan untuk pengembangan bisnis
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Record Reinvestment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 text-white rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Reinvested</p>
                <p className="text-green-900">
                  {formatCurrency(summary.totalReinvested)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 text-white rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Planned Investment</p>
                <p className="text-blue-900">
                  {formatCurrency(summary.plannedReinvestment)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 text-white rounded-lg">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Available Profit Periods</p>
                <p className="text-purple-900">
                  {availableProfitPeriods.length} periods
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Reinvestment Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Record Profit Reinvestment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Profit Period */}
                <div className="space-y-2">
                  <Label htmlFor="source_profit_period">Source Profit Period *</Label>
                  <Select value={formData.source_profit_period} onValueChange={(value) => handleFormChange('source_profit_period', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProfitPeriods
                        .filter((period: any) => period.amount > 0) // Only show periods with available funds
                        .map((period: any) => (
                        <SelectItem key={period.period} value={period.period}>
                          {period.label} - {formatCurrency(period.amount)} tersedia
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Available Profit Amount */}
                <div className="space-y-2">
                  <Label htmlFor="profit_amount">Available Profit Amount</Label>
                  <Input
                    id="profit_amount"
                    type="number"
                    value={formData.profit_amount}
                    onChange={(e) => handleFormChange('profit_amount', e.target.value)}
                    placeholder="Auto-filled from selected period"
                    disabled
                  />
                </div>

                {/* Reinvestment Type */}
                <div className="space-y-2">
                  <Label htmlFor="reinvestment_type">Reinvestment Type *</Label>
                  <Select value={formData.reinvestment_type} onValueChange={(value) => handleFormChange('reinvestment_type', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reinvestmentTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reinvestment Amount */}
                <div className="space-y-2">
                  <Label htmlFor="reinvestment_amount">Reinvestment Amount (IDR) *</Label>
                  <Input
                    id="reinvestment_amount"
                    type="number"
                    value={formData.reinvestment_amount}
                    onChange={(e) => handleFormChange('reinvestment_amount', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1000"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Describe the reinvestment purpose"
                    required
                  />
                </div>

                {/* Supplier Name */}
                <div className="space-y-2">
                  <Label htmlFor="supplier_name">Supplier/Vendor Name</Label>
                  <Input
                    id="supplier_name"
                    value={formData.supplier_name}
                    onChange={(e) => handleFormChange('supplier_name', e.target.value)}
                    placeholder="Enter supplier or vendor name"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => handleFormChange('payment_method', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleFormChange('status', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="executed">Executed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Additional notes or comments"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">Record Reinvestment</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reinvestment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownUp className="w-5 h-5" />
            Reinvestment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reinvestments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>No profit reinvestments recorded yet</p>
                <p className="text-sm">Add your real reinvestment data to track profit allocation</p>
                <p className="text-xs mt-2 text-muted-foreground/80">Mock data has been removed - ready for your actual data</p>
              </div>
            ) : (
              reinvestments.map((reinvestment) => {
                const typeConfig = getTypeIcon(reinvestment.reinvestment_type);
                const Icon = typeConfig.icon;
                
                return (
                  <div key={reinvestment.id} 
                       className="flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-accent bg-card border-border">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg text-white ${typeConfig.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div>
                        <h4 className="text-foreground">{reinvestment.description}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>From {reinvestment.source_profit_period}</span>
                          <span>•</span>
                          <span>{reinvestmentTypes.find(t => t.value === reinvestment.reinvestment_type)?.label}</span>
                          {reinvestment.supplier_name && (
                            <>
                              <span>•</span>
                              <span>{reinvestment.supplier_name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatDateSimple(new Date(reinvestment.date))}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-foreground">
                          {formatCurrency(reinvestment.reinvestment_amount)}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={
                            reinvestment.status === 'executed' ? 'bg-green-100 text-green-800' :
                            reinvestment.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {reinvestment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}