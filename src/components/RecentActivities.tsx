import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, Users, DollarSign, AlertCircle, TrendingUp, Upload, ArrowUpDown, FileText, Megaphone, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { getRecentActivities, type ActivityType, type ActivityStatus } from '../utils/activityLogger';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
  value?: string;
  status?: ActivityStatus;
  created_at?: string;
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

export function RecentActivities() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Fetch recent activities using same source as ActivityDashboard
  const fetchRecentActivities = async (isRefresh = false) => {
    // Rate limiting: prevent fetch if called within last 5 seconds
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefresh.getTime();
    
    if (isRateLimited || (timeSinceLastRefresh < 5000 && isRefresh)) {
      console.log('🚫 Rate limited: RecentActivities fetch skipped');
      return;
    }

    try {
      setIsRateLimited(true);
      
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      console.log('🔄 RecentActivities - Fetching activities from database...');
      
      // Use same data source as ActivityDashboard
      const activitiesResponse = await getRecentActivities(5); // Get 5 to show top 3
      
      if (activitiesResponse.success && activitiesResponse.data) {
        const activities = Array.isArray(activitiesResponse.data) ? activitiesResponse.data : [];
        setRecentActivities(activities);
        setLastRefresh(new Date());
        
        console.log(`✅ Recent activities loaded from database:`, {
          count: activities.length,
          activities: activities.slice(0, 3).map((a: any) => ({
            type: a.type || 'system',
            title: a.title,
            created_at: a.created_at
          }))
        });
        
        if (activities.length === 0) {
          setError(null); // No error, just empty data
        }
      } else {
        console.warn('⚠️ No activity data available:', activitiesResponse.error);
        setRecentActivities([]);
        if (activitiesResponse.error && !activitiesResponse.error.includes('empty table')) {
          setError('Tidak dapat memuat aktivitas terbaru');
        }
      }

    } catch (error) {
      console.error('❌ Error fetching activities:', error);
      setRecentActivities([]);
      setError('Gagal memuat aktivitas terbaru');
    } finally {
      setLoading(false);
      setRefreshing(false);
      
      // Release rate limit after 5 seconds
      setTimeout(() => {
        setIsRateLimited(false);
      }, 5000);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRecentActivities(false);
  }, []);

  // Auto-refresh every 30 seconds to match ActivityDashboard
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRateLimited && !refreshing && !loading) {
        console.log('🔄 Auto-refreshing recent activities...');
        fetchRecentActivities(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isRateLimited, refreshing, loading]);

  // Manual refresh handler with rate limiting check
  const handleRefresh = () => {
    if (!isRateLimited) {
      fetchRecentActivities(true);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
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

  // Transform activities data to display format - consistent with ActivityDashboard
  const displayActivities = useMemo(() => {
    if (!recentActivities || recentActivities.length === 0) {
      return [];
    }

    return recentActivities.map((activity, index) => {
      // Use same transformation logic as ActivityDashboard
      const activityData: Activity = {
        id: activity.id || `activity-${index}`,
        type: activity.type || 'system',
        title: activity.title || 'Aktivitas Sistem',
        description: activity.description || 'Aktivitas sistem terbaru',
        time: formatTimeAgo(activity.created_at || new Date().toISOString()),
        status: activity.status || 'info',
        metadata: activity.metadata
      };

      // Add value based on metadata - same as ActivityDashboard
      if (activity.metadata?.amount) {
        activityData.value = formatCurrency(Number(activity.metadata.amount));
      } else if (activity.metadata?.quantity) {
        activityData.value = `${activity.metadata.quantity} unit`;
      } else if (activity.metadata?.record_count) {
        activityData.value = `${activity.metadata.record_count} records`;
      }

      return activityData;
    }).slice(0, 3); // Show only top 3 activities
  }, [recentActivities]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activities</CardTitle>
            <p className="text-muted-foreground mt-1">
              Terakhir diperbarui: {lastRefresh.toLocaleTimeString('id-ID')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || isRateLimited}
            className="gap-2"
          >
            <Activity className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Memperbarui...' : isRateLimited ? 'Rate Limited' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {loading ? (
          <div className="space-y-4 flex-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-muted/50 rounded animate-pulse mb-1"></div>
                  <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6 flex-1 flex flex-col justify-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <h3 className="text-foreground mb-2">Error Loading Activities</h3>
            <p className="text-muted-foreground mb-3">
              {error}
            </p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Coba Lagi
            </Button>
          </div>
        ) : displayActivities.length === 0 ? (
          <div className="text-center py-6 flex-1 flex flex-col justify-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-foreground mb-2">Belum Ada Aktivitas</h3>
            <p className="text-muted-foreground mb-3">
              Aktivitas akan muncul setelah ada import data atau transaksi bisnis
            </p>
            <div className="text-muted-foreground space-y-1">
              <div>💡 Import data untuk mencatat aktivitas pertama</div>
              <div>🔄 Sistem otomatis merekam ke activity_logs</div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 flex-1">
              {displayActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const statusColor = getStatusColor(activity.status);
                
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-foreground">{activity.title}</h4>
                          <p className="text-muted-foreground mt-1">{activity.description}</p>
                          <p className="text-muted-foreground/70 mt-2">{activity.time}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          {activity.value && (
                            <Badge variant="outline">
                              {activity.value}
                            </Badge>
                          )}
                          <Badge variant={getBadgeVariant(activity.status)}>
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <Button 
                variant="ghost" 
                className="text-accent-primary hover:text-accent-primary/80 p-0 h-auto"
                onClick={() => navigate('/activities')}
              >
                Lihat semua aktivitas →
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}