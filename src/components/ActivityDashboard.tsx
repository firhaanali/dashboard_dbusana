import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  AlertCircle, 
  TrendingUp, 
  Upload, 
  ArrowUpDown, 
  FileText, 
  Megaphone, 
  Activity,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DateRangePicker } from './DateRangePicker';
import { useSalesData } from '../contexts/SalesDataContext';
import { simpleApiDashboard } from '../utils/simpleApiUtils';
import { getRecentActivities, type ActivityType, type ActivityStatus } from '../utils/activityLogger';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
  value?: string;
  status?: ActivityStatus;
  created_at: string;
  metadata?: Record<string, any>;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'sale': return ShoppingCart;
    case 'product': return Package;
    case 'customer': return Users;
    case 'payment': return DollarSign;
    case 'alert': return AlertCircle;
    case 'achievement': return TrendingUp;
    case 'import': return Upload;
    case 'stock': return ArrowUpDown;
    case 'advertising': return Megaphone;
    case 'affiliate': return Users;
    case 'system': return Activity;
    default: return Package;
  }
};

const getStatusIcon = (status: ActivityStatus) => {
  switch (status) {
    case 'success': return CheckCircle;
    case 'warning': return AlertTriangle;
    case 'error': return XCircle;
    case 'info': return Info;
    default: return Info;
  }
};

const getStatusColor = (status: ActivityStatus) => {
  switch (status) {
    case 'success': return 'text-accent-primary bg-accent-secondary';
    case 'warning': return 'text-accent-primary bg-accent-muted';
    case 'error': return 'text-destructive bg-destructive/10';
    case 'info': return 'text-accent-primary bg-accent-secondary';
    default: return 'text-muted-foreground bg-muted';
  }
};

const getBadgeVariant = (status: ActivityStatus) => {
  switch (status) {
    case 'success': return 'default';
    case 'warning': return 'secondary';
    case 'error': return 'destructive';
    case 'info': return 'outline';
    default: return 'secondary';
  }
};

