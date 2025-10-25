# Design System Migration Guide

This guide will help you migrate the existing application to use the new Drikkescore design system.

---

## Current State vs New Design System

### Color Scheme Changes

| Current | New Equivalent | Notes |
|---------|---------------|-------|
| `--sky-blue: #85c7de` | `--prussian-blue: #003049` | Primary color - more professional |
| `--plum: #8e518d` | `--orange-wheel: #f77f00` | Accent color - warmer, more energetic |
| `--carnation-pink: #f79ad3` | `--xanthous: #fcbf49` | Secondary accent |
| `--danger-color: #f44336` | `--fire-engine-red: #d62828` | Error/danger states |
| `--card-background: #ffffff` | `--color-background-primary: #ffffff` | Keep white |
| `--background: #faf5f8` | `--vanilla: #eae2b7` | Background color - warmer tone |

### Typography Changes

| Current | New |
|---------|-----|
| System font stack | **Inter** from Google Fonts |
| No defined type scale | Consistent type scale (h1-h6, body) |
| Inconsistent font weights | Defined weights (400, 500, 600, 700) |

---

## Step-by-Step Migration

### Step 1: Add Inter Font

**File:** `index.html`

Add this to the `<head>` section:

```html
<!-- Google Fonts - Inter -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Step 2: Update CSS Variables

**File:** `src/App.css`

Replace the current `:root` variables with:

```css
:root {
  /* Import design system variables */
  @import url('../guidelines/CSS_VARIABLES.css');

  /* Or manually add core variables: */

  /* Primary Colors */
  --prussian-blue: #003049;
  --fire-engine-red: #d62828;
  --orange-wheel: #f77f00;
  --xanthous: #fcbf49;
  --vanilla: #eae2b7;

  /* Semantic mappings */
  --color-primary: var(--prussian-blue);
  --color-secondary: var(--orange-wheel);
  --color-accent: var(--xanthous);
  --color-danger: var(--fire-engine-red);
  --color-background: var(--vanilla);

  /* Typography */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Step 3: Update Global Styles

**File:** `src/App.css`

Update the `body` styles:

```css
body {
  font-family: var(--font-family-primary);
  background: var(--vanilla);
  color: var(--color-text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Step 4: Update Button Styles

**File:** `src/App.css`

Replace button styles with:

```css
/* Primary Button */
.btn-primary {
  background: var(--prussian-blue);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family-primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--prussian-blue-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 48, 73, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Secondary Button */
.btn-secondary {
  background: var(--orange-wheel);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family-primary);
}

.btn-secondary:hover {
  background: var(--orange-wheel-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(247, 127, 0, 0.3);
}

/* Danger Button */
.btn-danger {
  background: var(--fire-engine-red);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family-primary);
}

.btn-danger:hover {
  background: var(--fire-engine-red-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(214, 40, 40, 0.3);
}
```

### Step 5: Update Form Styles

**File:** `src/App.css`

```css
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
}

.form-input,
select,
textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-primary);
  font-size: 1rem;
  background: white;
  transition: all 0.2s ease;
}

.form-input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--prussian-blue);
  box-shadow: 0 0 0 3px rgba(0, 48, 73, 0.1);
}
```

### Step 6: Update Error/Success States

**File:** `src/App.css`

```css
.error-message {
  color: var(--fire-engine-red);
  background: rgba(214, 40, 40, 0.1);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--fire-engine-red);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-md);
}

.success-message {
  color: #047857;
  background: rgba(4, 120, 87, 0.1);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  border-left: 4px solid #047857;
  font-size: 0.875rem;
  margin-bottom: var(--spacing-md);
}

.warning-message {
  color: var(--xanthous-dark);
  background: var(--xanthous-bg);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--xanthous);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-md);
}
```

### Step 7: Update Card Styles

**File:** `src/App.css`

```css
.card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-vanilla {
  background: var(--vanilla-light);
  border: 1px solid var(--vanilla-dark);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}
```

---

## Gradual Migration Strategy

You don't have to migrate everything at once. Here's a recommended approach:

### Phase 1: Foundation (High Priority)
1. ✅ Add Inter font to `index.html`
2. ✅ Update CSS variables in `:root`
3. ✅ Update `body` font-family
4. ✅ Test that the app still renders

### Phase 2: Core Components (Medium Priority)
1. Update button styles
2. Update form styles
3. Update error/success messages
4. Test all forms and buttons

### Phase 3: Page Layouts (Low Priority)
1. Update card styles
2. Update spacing between sections
3. Update headers and navigation
4. Polish and refinements

### Phase 4: Fine-tuning
1. Verify color contrast (WCAG AA)
2. Test with different content
3. Responsive design adjustments
4. Dark mode preparation (optional)

---

## Testing Checklist

After migration:

- [ ] All text uses Inter font
- [ ] Primary buttons use Prussian Blue (#003049)
- [ ] Error messages use Fire Engine Red (#d62828)
- [ ] Backgrounds use Vanilla (#eae2b7) or white
- [ ] All interactive elements have focus states
- [ ] Spacing is consistent (8px base unit)
- [ ] Border radius is consistent
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] App works on mobile devices
- [ ] No broken layouts

---

## Color Contrast Verification

Use these combinations (all WCAG AA compliant):

✅ **Safe Combinations:**
- Prussian Blue text on white background
- Fire Engine Red text on white background
- White text on Prussian Blue background
- White text on Fire Engine Red background
- White text on Orange Wheel background
- Dark text (#1a1a1a) on Vanilla background

⚠️ **Use with Caution:**
- Xanthous (#fcbf49) text on white - Use for accents only, not body text
- Orange Wheel text on white - Use for emphasis, not body text

---

## Quick Search & Replace

Use your editor's find & replace:

| Find | Replace |
|------|---------|
| `var(--sky-blue)` | `var(--prussian-blue)` |
| `var(--primary-color)` | `var(--color-primary)` |
| `var(--plum)` | `var(--orange-wheel)` |
| `var(--danger-color)` | `var(--fire-engine-red)` |
| `var(--background)` | `var(--vanilla)` |

---

## Questions?

If you encounter issues during migration:

1. Check [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for color usage
2. Verify CSS variables are properly defined
3. Test in Chrome DevTools to inspect computed styles
4. Check browser console for any errors

---

**Version:** 1.0.0
**Last Updated:** 2025-01-25
