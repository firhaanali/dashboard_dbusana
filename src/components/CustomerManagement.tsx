import React, { useState, useEffect } from 'react';
import { Search, Download, MapPin, Package, DollarSign, Calendar, X, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { formatDateSimple } from '../utils/dateUtils';
import { simpleApiCustomers } from '../utils/simpleApiUtils';
import { formatCurrency } from '../utils/currencyFormatHelper';
import { toast } from 'sonner@2.0.3';

interface Customer {
  customer: string;
  province: string;
  regency_city: string;
  total_quantity: number;
  order_amount: number;
  total_orders: number;
  last_order_date: string;
}

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalOrders: number;
  totalQuantity: number;
  totalOrderAmount: number;
  averageOrderValue: number;
  newCustomersThisMonth: number;
}

interface CustomerResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SortConfig {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortBy: 'order_amount',
    sortOrder: 'desc'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Export state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date>();
  const [exportEndDate, setExportEndDate] = useState<Date>();
  
  const [isMounted, setIsMounted] = useState(false);
  const [dataCache, setDataCache] = useState<Map<string, CustomerResponse>>(new Map());

  // Fetch customers with optimized loading
  const fetchCustomers = async (page = currentPage, search = searchTerm, config = sortConfig, silent = false) => {
    try {
      const cacheKey = `${page}-${pageSize}-${search || ''}-${config.sortBy}-${config.sortOrder}`;
      
      // Check cache first
      if (dataCache.has(cacheKey)) {
        console.log('📦 CustomerManagement: Using cached data');
        const cachedData = dataCache.get(cacheKey)!;
        setCustomers(cachedData.customers);
        setTotalCustomers(cachedData.total);
        setTotalPages(cachedData.totalPages);
        if (!silent) {
          setIsLoading(false);
        }
        return;
      }
      
      // Smart loading states
      if (!silent && customers.length > 0) {
        setIsChangingPage(true);
      } else {
        setIsLoading(true);
      }
      
      const params = {
        page,
        limit: pageSize,
        search: search || undefined,
        sortBy: config.sortBy,
        sortOrder: config.sortOrder
      };

      console.log('🔄 CustomerManagement: Fetching customers with params:', params);

      const result = await simpleApiCustomers.getCustomers(
        page,
        pageSize,
        search || '',
        config.sortBy,
        config.sortOrder
      );
      
      if (result.success && result.data) {
        const customerData = result.data as CustomerResponse;
        const newCustomers = customerData.customers || [];
        const newTotal = customerData.total || 0;
        const newTotalPages = customerData.totalPages || 0;
        
        setCustomers(newCustomers);
        setTotalCustomers(newTotal);
        setTotalPages(newTotalPages);
        
        // Cache the result
        setDataCache(prev => new Map(prev).set(cacheKey, customerData));
        
        console.log('✅ CustomerManagement: Customers loaded successfully:', {
          count: newCustomers.length,
          total: newTotal,
          pages: newTotalPages
        });
      } else {
        console.error('❌ CustomerManagement: API returned error:', result.error);
        setCustomers([]);
        setTotalCustomers(0);
        setTotalPages(0);
        toast.error('Error memuat data customer: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ CustomerManagement: Exception fetching customers:', error);
      setCustomers([]);
      setTotalCustomers(0);
      setTotalPages(0);
      toast.error('Gagal terhubung ke server backend. Pastikan server berjalan.');
    } finally {
      setIsLoading(false);
      setIsChangingPage(false);
    }
  };

  // Fetch customer stats
  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      console.log('🔄 CustomerManagement: Fetching customer stats...');
      const result = await simpleApiCustomers.getStats();
      
      if (result.success && result.data) {
        setStats(result.data);
        console.log('✅ CustomerManagement: Stats loaded successfully:', result.data);
      } else {
        console.error('❌ CustomerManagement: Stats API returned error:', result.error);
        setStats(null);
        toast.error('Error memuat statistik customer: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ CustomerManagement: Exception fetching stats:', error);
      setStats(null);
      toast.error('Gagal memuat statistik customer dari server.');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Initial mount effect
  useEffect(() => {
    console.log('🚀 CustomerManagement component mounted');
    setIsMounted(true);
    
    // Fetch both data simultaneously
    Promise.all([
      fetchCustomers(1, '', sortConfig, false),
      fetchStats()
    ]).then(() => {
      console.log('✅ CustomerManagement: Initial data load completed');
    });
  }, []);

  // Handle filters change
  useEffect(() => {
    if (!isMounted) return;
    
    console.log('🔄 CustomerManagement: Filters changed - triggering fetchCustomers', {
      page: currentPage,
      pageSize,
      sortConfig,
      search: searchTerm || '(empty)',
      timestamp: new Date().toLocaleTimeString()
    });
    
    const isInitialLoad = customers.length === 0;
    fetchCustomers(currentPage, searchTerm, sortConfig, !isInitialLoad);
  }, [currentPage, pageSize, sortConfig, isMounted]);

  // Handle search with debounce
  useEffect(() => {
    if (!isMounted) return;
    
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchCustomers(1, searchTerm, sortConfig);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, isMounted]);

  // Helper functions
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleSort = (field: string) => {
    const newSortOrder = sortConfig.sortBy === field && sortConfig.sortOrder === 'desc' ? 'asc' : 'desc';
    setSortConfig({ sortBy: field, sortOrder: newSortOrder });
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortConfig.sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExportConfirm = async () => {
    if (!exportStartDate || !exportEndDate) return;

    try {
      console.log('🔄 Starting customer export...');
      const result = await simpleApiCustomers.exportCustomers(
        exportStartDate.toISOString().split('T')[0],
        exportEndDate.toISOString().split('T')[0]
      );

      if (result.success && result.data) {
        const customersToExport = result.data as Customer[];
        
        if (!customersToExport || customersToExport.length === 0) {
          toast.error('Tidak ada data customer untuk periode yang dipilih');
          return;
        }

        // Convert to CSV
        const headers = [
          'Customer', 'Province', 'Regency City', 'Total Quantity', 
          'Order Amount', 'Total Orders', 'Last Order Date'
        ];

        const csvContent = [
          headers.join(','),
          ...customersToExport.map(customer => [
            `"${customer.customer || 'Customer Tidak Diketahui'}"`,
            `"${customer.province || '-'}"`,
            `"${customer.regency_city || '-'}"`,
            customer.total_quantity,
            customer.order_amount,
            customer.total_orders,
            `"${formatDateSimple(customer.last_order_date)}"`
          ].join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `customers_export_${formatDate(exportStartDate)}_to_${formatDate(exportEndDate)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`📊 Export berhasil: ${customersToExport.length} customer records`, {
          description: `Periode: ${formatDate(exportStartDate)} - ${formatDate(exportEndDate)}`
        });

        setShowExportDialog(false);
        setExportStartDate(undefined);
        setExportEndDate(undefined);
      } else {
        toast.error('Gagal mengambil data customer untuk export');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Terjadi kesalahan saat export data');
    }
  };

  // Loading state for initial load
  if (isLoading && customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 mt-1" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Customer Management</h1>
          <p className="text-muted-foreground mt-1">Sistem manajemen bisnis fashion terintegrasi</p>
        </div>
        <div className="flex gap-2">
          <Popover open={showExportDialog} onOpenChange={setShowExportDialog}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3>Export Data Customer</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExportDialog(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Date Range Selectors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm">Tanggal Mulai</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start gap-2">
                              <Calendar className="w-4 h-4" />
                              {exportStartDate ? formatDate(exportStartDate) : 'Pilih tanggal'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={exportStartDate}
                              onSelect={setExportStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm">Tanggal Akhir</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start gap-2">
                              <Calendar className="w-4 h-4" />
                              {exportEndDate ? formatDate(exportEndDate) : 'Pilih tanggal'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={exportEndDate}
                              onSelect={setExportEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Export Info */}
                    {exportStartDate && exportEndDate && (
                      <div className="p-3 bg-accent-muted rounded-lg">
                        <p className="text-sm text-accent-secondary-foreground">
                          <strong>Periode Export:</strong> {formatDate(exportStartDate)} - {formatDate(exportEndDate)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          File akan diunduh dalam format CSV dengan data customer yang sudah difilter
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setShowExportDialog(false)}
                      >
                        Batal
                      </Button>
                      <Button 
                        className="flex-1 gap-2"
                        onClick={handleExportConfirm}
                        disabled={!exportStartDate || !exportEndDate}
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customer</p>
                {isLoadingStats ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p>{formatNumber(stats?.totalCustomers || 0)}</p>
                )}
              </div>
              <div className="w-10 h-10 bg-accent-secondary rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-accent-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Order</p>
                {isLoadingStats ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p>{formatNumber(stats?.totalOrders || 0)}</p>
                )}
              </div>
              <div className="w-10 h-10 bg-accent-secondary rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-accent-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                {isLoadingStats ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <p>{formatNumber(stats?.totalQuantity || 0)}</p>
                )}
              </div>
              <div className="w-10 h-10 bg-accent-secondary rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-accent-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata AOV</p>
                {isLoadingStats ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p>{formatCurrency(stats?.averageOrderValue || 0)}</p>
                )}
              </div>
              <div className="w-10 h-10 bg-accent-secondary rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Data Table */}
      <Card>
        <CardContent className="p-6">
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari customer, provinsi, atau kota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Total: {formatNumber(totalCustomers)} customers</span>
              {isChangingPage && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>

          {/* Data Table */}
          {customers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('customer')}
                    >
                      <div className="flex items-center gap-2">
                        Customer
                        {getSortIcon('customer')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('province')}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Provinsi
                        {getSortIcon('province')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('regency_city')}
                    >
                      <div className="flex items-center gap-2">
                        Kota
                        {getSortIcon('regency_city')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 text-right" 
                      onClick={() => handleSort('total_quantity')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Qty
                        {getSortIcon('total_quantity')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 text-right" 
                      onClick={() => handleSort('order_amount')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className="w-4 h-4" />
                        Order Amount
                        {getSortIcon('order_amount')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 text-right" 
                      onClick={() => handleSort('total_orders')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Orders
                        {getSortIcon('total_orders')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('last_order_date')}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Last Order
                        {getSortIcon('last_order_date')}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer, index) => (
                    <TableRow key={`${customer.customer}-${index}`} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {customer.customer || 'Customer Tidak Diketahui'}
                      </TableCell>
                      <TableCell>{customer.province || '-'}</TableCell>
                      <TableCell>{customer.regency_city || '-'}</TableCell>
                      <TableCell className="text-right">{formatNumber(customer.total_quantity)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(customer.order_amount)}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(customer.total_orders)}</TableCell>
                      <TableCell>{formatDateSimple(customer.last_order_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3>Tidak ada data customer</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tidak ada customer yang cocok dengan pencarian.' : 'Belum ada data customer yang tersedia.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages} ({formatNumber(totalCustomers)} total customers)
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationEllipsis />
                  )}
                  
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}