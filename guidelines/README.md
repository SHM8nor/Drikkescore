# Drikkescore Guidelines

Welcome to the Drikkescore project guidelines! This folder contains all the documentation you need to maintain consistency across the project.

---

## 📚 Documentation Overview

### [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
Complete design system documentation including:
- **Typography** - Inter font family, sizes, weights
- **Color Palette** - Official color scheme and usage guidelines
- **Spacing System** - Consistent 8px base unit spacing
- **Component Guidelines** - Buttons, cards, forms, alerts
- **Accessibility Standards** - WCAG compliance guidelines

### [CSS_VARIABLES.css](./CSS_VARIABLES.css)
All CSS custom properties (variables) for the project:
- Color tokens
- Typography tokens
- Spacing values
- Border radius
- Shadows
- Component-specific variables
- Import this file in your main CSS

### [CODING_STANDARDS.md](./CODING_STANDARDS.md)
Development best practices and standards:
- TypeScript guidelines
- React best practices
- CSS conventions (BEM naming)
- File organization
- Naming conventions
- Git commit message format
- Testing standards

---

## 🎨 Quick Reference

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Prussian Blue | `#003049` | Primary buttons, headers, links |
| Fire Engine Red | `#d62828` | Errors, alerts, delete actions |
| Orange Wheel | `#f77f00` | CTAs, highlights, active states |
| Xanthous | `#fcbf49` | Warnings, info, secondary accents |
| Vanilla | `#eae2b7` | Backgrounds, cards, subtle elements |

### Typography

**Font:** Inter (from Google Fonts)

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Weights:**
- Regular (400) - Body text
- Medium (500) - Buttons, labels
- Semi-Bold (600) - Headings
- Bold (700) - Hero text

---

## 🚀 Getting Started

### For Designers

1. Read [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
2. Use the color palette for all designs
3. Use Inter font family
4. Follow spacing system (8px base unit)
5. Ensure WCAG AA contrast compliance

### For Developers

1. Read [CODING_STANDARDS.md](./CODING_STANDARDS.md)
2. Import [CSS_VARIABLES.css](./CSS_VARIABLES.css) in your main CSS
3. Use CSS variables instead of hardcoded values
4. Follow TypeScript and React best practices
5. Write meaningful commit messages

---

## 📋 Implementation Checklist

When implementing new features:

### Design
- [ ] Use colors from the defined palette
- [ ] Use Inter font family
- [ ] Follow spacing system (multiples of 8px)
- [ ] Ensure WCAG AA contrast (4.5:1 minimum)
- [ ] Add focus states to interactive elements
- [ ] Test responsive behavior

### Development
- [ ] Use CSS variables from design system
- [ ] Proper TypeScript types (no `any`)
- [ ] Follow React hooks best practices
- [ ] Use semantic HTML
- [ ] Add proper error handling
- [ ] Handle loading states
- [ ] Test keyboard navigation
- [ ] Write descriptive commit messages

---

## 🎯 Design Principles

1. **Consistency** - Use the design system for all UI elements
2. **Accessibility** - Meet WCAG AA standards minimum
3. **Performance** - Optimize for fast load times
4. **User-Centric** - Clear, intuitive interfaces
5. **Maintainability** - Clean, documented code

---

## 🔗 External Resources

- **Inter Font:** https://fonts.google.com/specimen/Inter
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **React Best Practices:** https://react.dev/learn
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/

---

## 📝 Contributing

When adding to these guidelines:

1. Keep documentation clear and concise
2. Provide examples (good ✅ and bad ❌)
3. Update version numbers
4. Update "Last Updated" dates
5. Keep the README in sync

---

## 📞 Questions?

If you have questions about these guidelines:

1. Check the relevant documentation file first
2. Ask in the team chat/discussion
3. Propose changes via pull request
4. Update documentation as the project evolves

---

**Version:** 1.0.0
**Last Updated:** 2025-01-25
**Maintained by:** Drikkescore Development Team
