import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Filter, Download, Search, Calendar, X } from 'lucide-react';
import { SalesTable } from './sales/SalesTable';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';

import { simpleApiSales } from '../utils/simpleApiUtils';
import { logSaleActivity, logActivity } from '../utils/activityLogger';

interface DatabaseSale {
  id: string;
  order_id: string;
  seller_sku: string;
  product_name: string;
  color?: string;
  size?: string;
  quantity: number;
  order_amount: number;
  created_time: string;
  delivered_time?: string;
  settlement_amount?: number;
  total_revenue?: number;
  hpp?: number;
  total?: number;
  customer?: string;
  province?: string;
  regency_city?: string;
  marketplace?: string;
  batch_id?: string;
  created_at: string;
  updated_at: string;
}

export function SalesManagement() {
  const [allSales, setAllSales] = useState<DatabaseSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<DatabaseSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Fixed items per page for better performance
  
  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date>();
  const [exportEndDate, setExportEndDate] = useState<Date>();
  
  const hasData = allSales.length > 0;

  // Load ALL database sales data (no pagination limit)
  const loadAllDatabaseSales = async (showToast: boolean = false) => {
    setLoading(true);
    
    try {
      // Load all data without pagination
      const salesResult = await simpleApiSales.getAll(); 

      if (salesResult.success && salesResult.data) {
        setAllSales(salesResult.data);
        setFilteredSales(salesResult.data);
        setTotalRecords(salesResult.data.length);
        
        // Debug: Log marketplace data
        const marketplaceStats = salesResult.data.reduce((acc: any, sale: any) => {
          const marketplace = sale.marketplace || 'Unknown';
          acc[marketplace] = (acc[marketplace] || 0) + 1;
          return acc;
        }, {});
        
        console.log('📊 Marketplace distribution in loaded data:', marketplaceStats);
        console.log('🔍 Sample sale record:', salesResult.data[0]);
        
        if (showToast) {
          toast.success(`📊 Data berhasil dimuat: ${salesResult.data.length} total records`, {
            description: 'Menampilkan seluruh data penjualan'
          });
        }
      } else {
        setAllSales([]);
        setFilteredSales([]);
        setTotalRecords(0);
        
        if (showToast) {
          toast.warning('❌ Tidak ada data tersedia', {
            description: salesResult.error || 'Database mungkin kosong atau backend tidak berjalan'
          });
        }
      }

    } catch (err) {
      setAllSales([]);
      setFilteredSales([]);
      setTotalRecords(0);
      
      if (showToast) {
        toast.error('❌ Koneksi database gagal', {
          description: err instanceof Error ? err.message : 'Pastikan backend server berjalan'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load all data on component mount
    loadAllDatabaseSales(true);
  }, []);

  // Filter data based on search and marketplace
  useEffect(() => {
    let filtered = allSales;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(sale => 
        sale.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.seller_sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sale.marketplace && sale.marketplace.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply marketplace filter
    if (selectedMarketplace !== 'all') {
      filtered = filtered.filter(sale => sale.marketplace === selectedMarketplace);
    }

    setFilteredSales(filtered);
    setTotalRecords(filtered.length);
    setCurrentPage(1); // Reset to first page when filtering
  }, [allSales, searchQuery, selectedMarketplace]);

  // Get current page data for display
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSales.slice(startIndex, endIndex);
  };



  // Transform database format to table format for current page
  const getTransformedData = () => {
    const currentData = getCurrentPageData();
    return currentData.map(sale => ({
      'Order ID': sale.order_id,
      'Seller SKU': sale.seller_sku,
      'Product Name': sale.product_name,
      'Color': sale.color || '',
      'Size': sale.size || '',
      'Quantity': sale.quantity,
      'Order Amount': sale.order_amount,
      'Created Time': sale.created_time,
      'Delivered Time': sale.delivered_time || '',
      'Settlement Amount': sale.settlement_amount || 0,
      'Total Revenue': sale.total_revenue || sale.order_amount,
      'HPP': sale.hpp || 0,
      'Total': sale.total || sale.order_amount,
      'Marketplace': sale.marketplace || 'Unknown', // Add marketplace field
      'Customer': sale.customer || '-',
      'Province': sale.province || '-',
      'Regency City': sale.regency_city || '-',
      // Keep original data accessible
      marketplace: sale.marketplace || 'Unknown',
      customer: sale.customer || '-',
      province: sale.province || '-',
      regency_city: sale.regency_city || '-',
      _source: 'database',
      _id: sale.id,
      _batch_id: sale.batch_id
    }));
  };

  const transformedData = getTransformedData();
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get visible page numbers for pagination
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Get unique marketplaces for filter dropdown
  const getUniqueMarketplaces = () => {
    const marketplaces = [...new Set(allSales.map(sale => sale.marketplace).filter(Boolean))];
    return marketplaces.sort();
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Export functionality

  const handleExportConfirm = () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error('Pilih rentang tanggal export');
      return;
    }

    // Filter data by date range
    const filteredByDate = filteredSales.filter(sale => {
      const saleDate = new Date(sale.created_time);
      return saleDate >= exportStartDate && saleDate <= exportEndDate;
    });

    if (filteredByDate.length === 0) {
      toast.warning('Tidak ada data dalam rentang tanggal yang dipilih');
      return;
    }

    // Convert to CSV
    const headers = [
      'Order ID', 'Seller SKU', 'Product Name', 'Color', 'Size', 'Quantity',
      'Order Amount', 'Created Time', 'Delivered Time', 'Settlement Amount',
      'Total Revenue', 'HPP', 'Total', 'Marketplace', 'Customer', 'Province', 'Regency City'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredByDate.map(sale => [
        `"${sale.order_id}"`,
        `"${sale.seller_sku}"`,
        `"${sale.product_name}"`,
        `"${sale.color || ''}"`,
        `"${sale.size || ''}"`,
        sale.quantity,
        sale.order_amount,
        `"${sale.created_time}"`,
        `"${sale.delivered_time || ''}"`,
        sale.settlement_amount || 0,
        sale.total_revenue || sale.order_amount,
        sale.hpp || 0,
        sale.total || sale.order_amount,
        `"${sale.marketplace || 'Unknown'}"`,
        `"${sale.customer || '-'}"`,
        `"${sale.province || '-'}"`,
        `"${sale.regency_city || '-'}"`
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_export_${formatDate(exportStartDate)}_to_${formatDate(exportEndDate)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`📊 Export berhasil: ${filteredByDate.length} records`, {
      description: `Periode: ${formatDate(exportStartDate)} - ${formatDate(exportEndDate)}`
    });

    setShowExportDialog(false);
    setExportStartDate(undefined);
    setExportEndDate(undefined);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMarketplace('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1>Sales Management</h1>
          <p className="text-muted-foreground">
            Kelola dan analisis data penjualan D'Busana
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari order ID, produk, SKU, atau marketplace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2">
              {/* Marketplace Filter */}
              <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Marketplace</SelectItem>
                  {getUniqueMarketplaces().map(marketplace => (
                    <SelectItem key={marketplace} value={marketplace}>
                      {marketplace}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchQuery || selectedMarketplace !== 'all') && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}

              {/* Export Button */}
              <Popover open={showExportDialog} onOpenChange={setShowExportDialog}>
                <PopoverTrigger asChild>
                  <Button className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3>Export Data Penjualan</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowExportDialog(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block">Pilih Rentang Tanggal</label>
                          
                          {/* Start Date */}
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Tanggal Mulai</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {exportStartDate ? formatDate(exportStartDate) : "Pilih tanggal mulai"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={exportStartDate}
                                  onSelect={setExportStartDate}
                                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* End Date */}
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Tanggal Akhir</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {exportEndDate ? formatDate(exportEndDate) : "Pilih tanggal akhir"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={exportEndDate}
                                  onSelect={setExportEndDate}
                                  disabled={(date) => 
                                    date > new Date() || 
                                    date < new Date("1900-01-01") || 
                                    (exportStartDate && date < exportStartDate)
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Export Info */}
                        {exportStartDate && exportEndDate && (
                          <div className="p-3 bg-accent-secondary rounded-lg">
                            <p className="text-sm text-accent-secondary-foreground">
                              <strong>Periode Export:</strong> {formatDate(exportStartDate)} - {formatDate(exportEndDate)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              File akan diunduh dalam format CSV dengan data yang sudah difilter
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

          {/* Active Filters Display */}
          {(searchQuery || selectedMarketplace !== 'all') && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-secondary text-accent-secondary-foreground rounded-md text-xs">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedMarketplace !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-200 rounded-md text-xs">
                  Marketplace: {selectedMarketplace}
                  <button onClick={() => setSelectedMarketplace('all')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Data Table */}
      <SalesTable 
        data={transformedData} 
        loading={loading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Records Info */}
              <div className="text-sm text-muted-foreground">
                Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, totalRecords)} - {Math.min(currentPage * itemsPerPage, totalRecords)} dari {totalRecords.toLocaleString('id-ID')} records
              </div>
              
              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page Numbers */}
                {totalPages <= 7 ? (
                  // Show all pages if total pages <= 7
                  Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  ))
                ) : (
                  // Show pages with ellipsis if total pages > 7
                  getVisiblePages().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="h-8 w-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  ))
                )}

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}