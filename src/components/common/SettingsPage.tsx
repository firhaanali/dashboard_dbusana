import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { ThemePreview } from '../ThemePreview';
import { ThemeToggle } from '../ThemeToggle';
import { ColorSchemeSelector } from '../ColorSchemeSelector';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Globe, 
  Zap,
  ChevronRight,
  Save,
  Building2,
  RefreshCw,
  Monitor,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useNavigate } from 'react-router-dom';

interface BusinessSettings {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  tax_number: string;
  auto_backup: boolean;
  email_notifications: boolean;
  dashboard_refresh: boolean;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    business_name: 'D\'Busana Fashion',
    business_address: 'Jakarta, Indonesia', 
    business_phone: '+62 21 1234567',
    business_email: 'info@dbusana.com',
    tax_number: '12.345.678.9-012.000',
    auto_backup: true,
    email_notifications: true,
    dashboard_refresh: true
  });

  const settingsSections = [
    {
      id: 'profile',
      title: 'Profil Pengguna',
      description: 'Kelola informasi akun dan profil Anda',
      icon: User,
      color: 'green',
      route: '/profile',
      available: true
    },
    {
      id: 'user-settings',
      title: 'Pengaturan Aplikasi',
      description: 'Kustomisasi preferensi dan tampilan aplikasi',
      icon: Palette,
      color: 'blue',
      route: '/user-settings',
      available: true
    },
    {
      id: 'user-management',
      title: 'Manajemen User',
      description: 'Kelola pengguna sistem dan hak akses',
      icon: Shield,
      color: 'red',
      route: '/user-management',
      available: true
    },
    {
      id: 'notifications',
      title: 'Notifikasi',
      description: 'Atur preferensi notifikasi sistem',
      icon: Bell,
      color: 'yellow',
      route: '/user-settings',
      available: true
    },
    {
      id: 'integrations',
      title: 'Integrasi',
      description: 'Koneksi marketplace dan layanan eksternal',
      icon: Globe,
      color: 'indigo',
      available: false
    },
    {
      id: 'advanced',
      title: 'Pengaturan Lanjutan',
      description: 'Konfigurasi sistem tingkat lanjut',
      icon: Zap,
      color: 'orange',
      available: false
    }
  ];

  useEffect(() => {
    loadBusinessSettings();
  }, []);

  const loadBusinessSettings = () => {
    try {
      setLoading(true);
      console.log('🔄 Loading business settings from localStorage...');
      
      const localSettings = localStorage.getItem('d-busana-business-settings');
      if (localSettings) {
        try {
          const parsedSettings = JSON.parse(localSettings);
          setBusinessSettings({ ...businessSettings, ...parsedSettings });
          console.log('✅ Business settings loaded from localStorage');
        } catch (parseError) {
          console.log('⚠️ Failed to parse business settings, using defaults');
        }
      }
      
      console.log('✅ Business settings initialized');
    } catch (error) {
      console.error('❌ Error loading business settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusinessSettings = () => {
    try {
      setLoading(true);
      console.log('💾 Saving business settings to localStorage...');
      
      localStorage.setItem('d-busana-business-settings', JSON.stringify(businessSettings));
      console.log('✅ Business settings saved successfully');
      
      toast.success('✅ Pengaturan bisnis berhasil disimpan', {
        description: 'Semua perubahan tersimpan secara lokal'
      });
    } catch (error) {
      console.error('❌ Error saving business settings:', error);
      toast.error('❌ Gagal menyimpan pengaturan bisnis');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSettings = () => {
    loadBusinessSettings();
    toast.info('🔄 Memuat ulang pengaturan...');
  };

  const handleNavigateToSection = (route?: string) => {
    if (route) {
      navigate(route);
    }
  };

  const updateBusinessSetting = (field: keyof BusinessSettings, value: string | boolean) => {
    setBusinessSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading && !businessSettings.business_name) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Pengaturan Sistem</h1>
          <p className="text-muted-foreground">
            Kelola preferensi dan konfigurasi dashboard D'Busana
          </p>
        </div>
        <Button variant="outline" onClick={handleRefreshSettings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Settings - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informasi Bisnis
              </CardTitle>
              <CardDescription>
                Pengaturan dasar informasi bisnis D'Busana
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nama Bisnis</Label>
                  <Input
                    id="business_name"
                    value={businessSettings.business_name}
                    onChange={(e) => updateBusinessSetting('business_name', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_number">Nomor Pajak</Label>
                  <Input
                    id="tax_number"
                    value={businessSettings.tax_number}
                    onChange={(e) => updateBusinessSetting('tax_number', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="business_address">Alamat Bisnis</Label>
                <Input
                  id="business_address"
                  value={businessSettings.business_address}
                  onChange={(e) => updateBusinessSetting('business_address', e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_phone">Telepon Bisnis</Label>
                  <Input
                    id="business_phone"
                    value={businessSettings.business_phone}
                    onChange={(e) => updateBusinessSetting('business_phone', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_email">Email Bisnis</Label>
                  <Input
                    id="business_email"
                    type="email"
                    value={businessSettings.business_email}
                    onChange={(e) => updateBusinessSetting('business_email', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Preferensi Sistem</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Auto Backup</Label>
                      <p className="text-sm text-muted-foreground">Backup otomatis data harian</p>
                    </div>
                  </div>
                  <Switch
                    checked={businessSettings.auto_backup}
                    onCheckedChange={(checked) => updateBusinessSetting('auto_backup', checked)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Notifikasi email untuk aktivitas penting</p>
                    </div>
                  </div>
                  <Switch
                    checked={businessSettings.email_notifications}
                    onCheckedChange={(checked) => updateBusinessSetting('email_notifications', checked)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Dashboard Auto Refresh</Label>
                      <p className="text-sm text-muted-foreground">Perbarui data dashboard secara otomatis</p>
                    </div>
                  </div>
                  <Switch
                    checked={businessSettings.dashboard_refresh}
                    onCheckedChange={(checked) => updateBusinessSetting('dashboard_refresh', checked)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleSaveBusinessSettings}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Pengaturan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Menu - Right Column */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <Card className={`transition-all duration-300 ${actualTheme === 'dark' ? 'border-gray-700 shadow-lg' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Tema & Tampilan
              </CardTitle>
              <CardDescription>
                Kustomisasi tema dan skema warna dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>Tema Display</Label>
                    <p className="text-sm text-muted-foreground">Pilih mode tampilan</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label>Skema Warna</Label>
                    <p className="text-sm text-muted-foreground">Pilih warna aksen</p>
                  </div>
                </div>
                <ColorSchemeSelector />
              </div>
              
              <Separator />
              
              {/* Theme Preview */}
              <div className="pt-2">
                <Label className="text-sm font-medium mb-3 block">Preview Tema</Label>
                <div className="scale-75 origin-top-left">
                  <ThemePreview />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Menu */}
          <Card>
            <CardHeader>
              <CardTitle>Menu Pengaturan</CardTitle>
              <CardDescription>
                Akses pengaturan detail setiap modul
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {settingsSections.map((section) => (
                <div
                  key={section.id}
                  onClick={() => section.available && handleNavigateToSection(section.route)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                    ${section.available 
                      ? 'hover:shadow-md cursor-pointer hover:border-primary/50 interactive-hover' 
                      : 'opacity-60 cursor-not-allowed'
                    }
                  `}
                >
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${
                    section.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    section.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                    section.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                    section.color === 'red' ? 'bg-red-100 dark:bg-red-900/20' :
                    section.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                    section.color === 'pink' ? 'bg-pink-100 dark:bg-pink-900/20' :
                    section.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/20' :
                    'bg-orange-100 dark:bg-orange-900/20'
                  }`}>
                    <section.icon className={`w-4 h-4 ${
                      section.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      section.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      section.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                      section.color === 'red' ? 'text-red-600 dark:text-red-400' :
                      section.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                      section.color === 'pink' ? 'text-pink-600 dark:text-pink-400' :
                      section.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' :
                      'text-orange-600 dark:text-orange-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{section.title}</h4>
                      {!section.available && (
                        <Badge variant="outline" className="text-xs">
                          Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  {section.available && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Enhanced Quick Info */}
          <Card className={`
            bg-gradient-to-br transition-all duration-300
            ${actualTheme === 'dark' 
              ? 'from-blue-950/30 to-indigo-950/30 border-blue-800/50' 
              : 'from-blue-50 to-indigo-50 border-blue-200'
            }
          `}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg transition-colors duration-200
                  ${actualTheme === 'dark' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-500 text-white'
                  }
                `}>
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`
                    font-medium mb-1 transition-colors duration-200
                    ${actualTheme === 'dark' 
                      ? 'text-blue-100' 
                      : 'text-blue-900'
                    }
                  `}>
                    Tips Pengaturan
                  </h4>
                  <p className={`
                    text-sm transition-colors duration-200
                    ${actualTheme === 'dark' 
                      ? 'text-blue-200' 
                      : 'text-blue-800'
                    }
                  `}>
                    Atur preferensi aplikasi sesuai kebutuhan bisnis untuk pengalaman yang optimal. 
                    Gunakan mode gelap untuk penggunaan malam hari.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}