# Drikkescore Design System

This document outlines the design guidelines and guardrails for the Drikkescore project. All developers and designers should follow these standards to maintain consistency across the application.

---

## Table of Contents

1. [Typography](#typography)
2. [Color Palette](#color-palette)
3. [Spacing System](#spacing-system)
4. [Component Guidelines](#component-guidelines)
5. [Accessibility](#accessibility)

---

## Typography

### Primary Font Family

**Font:** [Inter](https://fonts.google.com/specimen/Inter)

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Font Weights

- **Regular:** 400 (body text, labels)
- **Medium:** 500 (emphasis, buttons)
- **Semi-Bold:** 600 (headings, titles)
- **Bold:** 700 (hero text, important headings)

### Type Scale

```css
/* Headings */
--font-size-h1: 2.5rem;      /* 40px */
--font-size-h2: 2rem;        /* 32px */
--font-size-h3: 1.75rem;     /* 28px */
--font-size-h4: 1.5rem;      /* 24px */
--font-size-h5: 1.25rem;     /* 20px */
--font-size-h6: 1rem;        /* 16px */

/* Body */
--font-size-base: 1rem;      /* 16px */
--font-size-small: 0.875rem; /* 14px */
--font-size-tiny: 0.75rem;   /* 12px */

/* Line Heights */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Usage Guidelines

- Use **Inter** for all UI elements
- Headings should use Semi-Bold (600) or Bold (700)
- Body text should use Regular (400)
- Buttons and labels should use Medium (500)
- Maintain consistent line heights for readability

---

## Color Palette

### Primary Colors

Our color scheme is inspired by warmth and energy, with a professional blue as the anchor.

```css
/* Primary Palette */
--prussian-blue: #003049;    /* Primary brand color, headers, primary buttons */
--fire-engine-red: #d62828;  /* Error states, alerts, dangerous actions */
--orange-wheel: #f77f00;     /* Accent color, highlights, CTAs */
--xanthous: #fcbf49;         /* Secondary accent, warnings, info highlights */
--vanilla: #eae2b7;          /* Backgrounds, cards, subtle elements */
```

### Color Usage Map

| Color | Hex | Usage |
|-------|-----|-------|
| **Prussian Blue** | `#003049` | Primary buttons, headers, navigation, links |
| **Fire Engine Red** | `#d62828` | Error messages, delete buttons, alerts |
| **Orange Wheel** | `#f77f00` | Call-to-action buttons, active states, highlights |
| **Xanthous** | `#fcbf49` | Warning messages, info badges, secondary CTAs |
| **Vanilla** | `#eae2b7` | Background cards, subtle sections, disabled states |

### Semantic Colors

```css
/* Semantic Color Mappings */
--color-primary: var(--prussian-blue);
--color-secondary: var(--orange-wheel);
--color-accent: var(--xanthous);
--color-danger: var(--fire-engine-red);
--color-background: var(--vanilla);

/* Neutrals (derived from palette) */
--color-text-primary: #1a1a1a;
--color-text-secondary: #4a4a4a;
--color-text-muted: #6b6b6b;
--color-border: #d4d4d4;
--color-background-light: #ffffff;
--color-background-dark: #f5f5f5;
```

### Color Variations

```css
/* Prussian Blue Variations */
--prussian-blue-light: #004d73;
--prussian-blue-dark: #002333;
--prussian-blue-bg: rgba(0, 48, 73, 0.1);

/* Fire Engine Red Variations */
--fire-engine-red-light: #e85d5d;
--fire-engine-red-dark: #a61f1f;
--fire-engine-red-bg: rgba(214, 40, 40, 0.1);

/* Orange Wheel Variations */
--orange-wheel-light: #ff9533;
--orange-wheel-dark: #c66200;
--orange-wheel-bg: rgba(247, 127, 0, 0.1);

/* Xanthous Variations */
--xanthous-light: #ffd56f;
--xanthous-dark: #d9a03a;
--xanthous-bg: rgba(252, 191, 73, 0.1);

/* Vanilla Variations */
--vanilla-light: #f5f0e0;
--vanilla-dark: #d4cba5;
```

### Accessibility Guidelines

- **Minimum contrast ratio:** 4.5:1 for normal text, 3:1 for large text
- **Prussian Blue on white:** ✅ WCAG AAA compliant
- **Fire Engine Red on white:** ✅ WCAG AA compliant
- **Orange Wheel on white:** ⚠️ Use for accents only, not body text
- **Xanthous on white:** ❌ Insufficient contrast - use darker variation or Prussian Blue text
- **Dark text on Vanilla:** ✅ WCAG AA compliant

---

## Spacing System

Use a consistent 8px base unit for all spacing.

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
--spacing-3xl: 4rem;     /* 64px */
```

### Usage

- **Component padding:** Use `--spacing-md` (16px) as default
- **Section spacing:** Use `--spacing-xl` or `--spacing-2xl`
- **Tight spacing:** Use `--spacing-sm` (8px) for compact UIs
- **Button padding:** `--spacing-sm` vertical, `--spacing-md` horizontal

---

## Component Guidelines

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--prussian-blue);
  color: white;
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 4px;
}

/* Secondary Button */
.btn-secondary {
  background: var(--orange-wheel);
  color: white;
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 4px;
}

/* Danger Button */
.btn-danger {
  background: var(--fire-engine-red);
  color: white;
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 4px;
}

/* Outline Button */
.btn-outline {
  background: transparent;
  color: var(--prussian-blue);
  border: 2px solid var(--prussian-blue);
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 4px;
}
```

### Cards

```css
.card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: var(--spacing-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-vanilla {
  background: var(--vanilla);
  border: 1px solid var(--vanilla-dark);
  border-radius: 8px;
  padding: var(--spacing-lg);
}
```

### Forms

```css
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.form-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: var(--font-size-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--prussian-blue);
  box-shadow: 0 0 0 3px var(--prussian-blue-bg);
}
```

### Error States

```css
.error-message {
  color: var(--fire-engine-red);
  background: var(--fire-engine-red-bg);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 4px;
  border-left: 4px solid var(--fire-engine-red);
  font-size: var(--font-size-small);
}

.form-input.error {
  border-color: var(--fire-engine-red);
}
```

### Success States

```css
.success-message {
  color: #047857; /* Emerald green */
  background: rgba(4, 120, 87, 0.1);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 4px;
  border-left: 4px solid #047857;
  font-size: var(--font-size-small);
}
```

### Warning States

```css
.warning-message {
  color: var(--xanthous-dark);
  background: var(--xanthous-bg);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 4px;
  border-left: 4px solid var(--xanthous);
  font-size: var(--font-size-small);
}
```

---

## Accessibility

### Contrast Requirements

- **WCAG AA:** Minimum 4.5:1 for normal text, 3:1 for large text
- **WCAG AAA:** Minimum 7:1 for normal text, 4.5:1 for large text

### Focus States

All interactive elements must have visible focus indicators:

```css
:focus {
  outline: 2px solid var(--prussian-blue);
  outline-offset: 2px;
}

/* For custom focus styles */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--prussian-blue-bg);
}
```

### Touch Targets

- Minimum touch target size: **44x44px** (WCAG AAA)
- Recommended: **48x48px**

### Screen Reader Support

- Use semantic HTML elements
- Provide `aria-label` for icon-only buttons
- Use `aria-live` regions for dynamic content
- Ensure keyboard navigation works for all interactive elements

---

## Border Radius Standards

```css
--radius-sm: 4px;    /* Buttons, inputs */
--radius-md: 8px;    /* Cards, containers */
--radius-lg: 12px;   /* Modals, larger components */
--radius-full: 9999px; /* Pills, avatars */
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

---

## Implementation Checklist

When implementing new features:

- [ ] Use Inter font family
- [ ] Use colors from the defined palette
- [ ] Follow spacing system (8px base unit)
- [ ] Ensure WCAG AA contrast compliance
- [ ] Add focus states to interactive elements
- [ ] Use semantic HTML
- [ ] Test keyboard navigation
- [ ] Verify responsive behavior
- [ ] Check dark mode compatibility (if applicable)
- [ ] Test with screen readers

---

## Resources

- **Inter Font:** https://fonts.google.com/specimen/Inter
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **CSS Variables Reference:** See `src/index.css` for implementation

---

**Last Updated:** 2025-01-25
**Version:** 1.0.0
