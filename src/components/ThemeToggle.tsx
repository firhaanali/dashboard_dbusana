import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Sun, Moon, Monitor, Palette, Check, Laptop, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, actualTheme, colorScheme, setColorScheme, lastAutoChange, isTimeBasedActive } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute for auto theme
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getTimeBasedInfo = () => {
    // Use Jakarta timezone (Asia/Jakarta)
    const jakartaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta"
    });
    const jakartaDate = new Date(jakartaTime);
    const hour = jakartaDate.getHours();
    const timeString = jakartaDate.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: "Asia/Jakarta"
    });
    
    if (hour >= 6 && hour < 18) {
      return {
        current: 'light',
        timeString: `${timeString} WIB`,
        nextChange: `Mode gelap dimulai jam 18:00 WIB`,
        isDay: true
      };
    } else {
      return {
        current: 'dark',
        timeString: `${timeString} WIB`,
        nextChange: `Mode terang dimulai jam 06:00 WIB`,
        isDay: false
      };
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4 text-amber-500" />;
      case 'dark':
        return <Moon className="h-4 w-4 text-blue-400" />;
      case 'system':
        // Show clock icon if time-based is active, laptop if following system
        return isTimeBasedActive 
          ? <Clock className="h-4 w-4 text-purple-500" />
          : <Laptop className="h-4 w-4 text-gray-500" />;
      default:
        return <Palette className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Terang';
      case 'dark':
        return 'Gelap';
      case 'system':
        return isTimeBasedActive ? 'Auto Jam' : 'Sistem';
      default:
        return 'Tema';
    }
  };

  const getColorSchemeIcon = (scheme: string) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500', 
      purple: 'bg-purple-500',
      orange: 'bg-orange-500'
    };
    return colors[scheme as keyof typeof colors] || colors.blue;
  };

  const getColorSchemeName = (scheme: string) => {
    const names = {
      blue: 'Biru',
      green: 'Hijau',
      purple: 'Ungu', 
      orange: 'Oranye'
    };
    return names[scheme as keyof typeof names] || 'Biru';
  };

  return (
    <div 
      className="flex items-center gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`
              gap-2 transition-all duration-200 
              ${isHovered ? 'scale-105 shadow-lg' : ''}
              hover:border-accent-primary/50
            `}
          >
            {getThemeIcon()}
            <span className="hidden sm:inline font-medium">{getThemeLabel()}</span>
            {theme === 'system' && isTimeBasedActive && (
              <Badge variant="outline" className="ml-1 text-xs px-1.5 py-0.5 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-600">
                <Clock className="w-3 h-3 mr-1" />
                {getTimeBasedInfo().isDay ? '☀️' : '🌙'}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Pengaturan Tema
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Theme Selection */}
          <DropdownMenuItem 
            onClick={() => setTheme('light')}
            className="gap-3 cursor-pointer hover:bg-accent"
          >
            <Sun className="h-4 w-4 text-amber-500" />
            <div className="flex-1">
              <div className="font-medium">Mode Terang</div>
              <div className="text-xs text-muted-foreground">Tampilan terang untuk siang hari</div>
            </div>
            {theme === 'light' && <Check className="h-4 w-4 text-green-500" />}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setTheme('dark')}
            className="gap-3 cursor-pointer hover:bg-accent"
          >
            <Moon className="h-4 w-4 text-blue-400" />
            <div className="flex-1">
              <div className="font-medium">Mode Gelap</div>
              <div className="text-xs text-muted-foreground">Tampilan gelap untuk mata nyaman</div>
            </div>
            {theme === 'dark' && <Check className="h-4 w-4 text-green-500" />}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setTheme('system')}
            className="gap-3 cursor-pointer hover:bg-accent"
          >
            {isTimeBasedActive && theme === 'system' ? (
              <Clock className="h-4 w-4 text-purple-500" />
            ) : (
              <Laptop className="h-4 w-4 text-gray-500" />
            )}
            <div className="flex-1">
              <div className="font-medium">Ikuti Sistem</div>
              <div className="text-xs text-muted-foreground">
                {isTimeBasedActive && theme === 'system' 
                  ? 'Otomatis berdasarkan waktu Jakarta'
                  : 'Mengikuti preferensi sistem'
                }
              </div>
              {theme === 'system' && isTimeBasedActive && (
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  <div>Sekarang: {getTimeBasedInfo().timeString}</div>
                </div>
              )}
            </div>
            {theme === 'system' && <Check className="h-4 w-4 text-green-500" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Skema Warna</DropdownMenuLabel>
          
          {/* Color Scheme Selection */}
          {(['blue', 'green', 'purple', 'orange'] as const).map((scheme) => (
            <DropdownMenuItem 
              key={scheme}
              onClick={() => setColorScheme(scheme)}
              className="gap-3 cursor-pointer hover:bg-accent"
            >
              <div className={`w-4 h-4 rounded-full ${getColorSchemeIcon(scheme)}`} />
              <div className="flex-1">
                <div className="font-medium">{getColorSchemeName(scheme)}</div>
              </div>
              {colorScheme === scheme && <Check className="h-4 w-4 text-green-500" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}