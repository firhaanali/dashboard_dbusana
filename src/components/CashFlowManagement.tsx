import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Calendar,
  ShoppingCart,
  CreditCard,
  Building2,
  Save,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Activity,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDateSimple } from '../utils/dateUtils';
import { logActivity } from '../utils/activityLogger';

interface CashFlowEntry {
  id?: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  source: string;
  marketplace?: string;
  reference?: string;
  type: 'income' | 'expense';
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function CashFlowManagement() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('income');
  const [incomeEntries, setIncomeEntries] = useState<CashFlowEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<CashFlowEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state for new entry
  const [newEntry, setNewEntry] = useState<CashFlowEntry>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: 0,
    source: '',
    marketplace: '',
    reference: '',
    type: 'income'
  });

  // Income categories and sources
  const incomeCategories = [
    'Sales Revenue',
    'Investment Returns', 
    'Loan Received',
    'Other Income',
    'Refunds',
    'Interest Income'
  ];

  const incomeSources = [
    'Shopee',
    'Tokopedia', 
    'Lazada',
    'Blibli',
    'TikTok Shop',
    'Direct Sales',
    'Bank Transfer',
    'Cash',
    'Other'
  ];

  // Expense categories and payment methods
  const expenseCategories = [
    'Salaries & Benefits',
    'Marketing & Advertising',
    'Inventory Purchase',
    'Operating Expenses',
    'Rent & Utilities',
    'Transportation',
    'Office Supplies',
    'Professional Services',
    'Other Expenses'
  ];

  const paymentMethods = [
    'Cash',
    'Bank Transfer',
    'Credit Card',
    'Debit Card',
    'E-Wallet',
    'Check',
    'Other'
  ];

  const handleInputChange = (field: keyof CashFlowEntry, value: string | number) => {
    setNewEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setNewEntry(prev => ({
      ...prev,
      type: value as 'income' | 'expense',
      category: '',
      source: '',
      marketplace: '',
      reference: ''
    }));
    setShowAddForm(false);
  };

  const handleSaveEntry = async () => {
    if (!newEntry.description || !newEntry.category || !newEntry.amount || !newEntry.source) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API
      const entryData = {
        entry_date: newEntry.date,
        description: newEntry.description,
        category: newEntry.category,
        entry_type: newEntry.type,
        amount: newEntry.amount,
        source: newEntry.source,
        marketplace: newEntry.marketplace || null,
        reference: newEntry.reference || null,
        created_by: 'user'
      };
      
      console.log(`💰 Saving ${newEntry.type} entry to database:`, entryData);
      
      const response = await fetch('http://localhost:3001/api/cash-flow/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(entryData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Add to local state
          const savedEntry: CashFlowEntry = {
            id: result.data.id,
            date: result.data.entry_date,
            description: result.data.description,
            category: result.data.category,
            amount: result.data.amount,
            source: result.data.source,
            marketplace: result.data.marketplace,
            reference: result.data.reference,
            type: newEntry.type
          };
          
          if (newEntry.type === 'income') {
            setIncomeEntries(prev => [savedEntry, ...prev]);
          } else {
            setExpenseEntries(prev => [savedEntry, ...prev]);
          }
          
          // Reset form
          setNewEntry({
            date: new Date().toISOString().split('T')[0],
            description: '',
            category: '',
            amount: 0,
            source: '',
            marketplace: '',
            reference: '',
            type: newEntry.type
          });
          
          setShowAddForm(false);
          
          // ✅ LOG ACTIVITY
          try {
            await logActivity({
              type: newEntry.type === 'income' ? 'payment' : 'payment',
              title: `Cash Flow ${newEntry.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`,
              description: `${newEntry.description} - ${formatCurrency(newEntry.amount)}`,
              status: 'success',
              metadata: {
                amount: newEntry.amount,
                category: newEntry.category,
                source: newEntry.source,
                marketplace: newEntry.marketplace,
                entry_type: newEntry.type
              }
            });
            console.log('✅ Activity logged for cash flow entry:', { type: newEntry.type, amount: newEntry.amount });
          } catch (activityError) {
            console.warn('Failed to log cash flow activity:', activityError);
          }

          toast.success(`${newEntry.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil disimpan`, {
            description: `${newEntry.description} - ${formatCurrency(newEntry.amount)}`
          });
        } else {
          toast.error(`${result.error || 'Gagal menyimpan entry'}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save entry' }));
        toast.error(`${errorData.error || 'Gagal menyimpan entry'}`);
      }
      
    } catch (error) {
      console.error('❌ Error saving entry:', error);
      toast.error('Koneksi ke backend gagal. Pastikan backend berjalan di port 3001');
    } finally {
      setLoading(false);
    }
  };

  // Fetch entries from database
  const fetchEntries = async (type: 'income' | 'expense') => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:3001/api/cash-flow/entries?entry_type=${type}&limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.entries) {
          const entries: CashFlowEntry[] = result.data.entries.map((entry: any) => ({
            id: entry.id,
            date: entry.entry_date,
            description: entry.description,
            category: entry.category,
            amount: entry.amount,
            source: entry.source,
            marketplace: entry.marketplace,
            reference: entry.reference,
            type: type
          }));
          
          if (type === 'income') {
            setIncomeEntries(entries);
          } else {
            setExpenseEntries(entries);
          }
          console.log(`✅ ${type} entries loaded from database:`, entries.length);
        } else {
          console.log(`❌ No ${type} entries found or backend returned no data`);
          if (type === 'income') {
            setIncomeEntries([]);
          } else {
            setExpenseEntries([]);
          }
        }
      } else {
        console.log(`❌ Backend not available for ${type} entries - using empty data`);
        if (type === 'income') {
          setIncomeEntries([]);
        } else {
          setExpenseEntries([]);
        }
      }
    } catch (error) {
      console.error(`❌ Backend connection failed for ${type} entries:`, error);
      if (type === 'income') {
        setIncomeEntries([]);
      } else {
        setExpenseEntries([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchEntries('income');
    fetchEntries('expense');
  }, []);

  // Calculate totals
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;

  const currentEntries = activeTab === 'income' ? incomeEntries : expenseEntries;
  const currentCategories = activeTab === 'income' ? incomeCategories : expenseCategories;
  const currentSources = activeTab === 'income' ? incomeSources : paymentMethods;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Cash Flow Management</h1>
          <div className="flex items-center gap-4 mt-3">
            <p className="text-muted-foreground">
              Kelola pemasukan dan pengeluaran kas D'Busana
            </p>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={activeTab === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah {activeTab === 'income' ? 'Pemasukan' : 'Pengeluaran'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 text-white rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Pemasukan</p>
                <p className="text-green-900">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 text-white rounded-lg">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-red-700">Total Pengeluaran</p>
                <p className="text-red-900">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Cash Flow */}
        <Card className={`border-blue-200 bg-gradient-to-r ${netCashFlow >= 0 ? 'from-blue-50 to-blue-100' : 'from-orange-50 to-orange-100'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 text-white rounded-lg ${netCashFlow >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}>
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-sm ${netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Cash Flow</p>
                <p className={netCashFlow >= 0 ? 'text-blue-900' : 'text-orange-900'}>
                  {formatCurrency(netCashFlow)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Entry Form */}
      {showAddForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Plus className="w-5 h-5" />
              Tambah Entry {activeTab === 'income' ? 'Pemasukan' : 'Pengeluaran'} Baru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label>Tanggal *</Label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Jumlah (IDR) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newEntry.amount || ''}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select 
                  value={newEntry.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source/Payment Method */}
              <div className="space-y-2">
                <Label>{activeTab === 'income' ? 'Sumber' : 'Metode Pembayaran'} *</Label>
                <Select 
                  value={newEntry.source} 
                  onValueChange={(value) => handleInputChange('source', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Pilih ${activeTab === 'income' ? 'sumber' : 'metode'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentSources.map(source => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Marketplace/Vendor */}
              <div className="space-y-2">
                <Label>{activeTab === 'income' ? 'Marketplace' : 'Vendor/Supplier'}</Label>
                <Input
                  placeholder={activeTab === 'income' ? 'Nama marketplace (opsional)' : 'Nama vendor atau supplier'}
                  value={newEntry.marketplace || ''}
                  onChange={(e) => handleInputChange('marketplace', e.target.value)}
                />
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label>Referensi</Label>
                <Input
                  placeholder={activeTab === 'income' ? 'No. invoice, order ID, dll' : 'No. invoice, receipt, dll'}
                  value={newEntry.reference || ''}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Deskripsi *</Label>
              <Input
                placeholder={activeTab === 'income' ? 'Deskripsi pemasukan (contoh: Penjualan produk A, Return investment, dll)' : 'Deskripsi pengeluaran (contoh: Pembelian bahan baku, Biaya iklan, Gaji karyawan, dll)'}
                value={newEntry.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSaveEntry}
                disabled={loading}
                className={activeTab === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Income/Expense */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Riwayat Transaksi Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="income" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Pemasukan ({incomeEntries.length})
              </TabsTrigger>
              <TabsTrigger value="expense" className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Pengeluaran ({expenseEntries.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="income" className="mt-4">
              {loading && incomeEntries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 mx-auto mb-4 bg-muted-foreground/20 rounded-full animate-pulse"></div>
                  <p className="text-muted-foreground">Memuat data pemasukan...</p>
                </div>
              ) : incomeEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Belum ada entry pemasukan</p>
                  <p className="text-sm">Klik "Tambah Pemasukan" untuk menambah entry pertama</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomeEntries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-foreground">{entry.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatDateSimple(new Date(entry.date))}</span>
                            <span>{entry.category}</span>
                            <span>{entry.source}</span>
                            {entry.marketplace && <span>via {entry.marketplace}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600">
                          + {formatCurrency(entry.amount)}
                        </p>
                        {entry.reference && (
                          <p className="text-xs text-muted-foreground">{entry.reference}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="expense" className="mt-4">
              {loading && expenseEntries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 mx-auto mb-4 bg-muted-foreground/20 rounded-full animate-pulse"></div>
                  <p className="text-muted-foreground">Memuat data pengeluaran...</p>
                </div>
              ) : expenseEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Belum ada entry pengeluaran</p>
                  <p className="text-sm">Klik "Tambah Pengeluaran" untuk menambah entry pertama</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenseEntries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-foreground">{entry.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatDateSimple(new Date(entry.date))}</span>
                            <span>{entry.category}</span>
                            <span>{entry.source}</span>
                            {entry.marketplace && <span>to {entry.marketplace}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600">
                          - {formatCurrency(entry.amount)}
                        </p>
                        {entry.reference && (
                          <p className="text-xs text-muted-foreground">{entry.reference}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}