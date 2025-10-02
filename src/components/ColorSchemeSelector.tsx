import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ColorSchemeSelector() {
  const { colorScheme, setColorScheme } = useTheme();

  const colorSchemes = [
    {
      name: 'blue',
      label: 'Biru Profesional',
      description: 'Klasik dan terpercaya',
      color: 'bg-blue-500',
      preview: 'from-blue-400 to-blue-600'
    },
    {
      name: 'green',
      label: 'Hijau Natural',
      description: 'Segar dan organik',
      color: 'bg-green-500',
      preview: 'from-green-400 to-green-600'
    },
    {
      name: 'purple',
      label: 'Ungu Kreatif',
      description: 'Modern dan inovatif',
      color: 'bg-purple-500',
      preview: 'from-purple-400 to-purple-600'
    },
    {
      name: 'orange',
      label: 'Oranye Energik',
      description: 'Hangat dan dinamis',
      color: 'bg-orange-500',
      preview: 'from-orange-400 to-orange-600'
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 hover:scale-105 transition-all duration-200"
        >
          <div className={`w-4 h-4 rounded-full ${colorSchemes.find(s => s.name === colorScheme)?.color}`} />
          <Palette className="h-4 w-4" />
          <span className="hidden md:inline">Warna</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Skema Warna Dashboard
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-2 space-y-2">
          {colorSchemes.map((scheme) => (
            <DropdownMenuItem 
              key={scheme.name}
              onClick={() => setColorScheme(scheme.name as any)}
              className="cursor-pointer hover:bg-accent p-3 rounded-lg"
            >
              <div className="flex items-center gap-3 w-full">
                {/* Color Preview */}
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${scheme.preview} shadow-lg`} />
                  {colorScheme === scheme.name && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Labels */}
                <div className="flex-1">
                  <div className="font-medium">{scheme.label}</div>
                  <div className="text-xs text-muted-foreground">{scheme.description}</div>
                </div>
                
                {/* Active Badge */}
                {colorScheme === scheme.name && (
                  <Badge variant="secondary" className="text-xs">
                    Aktif
                  </Badge>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-muted-foreground text-center">
          Skema warna akan diterapkan ke seluruh dashboard
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}