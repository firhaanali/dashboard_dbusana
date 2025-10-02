import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Settings, 
  Palette, 
  Globe, 
  Bell, 
  Monitor, 
  Download, 
  Database, 
  Mail, 
  Shield, 
  Eye,
  RefreshCw,
  Save,
  CheckCircle,
  AlertTriangle,
  Moon,
  Sun,
  Smartphone,
  Laptop,
  Clock,
  FileText,
  BarChart3,
  Zap,
  User,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeTestComponent } from './ThemeTestComponent';
import { ColorSchemeDemo } from './ColorSchemeDemo';

interface AppSettings {
  // Theme Settings
  theme: 'light' | 'dark' | 'system';
  color_scheme: 'blue' | 'green' | 'purple' | 'orange';
  
  // Language & Localization
  language: 'id' | 'en';
  timezone: string;
  date_format: 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'YYYY-MM-DD';
  currency: 'IDR' | 'USD' | 'EUR';
  
  // Notifications
  email_notifications: boolean;
  push_notifications: boolean;
  import_notifications: boolean;
  report_notifications: boolean;
  system_notifications: boolean;
  
  // Dashboard Preferences
  default_dashboard: 'overview' | 'sales' | 'inventory' | 'analytics';
  dashboard_refresh_interval: number; // in minutes
  chart_animation: boolean;
  compact_view: boolean;
  
  // Data & Privacy
  data_retention_days: number;
  export_format_preference: 'excel' | 'pdf' | 'csv';
  auto_backup: boolean;
  analytics_tracking: boolean;
  
  // Performance
  lazy_loading: boolean;
  cache_enabled: boolean;
  batch_size: number;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  color_scheme: 'blue',
  language: 'id',
  timezone: 'Asia/Jakarta',
  date_format: 'DD-MM-YYYY',
  currency: 'IDR',
  email_notifications: true,
  push_notifications: true,
  import_notifications: true,
  report_notifications: true,
  system_notifications: false,
  default_dashboard: 'overview',
  dashboard_refresh_interval: 5,
  chart_animation: true,
  compact_view: false,
  data_retention_days: 365,
  export_format_preference: 'excel',
  auto_backup: true,
  analytics_tracking: true,
  lazy_loading: true,
  cache_enabled: true,
  batch_size: 100
};

