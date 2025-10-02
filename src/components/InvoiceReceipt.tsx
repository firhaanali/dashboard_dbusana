import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, Download, Upload, MoreHorizontal, Edit, Trash2, Eye, Send, Calendar, DollarSign, Receipt, FileBarChart, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';

import { formatDateSimple } from '../utils/dateUtils';

interface InvoiceItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  type: 'invoice' | 'receipt';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  paymentMethod?: string;
  paymentDate?: string;
}

interface InvoiceFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  dueDate: string;
  type: 'invoice' | 'receipt';
  items: InvoiceItem[];
  tax: number;
  discount: number;
  notes?: string;
  paymentMethod?: string;
}

export function InvoiceReceipt() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices');
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    dueDate: '',
    type: 'invoice',
    items: [],
    tax: 11,
    discount: 0,
    notes: '',
    paymentMethod: ''
  });

  const [newItem, setNewItem] = useState({
    productName: '',
    quantity: 1,
    unitPrice: 0
  });

  // Load invoices from API
  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/invoices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      if (data.success) {
        setInvoices(data.data.invoices);
        setFilteredInvoices(data.data.invoices);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      // Set empty array if no data
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || invoice.type === filterType;
      const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, filterType, filterStatus]);

  const addItemToForm = () => {
    if (!newItem.productName || newItem.quantity <= 0 || newItem.unitPrice <= 0) return;

    const item: InvoiceItem = {
      id: `item-${Date.now()}`,
      productName: newItem.productName,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      total: newItem.quantity * newItem.unitPrice
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({
      productName: '',
      quantity: 1,
      unitPrice: 0
    });
  };

  const removeItemFromForm = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (formData.tax / 100);
    const discount = formData.discount;
    const total = subtotal + tax - discount;
    
    return { subtotal, tax, discount, total };
  };

  const handleAddInvoice = async () => {
    try {
      setIsLoading(true);
      
      const { subtotal, tax, discount, total } = calculateTotals();
      
      const invoiceData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        dueDate: formData.dueDate,
        type: formData.type,
        items: formData.items,
        tax: formData.tax,
        discount: formData.discount,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod
      };

      const response = await fetch('http://localhost:3001/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      const data = await response.json();
      if (data.success) {
        // Refresh invoices list
        await loadInvoices();
        setIsAddDialogOpen(false);
        resetForm();
        console.log('✅ Invoice created successfully:', data.data.invoiceNumber);
      }
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      setIsLoading(true);

      const invoiceData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        dueDate: formData.dueDate,
        items: formData.items,
        tax: formData.tax,
        discount: formData.discount,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod
      };

      const response = await fetch(`http://localhost:3001/api/invoices/${selectedInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice');
      }

      const data = await response.json();
      if (data.success) {
        // Refresh invoices list
        await loadInvoices();
        setIsEditDialogOpen(false);
        setSelectedInvoice(null);
        resetForm();
        console.log('✅ Invoice updated successfully:', data.data.invoiceNumber);
      }
    } catch (error) {
      console.error('❌ Error updating invoice:', error);
      alert('Failed to update invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      setIsLoading(true);

      const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      const data = await response.json();
      if (data.success) {
        // Refresh invoices list
        await loadInvoices();
        console.log('✅ Invoice deleted successfully:', data.data.invoiceNumber);
      }
    } catch (error) {
      console.error('❌ Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: Invoice['status']) => {
    try {
      setIsLoading(true);

      const response = await fetch(`http://localhost:3001/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-development-only': 'true'
        },
        body: JSON.stringify({ 
          status: newStatus,
          paymentMethod: newStatus === 'paid' ? 'Bank Transfer' : undefined,
          paymentDate: newStatus === 'paid' ? new Date().toISOString() : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice status');
      }

      const data = await response.json();
      if (data.success) {
        // Refresh invoices list
        await loadInvoices();
        console.log('✅ Invoice status updated successfully:', data.data.invoiceNumber);
      }
    } catch (error) {
      console.error('❌ Error updating invoice status:', error);
      alert('Failed to update invoice status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      dueDate: '',
      type: 'invoice',
      items: [],
      tax: 11,
      discount: 0,
      notes: '',
      paymentMethod: ''
    });
    setNewItem({
      productName: '',
      quantity: 1,
      unitPrice: 0
    });
  };

  const openEditDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      dueDate: invoice.dueDate.split('T')[0],
      type: invoice.type,
      items: invoice.items,
      tax: (invoice.tax / invoice.subtotal) * 100,
      discount: invoice.discount,
      notes: invoice.notes || '',
      paymentMethod: invoice.paymentMethod || ''
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-3 h-3" />;
      case 'sent': return <Send className="w-3 h-3" />;
      case 'overdue': return <XCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'invoice' 
      ? 'bg-accent-secondary text-accent-secondary-foreground border-accent-border'
      : 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate statistics
  const totalInvoices = invoices.filter(inv => inv.type === 'invoice').length;
  const totalReceipts = invoices.filter(inv => inv.type === 'receipt').length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);

  const { subtotal: formSubtotal, tax: formTax, total: formTotal } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Invoice & Receipt</h1>
          <p className="text-muted-foreground mt-1">Kelola dan lacak semua transaksi invoice dan receipt</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Buat Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Buat Invoice/Receipt Baru</DialogTitle>
                <DialogDescription>
                  Masukkan detail transaksi untuk membuat invoice atau receipt
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="mb-4">Informasi Customer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="customerName">Nama Customer *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Nama lengkap customer"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                        placeholder="customer@email.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customerPhone">Telepon</Label>
                      <Input
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="+62 812 3456 7890"
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <div>
                  <h3 className="mb-4">Detail Invoice</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Tipe Dokumen</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="invoice">Invoice</SelectItem>
                          <SelectItem value="receipt">Receipt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="dueDate">Tanggal Jatuh Tempo</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="mb-4">Item Transaksi</h3>
                  
                  {/* Add Item Form */}
                  <div className="border rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="productName">Nama Produk</Label>
                        <Input
                          id="productName"
                          value={newItem.productName}
                          onChange={(e) => setNewItem(prev => ({ ...prev, productName: e.target.value }))}
                          placeholder="Nama produk"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="quantity">Qty</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="unitPrice">Harga Satuan</Label>
                        <Input
                          id="unitPrice"
                          type="number"
                          min="0"
                          value={newItem.unitPrice}
                          onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={addItemToForm} disabled={!newItem.productName || newItem.quantity <= 0 || newItem.unitPrice <= 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Item
                    </Button>
                  </div>

                  {/* Items List */}
                  {formData.items.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produk</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Harga Satuan</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell>{formatCurrency(item.total)}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeItemFromForm(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Totals */}
                {formData.items.length > 0 && (
                  <div>
                    <h3 className="mb-4">Perhitungan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="tax">Pajak (%)</Label>
                        <Input
                          id="tax"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.tax}
                          onChange={(e) => setFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="discount">Diskon (IDR)</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          value={formData.discount}
                          onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Total Akhir</Label>
                        <div className="text-2xl font-bold text-accent-primary">
                          {formatCurrency(formTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Catatan tambahan untuk invoice/receipt"
                    className="min-h-20"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button 
                  onClick={handleAddInvoice} 
                  disabled={!formData.customerName || formData.items.length === 0}
                >
                  Buat {formData.type === 'invoice' ? 'Invoice' : 'Receipt'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoice</p>
                <p>{totalInvoices}</p>
              </div>
              <div className="w-10 h-10 bg-accent-secondary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Receipt</p>
                <p>{totalReceipts}</p>
              </div>
              <div className="w-10 h-10 bg-accent-secondary rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-accent-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lunas</p>
                <p>{paidInvoices}</p>
              </div>
              <div className="w-10 h-10 bg-accent-secondary rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-accent-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p>{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 bg-accent-secondary rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cari invoice/receipt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Dikirim</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice & Receipt List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5" />
            Daftar Invoice & Receipt ({filteredInvoices.length})
          </CardTitle>
          <CardDescription>
            Kelola dan lacak semua transaksi invoice dan receipt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Memuat data invoice/receipt...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {invoices.length === 0 ? (
                        <div className="space-y-2">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                          <p>Tidak ada invoice/receipt yang ditemukan</p>
                          <p className="text-xs">Mulai dengan membuat invoice atau receipt baru</p>
                        </div>
                      ) : (
                        'Tidak ada hasil yang sesuai dengan pencarian Anda'
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-accent-muted/50">
                      <TableCell className="font-medium text-card-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-accent-primary">
                              {invoice.invoiceNumber.slice(-2)}
                            </span>
                          </div>
                          {invoice.invoiceNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-card-foreground">{invoice.customerName}</div>
                          <div className="text-xs text-muted-foreground">{invoice.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeColor(invoice.type)}>
                          <FileText className="w-3 h-3 mr-1" />
                          {invoice.type === 'invoice' ? 'Invoice' : 'Receipt'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateSimple(invoice.issueDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateSimple(invoice.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-card-foreground">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewDialog(invoice)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(invoice)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <Separator />
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(invoice.id, 'paid')}
                              disabled={invoice.status === 'paid'}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(invoice.id, 'sent')}
                              disabled={invoice.status === 'sent' || invoice.status === 'paid'}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Mark as Sent
                            </DropdownMenuItem>
                            <Separator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {selectedInvoice?.type === 'invoice' ? 'Invoice' : 'Receipt'}</DialogTitle>
            <DialogDescription>
              Update informasi {selectedInvoice?.type === 'invoice' ? 'invoice' : 'receipt'} - {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-card-foreground">Informasi Customer</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editCustomerName">Nama Customer *</Label>
                  <Input
                    id="editCustomerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Nama lengkap customer"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editCustomerEmail">Email</Label>
                  <Input
                    id="editCustomerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="customer@email.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editCustomerPhone">Telepon</Label>
                  <Input
                    id="editCustomerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="+62 812 3456 7890"
                  />
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-card-foreground">Detail Invoice</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editDueDate">Tanggal Jatuh Tempo</Label>
                  <Input
                    id="editDueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Items List */}
            {formData.items.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-card-foreground">Item Transaksi</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Harga Satuan</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-card-foreground">{item.productName}</TableCell>
                          <TableCell className="text-card-foreground">{item.quantity}</TableCell>
                          <TableCell className="text-card-foreground">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-card-foreground">{formatCurrency(item.total)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeItemFromForm(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="editNotes">Catatan</Label>
              <Textarea
                id="editNotes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Catatan tambahan untuk invoice/receipt"
                className="min-h-20"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEditInvoice}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedInvoice.type === 'invoice' ? 'Invoice' : 'Receipt'} - {selectedInvoice.invoiceNumber}</span>
                  <Badge variant="outline" className={getStatusColor(selectedInvoice.status)}>
                    {getStatusIcon(selectedInvoice.status)}
                    <span className="ml-1 capitalize">{selectedInvoice.status}</span>
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Customer & Invoice Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-card-foreground">Informasi Customer</h3>
                    <div className="space-y-2 text-muted-foreground">
                      <p><strong className="text-card-foreground">Nama:</strong> {selectedInvoice.customerName}</p>
                      <p><strong className="text-card-foreground">Email:</strong> {selectedInvoice.customerEmail}</p>
                      <p><strong className="text-card-foreground">Telepon:</strong> {selectedInvoice.customerPhone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-card-foreground">Detail Transaksi</h3>
                    <div className="space-y-2 text-muted-foreground">
                      <p><strong className="text-card-foreground">Nomor:</strong> {selectedInvoice.invoiceNumber}</p>
                      <p><strong className="text-card-foreground">Tanggal:</strong> {formatDateSimple(selectedInvoice.issueDate)}</p>
                      <p><strong className="text-card-foreground">Jatuh Tempo:</strong> {formatDateSimple(selectedInvoice.dueDate)}</p>
                      {selectedInvoice.paymentMethod && (
                        <p><strong className="text-card-foreground">Metode Pembayaran:</strong> {selectedInvoice.paymentMethod}</p>
                      )}
                      {selectedInvoice.paymentDate && (
                        <p><strong className="text-card-foreground">Tanggal Bayar:</strong> {formatDateSimple(selectedInvoice.paymentDate)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-card-foreground">Item Transaksi</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Harga Satuan</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-card-foreground">{item.productName}</TableCell>
                            <TableCell className="text-card-foreground">{item.quantity}</TableCell>
                            <TableCell className="text-card-foreground">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-card-foreground">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totals Summary */}
                  <div className="mt-4 space-y-2 text-right">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Subtotal:</span>
                      <span className="text-card-foreground">{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Pajak:</span>
                      <span className="text-card-foreground">{formatCurrency(selectedInvoice.tax)}</span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Diskon:</span>
                        <span className="text-destructive">-{formatCurrency(selectedInvoice.discount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-medium text-card-foreground">Total:</span>
                      <span className="font-bold text-accent-primary">{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-card-foreground">Catatan</h3>
                    <div className="p-3 bg-accent-muted rounded-lg">
                      <p className="text-muted-foreground">{selectedInvoice.notes}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Tutup
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  openEditDialog(selectedInvoice);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}