export function ActivityDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Use SalesData context
  const { salesData } = useSalesData();

  // Activity stats - Real calculation from activities data
  const activityStats = useMemo(() => {
    if (activities.length === 0) {
      return {
        total: 0,
        success: 0,
        warning: 0,
        error: 0,
        info: 0,
      };
    }

    const stats = activities.reduce((acc, activity) => {
      acc.total++;
      acc[activity.status] = (acc[activity.status] || 0) + 1;
      return acc;
    }, {
      total: 0,
      success: 0,
      warning: 0,
      error: 0,
      info: 0,
    });

    return stats;
  }, [activities]);

  // Activity types breakdown - Real calculation from activities data
  const typeBreakdown = useMemo(() => {
    if (activities.length === 0) return [];

    const typeMap = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeMap).sort((a, b) => b[1] - a[1]);
  }, [activities]);

  // Fetch all activities - Real implementation using API
  const fetchActivities = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      console.log('🔄 ActivityDashboard - Loading real data from API...');
      
      // Fetch activities from API
      const response = await getRecentActivities(100); // Get more activities for better filtering
      
      if (response.success && response.data) {
        const activitiesData = Array.isArray(response.data) ? response.data : [];
        setActivities(activitiesData);
        console.log(`✅ Loaded ${activitiesData.length} activity records`);
        
        if (activitiesData.length === 0) {
          setError(null); // No error, just empty data
        }
      } else {
        console.warn('⚠️ No activity data available:', response.error);
        setActivities([]);
        if (response.error && !response.error.includes('empty table')) {
          setError(response.error);
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading activities:', error);
      setError(error instanceof Error ? error.message : 'Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Apply filters - Real implementation with search and filtering
  useEffect(() => {
    let filtered = [...activities];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(searchLower) ||
        activity.description.toLowerCase().includes(searchLower) ||
        activity.type.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity => activity.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.created_at);
        
        switch (dateFilter) {
          case 'today':
            return activityDate >= startOfToday;
          case 'week':
            return activityDate >= startOfWeek;
          case 'month':
            return activityDate >= startOfMonth;
          default:
            return true;
        }
      });
    }

    // Sort by created_at descending (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredActivities(filtered);
    console.log(`🔍 Applied filters: ${filtered.length} of ${activities.length} activities`);
  }, [activities, searchTerm, typeFilter, statusFilter, dateFilter]);

  // Initial load
  useEffect(() => {
    fetchActivities(false);
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing && !loading) {
        console.log('🔄 Auto-refreshing activities...');
        fetchActivities(true);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refreshing, loading]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDateTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Waktu tidak valid';
      }
      
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Waktu tidak valid';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      const now = new Date();
      const activityDate = new Date(timestamp);
      
      if (isNaN(activityDate.getTime())) {
        return 'Waktu tidak valid';
      }
      
      const diffMs = now.getTime() - activityDate.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMinutes < 1) return 'Baru saja';
      if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays < 30) return `${diffDays} hari lalu`;
      return activityDate.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Waktu tidak valid';
    }
  };

  // Transform activities for display - Real implementation with proper formatting
  const displayActivities = useMemo(() => {
    return filteredActivities.map(activity => ({
      ...activity,
      time: formatTimeAgo(activity.created_at),
      value: activity.metadata?.amount ? 
        formatCurrency(Number(activity.metadata.amount)) : 
        (activity.metadata?.quantity ? 
          `${activity.metadata.quantity} unit` : 
          (activity.metadata?.record_count ? 
            `${activity.metadata.record_count} records` : 
            undefined))
    }));
  }, [filteredActivities]);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Activities</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchActivities()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-bold">Activity Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor semua aktivitas business D'Busana secara real-time
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchActivities(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Memperbarui...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Aktivitas</p>
                <p className="text-2xl font-semibold text-card-foreground">{activityStats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-accent-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success</p>
                <p className="text-2xl font-semibold text-accent-primary">{activityStats.success}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-accent-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warning</p>
                <p className="text-2xl font-semibold text-accent-primary">{activityStats.warning}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-accent-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error</p>
                <p className="text-2xl font-semibold text-destructive">{activityStats.error}</p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Info</p>
                <p className="text-2xl font-semibold text-accent-primary">{activityStats.info}</p>
              </div>
              <Info className="w-8 h-8 text-accent-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari aktivitas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="sale">Penjualan</SelectItem>
                <SelectItem value="import">Import Data</SelectItem>
                <SelectItem value="stock">Stock Movement</SelectItem>
                <SelectItem value="advertising">Advertising</SelectItem>
                <SelectItem value="product">Produk</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Waktu</SelectItem>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">Minggu Ini</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Menampilkan {filteredActivities.length} dari {activities.length} aktivitas
          </div>
        </CardContent>
      </Card>

      {/* Activity Type Breakdown - Hidden in clean mode */}
      {typeBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Breakdown Tipe Aktivitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {typeBreakdown.map(([type, count]) => {
                const Icon = getActivityIcon(type as ActivityType);
                return (
                  <div key={type} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Icon className="w-5 h-5 text-accent-primary" />
                    <div>
                      <p className="font-medium capitalize text-card-foreground">{type}</p>
                      <p className="text-sm text-muted-foreground">{count} aktivitas</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Aktivitas ({displayActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-muted/50 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-muted/50 rounded animate-pulse w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Tidak Ada Aktivitas Ditemukan</h3>
              <p className="text-muted-foreground">
                Coba ubah filter pencarian atau lakukan refresh untuk melihat aktivitas terbaru
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aktivitas</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayActivities.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    const StatusIcon = getStatusIcon(activity.status);
                    
                    return (
                      <TableRow key={activity.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(activity.status)}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-card-foreground">{activity.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {activity.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-4 h-4 ${getStatusColor(activity.status).split(' ')[0]}`} />
                            <Badge variant={getBadgeVariant(activity.status)} className="capitalize">
                              {activity.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {activity.value && (
                            <Badge variant="outline">{activity.value}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{activity.time}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(activity.created_at)}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}