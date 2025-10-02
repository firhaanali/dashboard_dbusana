import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  SortAsc,
  SortDesc,
  Package
} from 'lucide-react';
import { formatUniversalDate, dateToTimestamp, formatDateSimple } from '../../utils/dateUtils';
import { formatCustomerForDisplay } from '../../utils/customerDisplayUtils';
import { SALES_TABLE_CONFIG } from './salesConstants';
import type { SalesTableProps } from './types';

export function SalesTable({ data, loading }: SalesTableProps) {
  const [sortBy, setSortBy] = useState<string>('delivered_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Helper function to get field value from either format
  const getFieldValue = (sale: any, field: string) => {
    const fieldMappings: { [key: string]: string[] } = {
      'order_id': ['order_id', 'Order ID'],
      'seller_sku': ['seller_sku', 'Seller SKU'],
      'product_name': ['product_name', 'Product Name'],
      'color': ['color', 'Color'],
      'size': ['size', 'Size'],
      'quantity': ['quantity', 'Quantity'],
      'total_revenue': ['total_revenue', 'Total Revenue', 'order_amount', 'Order Amount'],
      'order_amount': ['order_amount', 'Order Amount'],
      'hpp': ['hpp', 'HPP'],
      'delivered_time': ['delivered_time', 'Delivered Time'],
      'created_time': ['created_time', 'Created Time'],
      'marketplace': ['marketplace', 'Marketplace', 'Asal'],
      'customer': ['customer', 'Customer'],
      'province': ['province', 'Province'],
      'regency_city': ['regency_city', 'Regency & City', 'regency', 'city']
    };

    const possibleFields = fieldMappings[field] || [field];
    return possibleFields.reduce((value, fieldName) => value || sale[fieldName], null) || '';
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...data];

    // Sort data - handle both formats
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      // Handle different data formats
      if (sortBy === 'delivered_time' || sortBy === 'created_time') {
        if (sortBy === 'delivered_time') {
          aValue = getFieldValue(a, 'delivered_time') || getFieldValue(a, 'created_time');
          bValue = getFieldValue(b, 'delivered_time') || getFieldValue(b, 'created_time');
        } else {
          aValue = getFieldValue(a, 'created_time');
          bValue = getFieldValue(b, 'created_time');
        }
        
        // Convert to Date for proper comparison - handle Excel serial numbers
        try {
          aValue = dateToTimestamp(aValue);
          bValue = dateToTimestamp(bValue);
        } catch (error) {
          aValue = 0;
          bValue = 0;
        }
      } else {
        aValue = getFieldValue(a, sortBy);
        bValue = getFieldValue(b, sortBy);
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = String(bValue || '').toLowerCase();
        }
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [data, sortBy, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * SALES_TABLE_CONFIG.ITEMS_PER_PAGE;
    return filteredAndSortedData.slice(start, start + SALES_TABLE_CONFIG.ITEMS_PER_PAGE);
  }, [filteredAndSortedData, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / SALES_TABLE_CONFIG.ITEMS_PER_PAGE);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const formatDate = (dateInput: string | Date | number) => {
    if (!dateInput) return '-';
    return formatDateSimple(dateInput);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? 
      <SortAsc className="w-3 h-3 ml-1" /> : 
      <SortDesc className="w-3 h-3 ml-1" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mx-auto mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Belum Ada Data Penjualan</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Import data penjualan Excel/CSV untuk menampilkan tabel sales management
            </p>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Import Data Penjualan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Data Penjualan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th 
                    className="text-left p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('order_id')}
                  >
                    <div className="flex items-center">
                      Order ID
                      <SortIcon column="order_id" />
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('product_name')}
                  >
                    <div className="flex items-center">
                      Produk
                      <SortIcon column="product_name" />
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center">
                      Qty
                      <SortIcon column="quantity" />
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('total_revenue')}
                  >
                    <div className="flex items-center">
                      Revenue
                      <SortIcon column="total_revenue" />
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('delivered_time')}
                  >
                    <div className="flex items-center">
                      Tanggal Delivered
                      <SortIcon column="delivered_time" />
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('marketplace')}
                  >
                    <div className="flex items-center">
                      Marketplace
                      <SortIcon column="marketplace" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((sale, index) => {
                  // Handle both database format and transformed format using helper function
                  const orderId = getFieldValue(sale, 'order_id');
                  const sellerSku = getFieldValue(sale, 'seller_sku');
                  const productName = getFieldValue(sale, 'product_name');
                  const color = getFieldValue(sale, 'color');
                  const size = getFieldValue(sale, 'size');
                  const quantity = getFieldValue(sale, 'quantity') || 0;
                  const totalRevenue = getFieldValue(sale, 'total_revenue') || getFieldValue(sale, 'order_amount') || 0;
                  const hpp = getFieldValue(sale, 'hpp') || 0;
                  const deliveredTime = getFieldValue(sale, 'delivered_time');
                  const createdTime = getFieldValue(sale, 'created_time');
                  // Get actual marketplace value from database
                  const marketplace = sale.marketplace || sale.Marketplace || getFieldValue(sale, 'marketplace') || 'Unknown';
                  // Get customer and location data
                  const customerRaw = getFieldValue(sale, 'customer');
                  const customerDisplay = formatCustomerForDisplay(customerRaw);
                  const province = getFieldValue(sale, 'province') || '';
                  const regencyCity = getFieldValue(sale, 'regency_city') || 
                                     (sale.regency && sale.city && sale.regency !== sale.city ? 
                                      `${sale.regency} & ${sale.city}` : 
                                      sale.regency || sale.city || '');
                  
                  return (
                  <tr key={`${orderId}-${index}`} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3">
                      <div className="font-medium text-blue-600 dark:text-blue-400">{orderId || '-'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{sellerSku || '-'}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{productName || '-'}</div>
                      <div className="flex gap-1 mt-1">
                        {color && (
                          <Badge variant="outline" className="text-xs">
                            {color}
                          </Badge>
                        )}
                        {size && (
                          <Badge variant="outline" className="text-xs">
                            {size}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{quantity}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(totalRevenue)}
                      </div>
                      {hpp > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          HPP: {formatCurrency(hpp)}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {deliveredTime 
                          ? formatDate(deliveredTime)
                          : formatDate(createdTime)
                        }
                      </div>
                      {deliveredTime && createdTime && deliveredTime !== createdTime && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {formatDate(createdTime)}
                        </div>
                      )}
                      {!deliveredTime && (
                        <div className="text-xs text-orange-500 dark:text-orange-400">
                          Belum Delivered
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          marketplace === 'Unknown' || !marketplace
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600' 
                            : marketplace === 'Shopee' 
                              ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700'
                              : marketplace === 'Tokopedia' 
                                ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                                : marketplace === 'Lazada'
                                  ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                  : marketplace === 'Blibli'
                                    ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {marketplace}
                      </Badge>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}