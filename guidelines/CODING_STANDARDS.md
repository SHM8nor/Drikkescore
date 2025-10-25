# Coding Standards & Best Practices

This document outlines the coding standards and best practices for the Drikkescore project.

---

## Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript Guidelines](#typescript-guidelines)
3. [React Best Practices](#react-best-practices)
4. [CSS & Styling](#css--styling)
5. [File Organization](#file-organization)
6. [Naming Conventions](#naming-conventions)
7. [Git Commit Guidelines](#git-commit-guidelines)
8. [Testing Standards](#testing-standards)

---

## General Principles

### Code Quality

- **Write clean, readable code** - Code is read more often than it's written
- **Keep it simple** - Avoid over-engineering solutions
- **DRY (Don't Repeat Yourself)** - Extract reusable logic into functions/components
- **Single Responsibility** - Each function/component should do one thing well
- **Consistent formatting** - Use Prettier and ESLint

### Performance

- **Optimize for user experience** - Fast load times, responsive UI
- **Lazy load when possible** - Don't load everything upfront
- **Memoize expensive calculations** - Use `useMemo` and `useCallback` appropriately
- **Minimize re-renders** - Understand React's rendering behavior

### Security

- **Never commit secrets** - Use environment variables
- **Validate user input** - Both client and server side
- **Use Row Level Security (RLS)** - Protect database access
- **Sanitize data** - Prevent XSS attacks

---

## TypeScript Guidelines

### Type Safety

```typescript
// ✅ GOOD: Explicit types for function parameters and return values
function calculateBAC(weight: number, drinks: number): number {
  return (drinks * 14) / (weight * 0.68);
}

// ❌ BAD: Implicit any types
function calculateBAC(weight, drinks) {
  return (drinks * 14) / (weight * 0.68);
}
```

### Interfaces vs Types

```typescript
// ✅ Use interfaces for object shapes (can be extended)
interface User {
  id: string;
  email: string;
  profile: Profile | null;
}

// ✅ Use types for unions, intersections, and complex types
type Status = 'pending' | 'active' | 'completed';
type UserWithProfile = User & { profile: Profile };
```

### Avoid `any`

```typescript
// ❌ BAD: Using 'any' defeats TypeScript's purpose
const data: any = fetchData();

// ✅ GOOD: Use proper types or 'unknown' if type is truly unknown
const data: User = fetchData();
// or
const data: unknown = fetchData();
if (isUser(data)) {
  // Type guard
  console.log(data.email);
}
```

### Null and Undefined

```typescript
// ✅ GOOD: Explicit null/undefined handling
interface Profile {
  name: string;
  avatar?: string; // Optional property
}

function getUserName(user: User | null): string {
  return user?.profile?.name ?? 'Anonymous';
}

// ❌ BAD: Assuming values always exist
function getUserName(user: User): string {
  return user.profile.name; // Could crash if profile is null
}
```

---

## React Best Practices

### Component Structure

```typescript
// ✅ GOOD: Clear component structure
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../types/database';

interface ProfileCardProps {
  profile: Profile;
  onEdit?: () => void;
}

export function ProfileCard({ profile, onEdit }: ProfileCardProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Event handlers
  const handleEdit = () => {
    setIsEditing(true);
    onEdit?.();
  };

  // Render
  return (
    <div className="profile-card">
      <h2>{profile.full_name}</h2>
      {user && <button onClick={handleEdit}>Edit</button>}
    </div>
  );
}
```

### Hooks Rules

```typescript
// ✅ GOOD: Hooks at the top level
function MyComponent() {
  const [count, setCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    // Side effect
  }, []);

  return <div>{count}</div>;
}

// ❌ BAD: Conditional hooks
function MyComponent() {
  if (condition) {
    const [count, setCount] = useState(0); // ❌ Never do this
  }
}
```

### State Management

```typescript
// ✅ GOOD: Minimal state, derived values
function SessionPage() {
  const [drinks, setDrinks] = useState<Drink[]>([]);

  // Derive values from state instead of storing them
  const totalAlcohol = drinks.reduce((sum, drink) => sum + drink.volume_ml, 0);
  const drinkCount = drinks.length;

  return <div>Total: {totalAlcohol}ml</div>;
}

// ❌ BAD: Redundant state
function SessionPage() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [totalAlcohol, setTotalAlcohol] = useState(0); // ❌ Derived value stored as state
  const [drinkCount, setDrinkCount] = useState(0); // ❌ Derived value stored as state
}
```

### Event Handlers

```typescript
// ✅ GOOD: Named event handlers with proper types
function LoginForm() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle login
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" onChange={handleEmailChange} />
    </form>
  );
}

// ❌ BAD: Inline arrow functions (causes re-renders)
function LoginForm() {
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <input onChange={(e) => setEmail(e.target.value)} />
    </form>
  );
}
```

### Custom Hooks

```typescript
// ✅ GOOD: Extract reusable logic into custom hooks
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

// Usage
function MyComponent() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
}
```

---

## CSS & Styling

### Use CSS Variables

```css
/* ✅ GOOD: Use design system variables */
.button {
  background: var(--prussian-blue);
  color: var(--color-white);
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-primary);
}

/* ❌ BAD: Hard-coded values */
.button {
  background: #003049;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
}
```

### BEM Naming Convention

```css
/* ✅ GOOD: BEM (Block Element Modifier) */
.card { }
.card__header { }
.card__body { }
.card--highlighted { }

/* Usage in React */
<div className="card card--highlighted">
  <div className="card__header">Title</div>
  <div className="card__body">Content</div>
</div>

/* ❌ BAD: Inconsistent naming */
.card { }
.cardHeader { }
.card-body { }
.highlightedCard { }
```

### Responsive Design

```css
/* ✅ GOOD: Mobile-first approach */
.container {
  padding: var(--spacing-md);
}

@media (min-width: 768px) {
  .container {
    padding: var(--spacing-xl);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-2xl);
  }
}
```

### Avoid Inline Styles

```typescript
// ❌ BAD: Inline styles (use sparingly)
<div style={{ color: 'red', fontSize: '16px' }}>Text</div>

// ✅ GOOD: CSS classes
<div className="error-text">Text</div>

// ✅ ACCEPTABLE: Dynamic styles when necessary
<div style={{ width: `${progress}%` }}>Progress</div>
```

---

## File Organization

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Input.tsx
├── pages/              # Page components (routes)
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── context/            # React context providers
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
│   ├── useSession.ts
│   └── useLocalStorage.ts
├── lib/                # External library configurations
│   └── supabase.ts
├── types/              # TypeScript type definitions
│   └── database.ts
├── utils/              # Utility functions
│   └── bac-calculator.ts
├── styles/             # Global styles
│   └── index.css
└── App.tsx             # Main app component
```

---

## Naming Conventions

### Files

- **React Components:** PascalCase (`UserProfile.tsx`)
- **Hooks:** camelCase with 'use' prefix (`useAuth.ts`)
- **Utilities:** camelCase (`formatDate.ts`)
- **Types:** PascalCase (`database.ts` exports `Profile`, `Session`, etc.)
- **CSS:** kebab-case (`button-styles.css`)

### Variables and Functions

```typescript
// ✅ GOOD
const userName = 'John';
const isAuthenticated = true;
const MAX_RETRIES = 3;

function calculateBAC(weight: number): number { }
function handleSubmit(event: FormEvent): void { }

// ❌ BAD
const UserName = 'John'; // Should be camelCase
const is_authenticated = true; // Should be camelCase
const maxRetries = 3; // Constants should be UPPER_SNAKE_CASE
```

### React Components

```typescript
// ✅ GOOD: PascalCase
function UserProfile() { }
export const SessionCard = () => { };

// ❌ BAD: camelCase for components
function userProfile() { }
export const sessionCard = () => { };
```

### Boolean Variables

```typescript
// ✅ GOOD: Use is/has/can prefix
const isLoading = true;
const hasProfile = false;
const canEdit = true;

// ❌ BAD: Ambiguous naming
const loading = true;
const profile = false;
const edit = true;
```

---

## Git Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature change or bug fix)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes

### Examples

```bash
# Good commit messages
feat(auth): add profile caching with sessionStorage
fix(session): prevent duplicate profile fetches on page load
docs(guidelines): add design system documentation
refactor(hooks): extract session logic into custom hook

# Bad commit messages
fixed bug
updated files
changes
WIP
```

### Commit Body (Optional)

```
feat(auth): add automatic profile recovery

- Add retryFetchProfile function to recreate missing profiles
- Use user metadata to populate profile data
- Display helpful error message with retry button
- Clear cache before retry attempt

Fixes #123
```

---

## Testing Standards

### Unit Tests

```typescript
// Example: utils/bac-calculator.test.ts
import { calculateBAC } from './bac-calculator';

describe('calculateBAC', () => {
  it('should calculate BAC correctly for male', () => {
    const result = calculateBAC({
      weight: 80,
      drinks: 2,
      gender: 'male',
      hours: 1,
    });
    expect(result).toBeCloseTo(0.04, 2);
  });

  it('should return 0 for no drinks', () => {
    const result = calculateBAC({
      weight: 80,
      drinks: 0,
      gender: 'male',
      hours: 0,
    });
    expect(result).toBe(0);
  });
});
```

### Component Tests

```typescript
// Example: components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render button text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## Code Review Checklist

Before submitting a PR:

- [ ] Code follows TypeScript best practices
- [ ] All functions have proper types
- [ ] No console.log statements (use proper logging)
- [ ] CSS uses design system variables
- [ ] Components are properly documented
- [ ] No hardcoded values (use constants or config)
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] Accessibility is considered (ARIA labels, keyboard nav)
- [ ] Code is formatted with Prettier
- [ ] ESLint shows no errors
- [ ] Tests are written (if applicable)
- [ ] Git commit messages are descriptive

---

**Last Updated:** 2025-01-25
**Version:** 1.0.0