export function UserSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<AppSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const { theme, setTheme, colorScheme, setColorScheme } = useTheme();

  useEffect(() => {
    loadUserSettings();
  }, []);

  // Sync theme and color scheme with global context
  useEffect(() => {
    if (settings.theme !== theme) {
      setSettings(prev => ({ ...prev, theme }));
    }
  }, [theme]);

  useEffect(() => {
    if (settings.color_scheme !== colorScheme) {
      setSettings(prev => ({ ...prev, color_scheme: colorScheme }));
    }
  }, [colorScheme]);

  useEffect(() => {
    const isChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(isChanged);
  }, [settings, originalSettings]);

  const loadUserSettings = () => {
    try {
      setLoading(true);
      console.log('🔄 Loading user settings from localStorage...');
      
      const localSettings = localStorage.getItem('d-busana-settings');
      if (localSettings) {
        try {
          const parsedSettings = JSON.parse(localSettings);
          const userSettings = { ...defaultSettings, ...parsedSettings };
          setSettings(userSettings);
          setOriginalSettings(userSettings);
          console.log('✅ Settings loaded from localStorage');
          
          toast.success('✅ Pengaturan dimuat', {
            description: 'Data pengaturan tersinkronisasi'
          });
        } catch (parseError) {
          console.log('⚠️ Failed to parse settings, using defaults');
          setSettings(defaultSettings);
          setOriginalSettings(defaultSettings);
        }
      } else {
        console.log('✅ Using default settings');
        setSettings(defaultSettings);
        setOriginalSettings(defaultSettings);
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      setSettings(defaultSettings);
      setOriginalSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    try {
      setLoading(true);
      console.log('💾 Saving user settings to localStorage...');
      
      localStorage.setItem('d-busana-settings', JSON.stringify(settings));
      setOriginalSettings({ ...settings });
      console.log('✅ Settings saved successfully');
      
      toast.success('✅ Pengaturan berhasil disimpan', {
        description: 'Semua perubahan tersimpan secara lokal'
      });
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      toast.error('❌ Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    try {
      setLoading(true);
      
      localStorage.removeItem('d-busana-settings');
      setSettings(defaultSettings);
      setOriginalSettings(defaultSettings);
      
      toast.success('🔄 Pengaturan dikembalikan ke default');
    } catch (error) {
      toast.error('❌ Gagal reset pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSettings = () => {
    loadUserSettings();
    toast.info('🔄 Memuat ulang pengaturan...');
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Apply theme and color scheme changes immediately
    if (key === 'theme') {
      setTheme(value as 'light' | 'dark' | 'system');
      toast.success('🎨 Tema berhasil diterapkan', {
        description: `Tema ${value} sedang diterapkan ke seluruh dashboard`
      });
    }
    
    if (key === 'color_scheme') {
      setColorScheme(value as 'blue' | 'green' | 'purple' | 'orange');
      toast.success('🎨 Skema warna berhasil diterapkan', {
        description: `Skema warna ${value} sedang diterapkan ke seluruh dashboard`
      });
    }
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'system': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getColorPreview = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500'
    };
    return colors[color as keyof typeof colors] || 'bg-blue-500';
  };

  if (loading && !settings.theme) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Pengaturan Aplikasi</h1>
          <p className="text-muted-foreground">
            Kustomisasi pengalaman dan preferensi aplikasi Anda
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshSettings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleResetSettings} disabled={loading}>
            <Settings className="h-4 w-4 mr-2" />
            Reset Default
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Simpan Perubahan
            {hasChanges && <Badge className="ml-2 bg-orange-500">!</Badge>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Tampilan & Tema
            </CardTitle>
            <CardDescription>
              Kustomisasi tampilan dan tema aplikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Tema</Label>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    theme === 'light' ? 'bg-yellow-400' : 
                    theme === 'dark' ? 'bg-slate-700' : 
                    'bg-gradient-to-r from-yellow-400 to-slate-700'
                  }`} />
                  <span className="text-xs text-muted-foreground capitalize">
                    {theme === 'system' ? 'Auto' : theme}
                  </span>
                </div>
              </div>
              <Select 
                value={settings.theme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    {getThemeIcon(settings.theme)}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Terang
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Gelap
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Ikuti Sistem
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Skema Warna</Label>
              <div className="grid grid-cols-4 gap-2">
                {['blue', 'green', 'purple', 'orange'].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateSetting('color_scheme', color as any)}
                    disabled={loading}
                    className={`p-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      settings.color_scheme === color 
                        ? 'border-accent-primary bg-accent-secondary' 
                        : 'border-border hover:border-accent-primary/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full mx-auto ${getColorPreview(color)}`} />
                    <span className="text-xs mt-1 block capitalize">{color}</span>
                    {settings.color_scheme === color && (
                      <div className="w-2 h-2 bg-accent-primary rounded-full mx-auto mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Animasi Chart</Label>
                <Switch
                  checked={settings.chart_animation}
                  onCheckedChange={(checked) => updateSetting('chart_animation', checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Tampilan Kompak</Label>
                <Switch
                  checked={settings.compact_view}
                  onCheckedChange={(checked) => updateSetting('compact_view', checked)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Real-time Color Demo */}
            <div className="space-y-3">
              <Label>Preview Real-time</Label>
              <div 
                className="p-4 border-2 rounded-lg transition-all duration-300"
                style={{ 
                  borderColor: 'var(--accent-border)', 
                  backgroundColor: 'var(--accent-muted)' 
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 
                    className="font-medium"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    Live Preview Card
                  </h4>
                  <Badge 
                    style={{ 
                      backgroundColor: 'var(--accent-primary)', 
                      color: 'var(--accent-primary-foreground)' 
                    }}
                  >
                    {settings.color_scheme}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Card ini menggunakan accent colors yang berubah real-time sesuai skema warna
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    style={{ 
                      backgroundColor: 'var(--accent-primary)', 
                      color: 'var(--accent-primary-foreground)' 
                    }}
                  >
                    Accent Primary
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    style={{ 
                      borderColor: 'var(--accent-primary)', 
                      color: 'var(--accent-primary)' 
                    }}
                  >
                    Accent Outline
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language & Localization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Bahasa & Lokalisasi
            </CardTitle>
            <CardDescription>
              Pengaturan bahasa, mata uang, dan format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Bahasa</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value: 'id' | 'en') => updateSetting('language', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Zona Waktu</Label>
              <Select 
                value={settings.timezone} 
                onValueChange={(value) => updateSetting('timezone', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB)</SelectItem>
                  <SelectItem value="Asia/Makassar">Asia/Makassar (WITA)</SelectItem>
                  <SelectItem value="Asia/Jayapura">Asia/Jayapura (WIT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Format Tanggal</Label>
              <Select 
                value={settings.date_format} 
                onValueChange={(value: any) => updateSetting('date_format', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</SelectItem>
                  <SelectItem value="MM-DD-YYYY">MM-DD-YYYY (12-31-2024)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Mata Uang</Label>
              <Select 
                value={settings.currency} 
                onValueChange={(value: any) => updateSetting('currency', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">IDR - Rupiah Indonesia</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifikasi
            </CardTitle>
            <CardDescription>
              Kelola preferensi notifikasi Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Terima notifikasi via email</p>
                </div>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notifikasi push di browser</p>
                </div>
              </div>
              <Switch
                checked={settings.push_notifications}
                onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Import Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notifikasi saat import data</p>
                </div>
              </div>
              <Switch
                checked={settings.import_notifications}
                onCheckedChange={(checked) => updateSetting('import_notifications', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Report Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notifikasi laporan selesai</p>
                </div>
              </div>
              <Switch
                checked={settings.report_notifications}
                onCheckedChange={(checked) => updateSetting('report_notifications', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>System Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notifikasi sistem dan maintenance</p>
                </div>
              </div>
              <Switch
                checked={settings.system_notifications}
                onCheckedChange={(checked) => updateSetting('system_notifications', checked)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Preferensi Dashboard
            </CardTitle>
            <CardDescription>
              Kustomisasi tampilan dan perilaku dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Dashboard Default</Label>
              <Select 
                value={settings.default_dashboard} 
                onValueChange={(value: any) => updateSetting('default_dashboard', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Interval Refresh Dashboard (menit)</Label>
              <Select 
                value={settings.dashboard_refresh_interval.toString()} 
                onValueChange={(value) => updateSetting('dashboard_refresh_interval', parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Menit</SelectItem>
                  <SelectItem value="5">5 Menit</SelectItem>
                  <SelectItem value="15">15 Menit</SelectItem>
                  <SelectItem value="30">30 Menit</SelectItem>
                  <SelectItem value="60">1 Jam</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Format Export Preferensi</Label>
              <Select 
                value={settings.export_format_preference} 
                onValueChange={(value: any) => updateSetting('export_format_preference', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Auto Backup</Label>
                <Switch
                  checked={settings.auto_backup}
                  onCheckedChange={(checked) => updateSetting('auto_backup', checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Cache Enabled</Label>
                <Switch
                  checked={settings.cache_enabled}
                  onCheckedChange={(checked) => updateSetting('cache_enabled', checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Lazy Loading</Label>
                <Switch
                  checked={settings.lazy_loading}
                  onCheckedChange={(checked) => updateSetting('lazy_loading', checked)}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}