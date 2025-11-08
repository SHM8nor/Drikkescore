# Theme System Usage Guide

## Overview

The Drikkescore theme system allows dynamic switching between visual themes based on session type. Currently supports:
- **Standard**: Default Drikkescore color palette
- **Julebord**: Christmas-themed colors for festive drinking sessions

## Architecture

### 1. ThemeContext (`src/context/ThemeContext.tsx`)

React Context that manages:
- Current session type (`'standard'` | `'julebord'`)
- Theme colors object with computed CSS variable values
- Function to switch themes

### 2. Theme CSS Files

- `src/styles/themes/standard.css` - Default theme
- `src/styles/themes/julebord.css` - Christmas theme

Themes override CSS variables using `[data-theme="..."]` attribute selector.

### 3. Integration

ThemeProvider wraps the entire app in `src/App.tsx`:
```tsx
<AuthProvider>
  <ThemeProvider>
    <Routes>...</Routes>
  </ThemeProvider>
</AuthProvider>
```

## How to Use

### Accessing Theme in Components

```tsx
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { sessionType, themeColors, setSessionType } = useTheme();

  return (
    <div>
      <p>Current theme: {sessionType}</p>
      <p>Primary color: {themeColors.primary}</p>

      {/* Switch to Christmas theme */}
      <button onClick={() => setSessionType('julebord')}>
        Jultemamodus
      </button>

      {/* Switch back to standard */}
      <button onClick={() => setSessionType('standard')}>
        Standard modus
      </button>
    </div>
  );
}
```

### Theme Colors Object

The `themeColors` object provides direct access to computed CSS values:

```tsx
interface ThemeColors {
  primary: string;        // Main brand color
  primaryDark: string;    // Darker variant
  secondary: string;      // Secondary accent
  accent: string;         // Highlight color
  danger: string;         // Error/warning color
  background: string;     // Background color
}
```

### CSS Variables in Styled Components

All CSS variables are automatically available in styled components:

```tsx
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

const ThemedBox = styled(Box)({
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  borderColor: 'var(--color-border)',

  '&:hover': {
    backgroundColor: 'var(--color-primary-dark)',
  },
});
```

### Using in MUI Theme

You can integrate with Material-UI's theme:

```tsx
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { useTheme } from '../context/ThemeContext';

function ThemedMuiProvider({ children }) {
  const { themeColors } = useTheme();

  const muiTheme = createTheme({
    palette: {
      primary: {
        main: themeColors.primary,
        dark: themeColors.primaryDark,
      },
      secondary: {
        main: themeColors.secondary,
      },
      error: {
        main: themeColors.danger,
      },
    },
  });

  return (
    <MuiThemeProvider theme={muiTheme}>
      {children}
    </MuiThemeProvider>
  );
}
```

## CSS Variable Mapping

### Standard Theme
| Variable | Value | Use Case |
|----------|-------|----------|
| `--prussian-blue` | `#003049` | Primary brand color |
| `--fire-engine-red` | `#d62828` | Danger/error states |
| `--orange-wheel` | `#f77f00` | Secondary accent |
| `--xanthous` | `#fcbf49` | Highlight color |
| `--vanilla` | `#eae2b7` | Background color |

### Julebord Theme
| Variable | Value | Use Case |
|----------|-------|----------|
| `--prussian-blue` | `#165B33` | Christmas green (primary) |
| `--fire-engine-red` | `#C41E3A` | Christmas red (danger) |
| `--orange-wheel` | `#FFD700` | Gold (secondary) |
| `--xanthous` | `#F0F0F0` | Silver/white gold (accent) |
| `--vanilla` | `#FFFFFF` | Snow white (background) |

### Additional Christmas Variables
| Variable | Value | Use Case |
|----------|-------|----------|
| `--christmas-green` | `#165B33` | Pine green |
| `--christmas-red` | `#C41E3A` | Holly red |
| `--christmas-gold` | `#FFD700` | Ornament gold |
| `--christmas-silver` | `#C0C0C0` | Metallic accents |
| `--christmas-snow` | `#FFFFFF` | Pure white |
| `--christmas-pine` | `#0F3D22` | Dark green |
| `--christmas-holly` | `#1E7A45` | Light green |
| `--christmas-cranberry` | `#8B0000` | Dark red |
| `--christmas-ice-blue` | `#E6F3FF` | Frost blue |

## Complete Example: Session Type Selector

```tsx
import { Box, Button, Typography } from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import type { SessionType } from '../context/ThemeContext';

function SessionTypeSelector() {
  const { sessionType, setSessionType } = useTheme();

  const handleThemeChange = (type: SessionType) => {
    setSessionType(type);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Velg temamodus
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant={sessionType === 'standard' ? 'contained' : 'outlined'}
          onClick={() => handleThemeChange('standard')}
          sx={{
            backgroundColor: sessionType === 'standard'
              ? 'var(--color-primary)'
              : 'transparent',
            color: sessionType === 'standard'
              ? 'var(--color-text-inverse)'
              : 'var(--color-primary)',
            borderColor: 'var(--color-primary)',
            '&:hover': {
              backgroundColor: 'var(--color-primary-dark)',
            },
          }}
        >
          Standard
        </Button>

        <Button
          variant={sessionType === 'julebord' ? 'contained' : 'outlined'}
          onClick={() => handleThemeChange('julebord')}
          sx={{
            backgroundColor: sessionType === 'julebord'
              ? 'var(--christmas-red)'
              : 'transparent',
            color: sessionType === 'julebord'
              ? 'var(--color-text-inverse)'
              : 'var(--christmas-red)',
            borderColor: 'var(--christmas-red)',
            '&:hover': {
              backgroundColor: 'var(--christmas-cranberry)',
            },
          }}
        >
          🎄 Julebord
        </Button>
      </Box>

      {/* Preview current theme colors */}
      <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'var(--color-primary)',
            borderRadius: 1,
          }}
        />
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'var(--color-secondary)',
            borderRadius: 1,
          }}
        />
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'var(--color-accent)',
            borderRadius: 1,
          }}
        />
        <Box
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'var(--color-danger)',
            borderRadius: 1,
          }}
        />
      </Box>
    </Box>
  );
}

export default SessionTypeSelector;
```

## Implementation Checklist

- [x] Create `ThemeContext.tsx` with context provider
- [x] Create `standard.css` theme file
- [x] Create `julebord.css` theme file
- [x] Import themes in `index.css`
- [x] Integrate ThemeProvider in `App.tsx`
- [ ] Add theme selector to session creation UI
- [ ] Store theme preference in session metadata
- [ ] Apply theme automatically when joining session
- [ ] Add theme preview in session settings

## Best Practices

1. **Always use CSS variables** - Never hardcode colors in components
2. **Test both themes** - Verify components work with all themes
3. **Maintain contrast ratios** - Ensure accessibility with all color combinations
4. **Use semantic names** - Reference `--color-primary` not `--prussian-blue` in components
5. **Avoid layout shifts** - Theme changes should only affect colors, not layout

## Future Enhancements

- Add more session types (e.g., `russefeiring`, `nyttarsaften`)
- Theme animations/transitions
- User-customizable themes
- Dark mode variants
- Theme persistence in localStorage
