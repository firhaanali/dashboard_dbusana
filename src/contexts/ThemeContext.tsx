import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'blue' | 'green' | 'purple' | 'orange';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark'; // The actual applied theme (resolves 'system')
  colorScheme: ColorScheme;
  setColorScheme: (colorScheme: ColorScheme) => void;
  lastAutoChange: Date | null; // When auto theme last changed
  isTimeBasedActive: boolean; // Whether time-based logic is currently active
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('blue');
  const [lastAutoChange, setLastAutoChange] = useState<Date | null>(null);
  const [isTimeBasedActive, setIsTimeBasedActive] = useState<boolean>(false);

  // Function to get theme based on Jakarta time (WIB)
  const getTimeBasedTheme = (): 'light' | 'dark' => {
    try {
      // Get current time in Jakarta timezone (WIB/UTC+7)
      const now = new Date();
      const jakartaTime = new Date(now.toLocaleString("en-US", {
        timeZone: "Asia/Jakarta"
      }));
      const hour = jakartaTime.getHours();
      const minute = jakartaTime.getMinutes();
      
      // Light mode: 6:00 AM - 6:00 PM (06:00 - 18:00) WIB
      // Dark mode: 6:00 PM - 6:00 AM (18:00 - 06:00) WIB
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      if (hour >= 6 && hour < 18) {
        console.log(`🌅 Jakarta time ${timeString} WIB -> Light mode (06:00-18:00)`);
        return 'light';
      } else {
        console.log(`🌙 Jakarta time ${timeString} WIB -> Dark mode (18:00-06:00)`);
        return 'dark';
      }
    } catch (error) {
      console.warn('Error getting Jakarta time, fallback to light mode:', error);
      return 'light';
    }
  };

  // Function to check if system preference is explicitly set
  const hasExplicitSystemPreference = (): boolean => {
    try {
      // Check if browser supports media queries
      if (typeof window !== 'undefined' && window.matchMedia) {
        const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
        
        // For better Jakarta timezone support, prioritize time-based logic
        // This ensures consistent behavior across different OS configurations
        return false; // Always use time-based logic for "ikuti sistem"
      }
      return false;
    } catch (error) {
      console.warn('Error checking system preference, falling back to time-based:', error);
      return false;
    }
  };

  // Load theme and color scheme from localStorage on initialization
  useEffect(() => {
    const loadSettings = () => {
      let loadedTheme: Theme = 'system';
      let loadedColorScheme: ColorScheme = 'blue';
      
      // Try to load from user settings first
      const savedSettings = localStorage.getItem('dbusana_user_settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          if (parsedSettings.theme) {
            // Migration: convert old 'auto' to 'system'
            if (parsedSettings.theme === 'auto') {
              loadedTheme = 'system';
              parsedSettings.theme = 'system';
              localStorage.setItem('dbusana_user_settings', JSON.stringify(parsedSettings));
              console.log('🔄 Migrated old "auto" theme in user settings to "system"');
            } else if (['light', 'dark', 'system'].includes(parsedSettings.theme)) {
              loadedTheme = parsedSettings.theme;
            }
          }
          if (parsedSettings.color_scheme && ['blue', 'green', 'purple', 'orange'].includes(parsedSettings.color_scheme)) {
            loadedColorScheme = parsedSettings.color_scheme;
          }
        } catch (error) {
          console.warn('Failed to parse user settings for theme');
        }
      } else {
        // Fallback to legacy theme storage
        const savedTheme = localStorage.getItem('dbusana_theme') as Theme;
        const savedColorScheme = localStorage.getItem('dbusana_color_scheme') as ColorScheme;
        
        if (savedTheme) {
          // Migration: convert old 'auto' to 'system'
          if (savedTheme === 'auto') {
            loadedTheme = 'system';
            localStorage.setItem('dbusana_theme', 'system');
            console.log('🔄 Migrated old "auto" theme to "system" with time-based logic');
          } else if (['light', 'dark', 'system'].includes(savedTheme)) {
            loadedTheme = savedTheme;
          }
        }
        if (savedColorScheme && ['blue', 'green', 'purple', 'orange'].includes(savedColorScheme)) {
          loadedColorScheme = savedColorScheme;
        }
      }
      
      // Set states immediately to prevent race conditions
      setThemeState(loadedTheme);
      setColorSchemeState(loadedColorScheme);
      
      console.log(`💾 Settings loaded: theme=${loadedTheme}, colorScheme=${loadedColorScheme}`);
      
      return {
        theme: loadedTheme,
        colorScheme: loadedColorScheme
      };
    };

    const initialSettings = loadSettings();
    
    // Apply settings after state is set
    setTimeout(() => {
      applyTheme(initialSettings.theme);
      applyColorScheme(initialSettings.colorScheme);
    }, 0);
  }, []);

  // Listen for system theme changes and time changes
  useEffect(() => {
    // Skip if theme is not loaded yet or is manual selection
    if (!theme || theme === 'light' || theme === 'dark') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Only respond to system changes if we're in system mode
      if (theme === 'system') {
        console.log('🖥️ System theme preference changed, updating...');
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    // Set up interval for time-based theme when system mode is active
    let timeInterval: NodeJS.Timeout | null = null;
    
    if (theme === 'system') {
      // Apply system theme immediately
      applyTheme('system');
      
      // Check every minute if we need to update the theme (for time-based logic)
      timeInterval = setInterval(() => {
        // Double check we're still in system mode to prevent interference
        if (theme === 'system' && isTimeBasedActive) {
          const currentEffective = getTimeBasedTheme();
          if (currentEffective !== actualTheme) {
            console.log(`⏰ Time-based theme change: ${actualTheme} → ${currentEffective}`);
            setLastAutoChange(new Date());
            applyTheme('system');
          }
        }
      }, 60000); // Check every minute
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      if (timeInterval) {
        clearInterval(timeInterval);
      }
    };
  }, [theme, isTimeBasedActive, actualTheme]);

  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    let effectiveTheme: 'light' | 'dark';
    let usingTimeBased = false;
    
    if (newTheme === 'system') {
      // Check if system has explicit preference
      if (hasExplicitSystemPreference()) {
        // Use system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        effectiveTheme = systemTheme;
        usingTimeBased = false;
      } else {
        // Fallback to time-based logic
        effectiveTheme = getTimeBasedTheme();
        usingTimeBased = true;
      }
    } else {
      // Manual selection - use theme as is
      effectiveTheme = newTheme;
      usingTimeBased = false;
    }
    
    // Update time-based active state
    setIsTimeBasedActive(usingTimeBased);
    
    // Apply theme class
    root.classList.add(effectiveTheme);
    
    // Add special class for time-based theme to enable smoother transitions
    if (usingTimeBased) {
      document.body.classList.add('auto-theme-transition');
      document.body.classList.remove('theme-transition');
    } else {
      document.body.classList.add('theme-transition');
      document.body.classList.remove('auto-theme-transition');
    }
    
    setActualTheme(effectiveTheme);
    
    // Update localStorage - only update if it's a new theme selection, not internal updates
    if (newTheme !== theme) {
      localStorage.setItem('dbusana_theme', newTheme);
    }
    
    // Get Jakarta time for logging
    const jakartaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta"
    });
    const currentTime = new Date(jakartaTime).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: "Asia/Jakarta"
    });
    
    if (usingTimeBased) {
      const hour = new Date(jakartaTime).getHours();
      const nextChange = hour >= 6 && hour < 18 ? '18:00 (mode gelap)' : '06:00 (mode terang)';
      console.log(`🕐 Ikuti Sistem (Jakarta): ${effectiveTheme} mode aktif (${currentTime} WIB)`);
      console.log(`⏰ Jadwal otomatis: Terang 06:00-18:00, Gelap 18:00-06:00 - Berikutnya: ${nextChange}`);
    } else if (newTheme === 'system') {
      console.log(`🖥️ System theme: ${effectiveTheme} mode (${currentTime} WIB) - Following OS preference`);
    } else {
      console.log(`🎨 Manual theme: ${newTheme} mode selected (${currentTime} WIB)`);
    }
  };

  const applyColorScheme = (newColorScheme: ColorScheme) => {
    const root = window.document.documentElement;
    
    // Apply color scheme attribute
    root.setAttribute('data-color-scheme', newColorScheme);
    
    // Update localStorage
    localStorage.setItem('dbusana_color_scheme', newColorScheme);
    
    console.log(`🎨 Color scheme applied: ${newColorScheme}`);
  };

  const setTheme = (newTheme: Theme) => {
    console.log(`🎯 Theme selection: ${theme} → ${newTheme}`);
    
    // Update state first
    setThemeState(newTheme);
    
    // Apply theme with new selection
    applyTheme(newTheme);
    
    // Update localStorage immediately
    localStorage.setItem('dbusana_theme', newTheme);
    
    // Also update user settings if they exist
    const savedSettings = localStorage.getItem('dbusana_user_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        parsedSettings.theme = newTheme;
        localStorage.setItem('dbusana_user_settings', JSON.stringify(parsedSettings));
        console.log(`💾 Theme updated in user settings: ${newTheme}`);
      } catch (error) {
        console.warn('Failed to update theme in user settings');
        // Fallback: ensure theme is at least saved in basic localStorage
        localStorage.setItem('dbusana_theme', newTheme);
      }
    } else {
      // Create user settings entry if it doesn't exist
      const newSettings = {
        theme: newTheme,
        color_scheme: colorScheme
      };
      localStorage.setItem('dbusana_user_settings', JSON.stringify(newSettings));
      console.log(`💾 Created user settings with theme: ${newTheme}`);
    }
    
    // Clear any auto-change timestamp if manual selection is made
    if (newTheme !== 'system') {
      setLastAutoChange(null);
      setIsTimeBasedActive(false);
      console.log(`🎯 Manual theme selected, disabled auto theme logic`);
    }
  };

  const setColorScheme = (newColorScheme: ColorScheme) => {
    setColorSchemeState(newColorScheme);
    applyColorScheme(newColorScheme);
    
    // Also update user settings if they exist
    const savedSettings = localStorage.getItem('dbusana_user_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        parsedSettings.color_scheme = newColorScheme;
        localStorage.setItem('dbusana_user_settings', JSON.stringify(parsedSettings));
        console.log(`💾 Color scheme updated in user settings: ${newColorScheme}`);
      } catch (error) {
        console.warn('Failed to update color scheme in user settings');
      }
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    actualTheme,
    colorScheme,
    setColorScheme,
    lastAutoChange,
    isTimeBasedActive,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}