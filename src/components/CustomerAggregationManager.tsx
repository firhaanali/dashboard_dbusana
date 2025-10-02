import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Users, MapPin, TrendingUp, Eye, BarChart3, Filter } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { 
  customerAggregationUtils, 
  AggregatedCustomer, 
  CustomerData 
} from '../utils/customerAggregationUtils';

interface CustomerAggregationManagerProps {
  onRefresh?: () => void;
}

export function CustomerAggregationManager({ onRefresh }: CustomerAggregationManagerProps) {
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [aggregatedCustomers, setAggregatedCustomers] = useState<AggregatedCustomer[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch customer data
  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/sales', {
        headers: {
          'x-development-only': 'true',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const salesData = result.data.map((sale: any) => ({
          id: sale.id,
          customer: sale.customer || '',
          regency_city: sale.regency_city || '',
          province: sale.province || '',
          order_amount: parseFloat(sale.order_amount || 0),
          quantity: parseInt(sale.quantity || 0),
          created_time: sale.created_time ? new Date(sale.created_time) : new Date()
        }));
        
        setCustomerData(salesData);
        
        // Process aggregation
        const { aggregatedCustomers: aggCustomers, analytics: aggAnalytics } = 
          customerAggregationUtils.getCustomerAnalyticsWithAggregation(salesData);
        
        setAggregatedCustomers(aggCustomers);
        setAnalytics(aggAnalytics);
        
        console.log('🔍 Customer aggregation completed:', {
          totalSales: salesData.length,
          aggregatedCustomers: aggCustomers.length,
          unknownGroups: aggAnalytics.unknownCustomerGroups
        });
      }
    } catch (error) {
      console.error('❌ Error fetching customer data:', error);
      toast.error('Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  // Filter customers based on selected criteria
  const filteredCustomers = aggregatedCustomers.filter(customer => {
    if (filterProvince !== 'all' && customer.province !== filterProvince) {
      return false;
    }
    
    if (filterType !== 'all') {
      if (filterType === 'known' && customer.is_aggregated) return false;
      if (filterType === 'unknown' && !customer.is_aggregated) return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return customer.display_name.toLowerCase().includes(searchLower) ||
             customer.regency_city.toLowerCase().includes(searchLower) ||
             customer.province.toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  // Get unique provinces for filter
  const provinces = Array.from(new Set(aggregatedCustomers.map(c => c.province).filter(Boolean)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Customer Aggregation Manager</h2>
          <p>Kelola agregasi customer berdasarkan lokasi geografis</p>
        </div>
        <Button onClick={fetchCustomerData} disabled={loading}>
          <TrendingUp className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{analytics.totalCustomers.toLocaleString('id-ID')}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Known Customers</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.knownCustomers.toLocaleString('id-ID')}</p>
                </div>
                <Eye className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unknown Groups</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.unknownCustomerGroups.toLocaleString('id-ID')}</p>
                </div>
                <MapPin className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unknown Orders %</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.unknownOrdersPercentage.toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Customer Overview</TabsTrigger>
          <TabsTrigger value="aggregated">Aggregated Customers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <Input
                    placeholder="Cari customer, kota, atau provinsi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Provinsi</label>
                  <Select value={filterProvince} onValueChange={setFilterProvince}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Provinsi</SelectItem>
                      {provinces.map(province => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipe Customer</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value="known">Known Customers</SelectItem>
                      <SelectItem value="unknown">Unknown Groups</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterProvince('all');
                      setFilterType('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
          <Card>
            <CardHeader>
              <CardTitle>Customer List ({filteredCustomers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.slice(0, 50).map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.display_name}</p>
                            {customer.is_aggregated && (
                              <p className="text-sm text-muted-foreground">
                                {customer.customer_count} customers aggregated
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{customer.regency_city || '-'}</p>
                            <p className="text-sm text-muted-foreground">{customer.province || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.is_aggregated ? "destructive" : "default"}>
                            {customer.is_aggregated ? 'Aggregated' : 'Known'}
                          </Badge>
                        </TableCell>
                        <TableCell>{customer.total_orders.toLocaleString('id-ID')}</TableCell>
                        <TableCell>Rp {customer.total_amount.toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          Rp {(customer.total_amount / customer.total_orders).toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredCustomers.length > 50 && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Showing first 50 of {filteredCustomers.length} customers
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aggregated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aggregated Unknown Customers by Location</CardTitle>
              <p className="text-muted-foreground">
                Customer yang tidak diketahui namanya, dikelompokkan berdasarkan regency_city dan province
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location Group</TableHead>
                      <TableHead>Kota/Kabupaten</TableHead>
                      <TableHead>Provinsi</TableHead>
                      <TableHead>Aggregated Customers</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Avg Order Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aggregatedCustomers.filter(c => c.is_aggregated).map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.display_name}</p>
                            <p className="text-sm text-muted-foreground">ID: {customer.location_key}</p>
                          </div>
                        </TableCell>
                        <TableCell>{customer.regency_city || 'Tidak diketahui'}</TableCell>
                        <TableCell>{customer.province || 'Tidak diketahui'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.customer_count} customers</Badge>
                        </TableCell>
                        <TableCell>{customer.total_orders.toLocaleString('id-ID')}</TableCell>
                        <TableCell>Rp {customer.total_amount.toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          Rp {(customer.total_amount / customer.total_orders).toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              {/* Top Customers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Customers by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Total Revenue</TableHead>
                          <TableHead>Orders</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.topCustomers.map((customer: AggregatedCustomer, index: number) => (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <Badge variant="outline">#{index + 1}</Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{customer.display_name}</p>
                                {customer.is_aggregated && (
                                  <p className="text-sm text-muted-foreground">
                                    {customer.customer_count} customers
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {customerAggregationUtils.getCustomerLocationSummary(customer)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={customer.is_aggregated ? "destructive" : "default"}>
                                {customer.is_aggregated ? 'Aggregated' : 'Known'}
                              </Badge>
                            </TableCell>
                            <TableCell>Rp {customer.total_amount.toLocaleString('id-ID')}</TableCell>
                            <TableCell>{customer.total_orders.toLocaleString('id-ID')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Province Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Distribution by Province</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provinsi</TableHead>
                          <TableHead>Total Customers</TableHead>
                          <TableHead>Known Customers</TableHead>
                          <TableHead>Unknown Groups</TableHead>
                          <TableHead>Total Revenue</TableHead>
                          <TableHead>% Unknown Orders</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.provinceDistribution.map((prov: any) => (
                          <TableRow key={prov.province}>
                            <TableCell className="font-medium">{prov.province}</TableCell>
                            <TableCell>{prov.customer_count.toLocaleString('id-ID')}</TableCell>
                            <TableCell>
                              <Badge variant="default">{prov.known_customers}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">{prov.unknown_groups}</Badge>
                            </TableCell>
                            <TableCell>Rp {prov.total_amount.toLocaleString('id-ID')}</TableCell>
                            <TableCell>
                              {prov.customer_count > 0 ? 
                                ((prov.customer_count - prov.known_customers) / prov.customer_count * 100).toFixed(1) + '%' : 
                                '0%'
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}