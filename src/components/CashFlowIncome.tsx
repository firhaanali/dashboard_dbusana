import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  TrendingUp,
  DollarSign,
  Plus,
  RefreshCw,
  Calendar,
  ShoppingCart,
  CreditCard,
  Building2,
  Save,
  ArrowUpRight,
  CheckCircle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDateSimple } from '../utils/dateUtils';

interface IncomeEntry {
  id?: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  source: string;
  marketplace?: string;
  reference?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function CashFlowIncome() {
  const [loading, setLoading] = useState(false);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state for new income entry
  const [newEntry, setNewEntry] = useState<IncomeEntry>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: 0,
    source: '',
    marketplace: '',
    reference: ''
  });

  // Income categories and sources
  const categories = [
    'Sales Revenue',
    'Investment Returns',
    'Loan Received',
    'Other Income',
    'Refunds',
    'Interest Income'
  ];

  const sources = [
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

  const handleInputChange = (field: keyof IncomeEntry, value: string | number) => {
    setNewEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEntry = async () => {
    if (!newEntry.description || !newEntry.category || !newEntry.amount || !newEntry.source) {
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
        entry_type: 'income',
        amount: newEntry.amount,
        source: newEntry.source,
        marketplace: newEntry.marketplace || null,
        reference: newEntry.reference || null,
        created_by: 'user'
      };
      
      console.log('💰 Saving income entry to database:', entryData);
      
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
          const savedEntry: IncomeEntry = {
            id: result.data.id,
            date: result.data.entry_date,
            description: result.data.description,
            category: result.data.category,
            amount: result.data.amount,
            source: result.data.source,
            marketplace: result.data.marketplace,
            reference: result.data.reference
          };
          
          setIncomeEntries(prev => [savedEntry, ...prev]);
          
          // Reset form
          setNewEntry({
            date: new Date().toISOString().split('T')[0],
            description: '',
            category: '',
            amount: 0,
            source: '',
            marketplace: '',
            reference: ''
          });
          
          setShowAddForm(false);
          
          toast.success('✅ Income entry berhasil disimpan', {
            description: `${newEntry.description} - ${formatCurrency(newEntry.amount)}`
          });
        } else {
          toast.error(`❌ ${result.error || 'Gagal menyimpan income entry'}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save entry' }));
        toast.error(`❌ ${errorData.error || 'Gagal menyimpan income entry'}`);
      }
      
    } catch (error) {
      console.error('❌ Error saving income entry:', error);
      toast.error('❌ Koneksi ke backend gagal. Pastikan backend berjalan di port 3001');
    } finally {
      setLoading(false);
    }
  };

  // Fetch income entries from database
  const fetchIncomeEntries = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/cash-flow/entries?entry_type=income&limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.entries) {
          const entries: IncomeEntry[] = result.data.entries.map((entry: any) => ({
            id: entry.id,
            date: entry.entry_date,
            description: entry.description,
            category: entry.category,
            amount: entry.amount,
            source: entry.source,
            marketplace: entry.marketplace,
            reference: entry.reference
          }));
          
          setIncomeEntries(entries);
          console.log('✅ Income entries loaded from database:', entries.length);
        } else {
          console.log('❌ No income entries found or backend returned no data');
          setIncomeEntries([]);
        }
      } else {
        console.log('❌ Backend not available for income entries - using empty data');
        setIncomeEntries([]);
      }
    } catch (error) {
      console.error('❌ Backend connection failed for income entries:', error);
      setIncomeEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchIncomeEntries();
  }, []);

  // Calculate total income
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Cash Flow - Pemasukan</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">
              Manajemen pemasukan dan penerimaan kas D'Busana
            </p>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pemasukan
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchIncomeEntries}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 text-white rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Pemasukan</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-600">
                {incomeEntries.length} transaksi
              </p>
              <div className="flex items-center gap-2 mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Aktif</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Income Form */}
      {showAddForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Plus className="w-5 h-5" />
              Tambah Entry Pemasukan Baru
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

              {/* Source */}
              <div className="space-y-2">
                <Label>Sumber *</Label>
                <Select 
                  value={newEntry.source} 
                  onValueChange={(value) => handleInputChange('source', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sumber" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map(source => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Marketplace (optional) */}
              <div className="space-y-2">
                <Label>Marketplace</Label>
                <Input
                  placeholder="Nama marketplace (opsional)"
                  value={newEntry.marketplace || ''}
                  onChange={(e) => handleInputChange('marketplace', e.target.value)}
                />
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label>Referensi</Label>
                <Input
                  placeholder="No. invoice, order ID, dll"
                  value={newEntry.reference || ''}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Deskripsi *</Label>
              <Input
                placeholder="Deskripsi pemasukan (contoh: Penjualan produk A, Return investment, dll)"
                value={newEntry.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSaveEntry}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
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

      {/* Income Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Riwayat Pemasukan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && incomeEntries.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-500">Memuat data pemasukan...</p>
            </div>
          ) : incomeEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Belum ada entry pemasukan</p>
              <p className="text-sm">Klik "Tambah Pemasukan" untuk menambah entry pertama</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomeEntries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{entry.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatDateSimple(new Date(entry.date))}</span>
                        <span>{entry.category}</span>
                        <span>{entry.source}</span>
                        {entry.marketplace && <span>via {entry.marketplace}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      + {formatCurrency(entry.amount)}
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