import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  TrendingDown,
  DollarSign,
  Plus,
  RefreshCw,
  Calendar,
  ShoppingCart,
  CreditCard,
  Building2,
  Save,
  ArrowDownRight,
  CheckCircle,
  Activity,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDateSimple } from '../utils/dateUtils';

interface ExpenseEntry {
  id?: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
  vendor?: string;
  reference?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function CashFlowExpenses() {
  const [loading, setLoading] = useState(false);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state for new expense entry
  const [newEntry, setNewEntry] = useState<ExpenseEntry>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: 0,
    paymentMethod: '',
    vendor: '',
    reference: ''
  });

  // Expense categories and payment methods
  const categories = [
    'Marketing & Advertising',
    'Inventory Purchase',
    'Operating Expenses',
    'Rent & Utilities',
    'Salaries & Benefits',
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

  const handleInputChange = (field: keyof ExpenseEntry, value: string | number) => {
    setNewEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEntry = async () => {
    if (!newEntry.description || !newEntry.category || !newEntry.amount || !newEntry.paymentMethod) {
      toast.error('❌ Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API
      const entryData = {
        entry_date: newEntry.date,
        description: newEntry.description,
        category: newEntry.category,
        entry_type: 'expense',
        amount: newEntry.amount,
        source: newEntry.paymentMethod,
        marketplace: newEntry.vendor || null,
        reference: newEntry.reference || null,
        created_by: 'user'
      };
      
      console.log('💳 Saving expense entry to database:', entryData);
      
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
          const savedEntry: ExpenseEntry = {
            id: result.data.id,
            date: result.data.entry_date,
            description: result.data.description,
            category: result.data.category,
            amount: result.data.amount,
            paymentMethod: result.data.source,
            vendor: result.data.marketplace,
            reference: result.data.reference
          };
          
          setExpenseEntries(prev => [savedEntry, ...prev]);
          
          // Reset form
          setNewEntry({
            date: new Date().toISOString().split('T')[0],
            description: '',
            category: '',
            amount: 0,
            paymentMethod: '',
            vendor: '',
            reference: ''
          });
          
          setShowAddForm(false);
          
          toast.success('✅ Expense entry berhasil disimpan', {
            description: `${newEntry.description} - ${formatCurrency(newEntry.amount)}`
          });
        } else {
          toast.error(`❌ ${result.error || 'Gagal menyimpan expense entry'}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save entry' }));
        toast.error(`❌ ${errorData.error || 'Gagal menyimpan expense entry'}`);
      }
      
    } catch (error) {
      console.error('❌ Error saving expense entry:', error);
      toast.error('❌ Koneksi ke backend gagal. Pastikan backend berjalan di port 3001');
    } finally {
      setLoading(false);
    }
  };

  // Fetch expense entries from database
  const fetchExpenseEntries = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/cash-flow/entries?entry_type=expense&limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.entries) {
          const entries: ExpenseEntry[] = result.data.entries.map((entry: any) => ({
            id: entry.id,
            date: entry.entry_date,
            description: entry.description,
            category: entry.category,
            amount: entry.amount,
            paymentMethod: entry.source,
            vendor: entry.marketplace,
            reference: entry.reference
          }));
          
          setExpenseEntries(entries);
          console.log('✅ Expense entries loaded from database:', entries.length);
        } else {
          console.log('❌ No expense entries found or backend returned no data');
          setExpenseEntries([]);
        }
      } else {
        console.log('❌ Backend not available for expense entries - using empty data');
        setExpenseEntries([]);
      }
    } catch (error) {
      console.error('❌ Backend connection failed for expense entries:', error);
      setExpenseEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchExpenseEntries();
  }, []);

  // Calculate total expenses
  const totalExpenses = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Cash Flow - Pengeluaran</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">
              Manajemen pengeluaran dan pembayaran kas D'Busana
            </p>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pengeluaran
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchExpenseEntries}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-red-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 text-white rounded-lg">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-red-700">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-red-600">
                {expenseEntries.length} transaksi
              </p>
              <div className="flex items-center gap-2 mt-1">
                <ArrowDownRight className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">Aktif</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Form */}
      {showAddForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Plus className="w-5 h-5" />
              Tambah Entry Pengeluaran Baru
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
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Metode Pembayaran *</Label>
                <Select 
                  value={newEntry.paymentMethod} 
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode" />
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

              {/* Vendor */}
              <div className="space-y-2">
                <Label>Vendor/Supplier</Label>
                <Input
                  placeholder="Nama vendor atau supplier"
                  value={newEntry.vendor || ''}
                  onChange={(e) => handleInputChange('vendor', e.target.value)}
                />
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label>Referensi</Label>
                <Input
                  placeholder="No. invoice, receipt, dll"
                  value={newEntry.reference || ''}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Deskripsi *</Label>
              <Input
                placeholder="Deskripsi pengeluaran (contoh: Pembelian bahan baku, Biaya iklan, dll)"
                value={newEntry.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSaveEntry}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
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

      {/* Expense Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Riwayat Pengeluaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && expenseEntries.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-500">Memuat data pengeluaran...</p>
            </div>
          ) : expenseEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Belum ada entry pengeluaran</p>
              <p className="text-sm">Klik "Tambah Pengeluaran" untuk menambah entry pertama</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenseEntries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{entry.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatDateSimple(new Date(entry.date))}</span>
                        <span>{entry.category}</span>
                        <span>{entry.paymentMethod}</span>
                        {entry.vendor && <span>to {entry.vendor}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      - {formatCurrency(entry.amount)}
                    </p>
                    {entry.reference && (
                      <p className="text-xs text-gray-500">{entry.reference}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}