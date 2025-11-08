import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';

export type SessionType = 'standard' | 'julebord';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  danger: string;
  background: string;
}

interface ThemeContextType {
  sessionType: SessionType;
  themeColors: ThemeColors;
  setSessionType: (type: SessionType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default theme colors (standard)
const STANDARD_COLORS: ThemeColors = {
  primary: '#003049',
  primaryDark: '#002333',
  secondary: '#f77f00',
  accent: '#fcbf49',
  danger: '#d62828',
  background: '#eae2b7',
};

// Christmas theme colors (julebord)
const JULEBORD_COLORS: ThemeColors = {
  primary: '#165B33',
  primaryDark: '#0f3d22',
  secondary: '#C41E3A',
  accent: '#FFD700',
  danger: '#8B0000',
  background: '#FFFFFF',
};

function getThemeColors(type: SessionType): ThemeColors {
  return type === 'julebord' ? JULEBORD_COLORS : STANDARD_COLORS;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [sessionType, setSessionTypeState] = useState<SessionType>('standard');
  const [themeColors, setThemeColors] = useState<ThemeColors>(STANDARD_COLORS);

  // Update document root data-theme attribute when session type changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', sessionType);
    setThemeColors(getThemeColors(sessionType));
  }, [sessionType]);

  const setSessionType = useCallback((type: SessionType) => {
    setSessionTypeState(type);
  }, []);

  const value: ThemeContextType = {
    sessionType,
    themeColors,
    setSessionType,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
