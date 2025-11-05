# Quick Start Guide - Legal Components

## Installation

The components are already installed in your project at:
```
C:\Users\Felles\Documents\Projects\Drikkescore\src\components\legal\
```

## Quick Integration

### Step 1: Import the DisclaimerModal

```tsx
import { DisclaimerModal } from '@/components/legal';
```

### Step 2: Add State Management

```tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

function App() {
  const { user, profile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show modal for users who haven't accepted
    if (profile && !profile.has_accepted_terms) {
      setShowModal(true);
    }
  }, [profile]);

  // ... rest of component
}
```

### Step 3: Implement Accept Handler

```tsx
const handleAccept = async () => {
  if (!user) return;

  setLoading(true);
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        has_accepted_terms: true,
        terms_accepted_at: new Date().toISOString(),
        privacy_policy_version: '1.0',
      })
      .eq('id', user.id);

    if (error) throw error;
    setShowModal(false);
  } catch (err) {
    console.error('Error:', err);
    alert('Kunne ikke lagre aksept. Prøv igjen.');
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Add the Modal to Your JSX

```tsx
return (
  <>
    <DisclaimerModal
      open={showModal}
      onAccept={handleAccept}
      loading={loading}
    />
    {/* Your app content */}
  </>
);
```

## Complete Example

```tsx
import { useState, useEffect } from 'react';
import { DisclaimerModal } from '@/components/legal';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function App() {
  const { user, profile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user needs to accept terms
  useEffect(() => {
    if (profile && !profile.has_accepted_terms) {
      setShowModal(true);
    }
  }, [profile]);

  const handleAccept = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          has_accepted_terms: true,
          terms_accepted_at: new Date().toISOString(),
          privacy_policy_version: '1.0',
        })
        .eq('id', user.id);

      if (error) throw error;
      setShowModal(false);
    } catch (err) {
      console.error('Error saving terms acceptance:', err);
      alert('Kunne ikke lagre aksept. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DisclaimerModal
        open={showModal}
        onAccept={handleAccept}
        loading={loading}
      />

      {/* Your main app content */}
      <YourMainContent />
    </>
  );
}
```

## Individual Components

### DisclaimerText (Standalone)

```tsx
import { DisclaimerText } from '@/components/legal';

// In your settings page
<Paper sx={{ p: 3 }}>
  <DisclaimerText variant="compact" />
</Paper>
```

### PrivacyPolicyText (Standalone)

```tsx
import { PrivacyPolicyText } from '@/components/legal';

// In your settings page
<Paper sx={{ p: 3, mt: 2 }}>
  <PrivacyPolicyText variant="compact" />
</Paper>
```

## Database Setup

Ensure your `profiles` table has these columns:

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_accepted_terms BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT;
```

## TypeScript Types

Update your `Profile` type in `src/types/database.ts`:

```typescript
export interface Profile {
  id: string;
  full_name: string;
  weight_kg: number;
  height_cm: number;
  gender: 'male' | 'female';
  age: number;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;

  // Add these fields
  has_accepted_terms: boolean;
  terms_accepted_at: string | null;
  privacy_policy_version: string | null;
}
```

## Testing Checklist

- [ ] Modal appears for users who haven't accepted terms
- [ ] Accept button is disabled until scrolling to bottom
- [ ] Loading state shows during acceptance
- [ ] Modal cannot be dismissed without accepting
- [ ] Modal is responsive (full-screen on mobile)
- [ ] Database is updated when user accepts
- [ ] Modal closes after successful acceptance
- [ ] Error handling works if database update fails

## Troubleshooting

**Modal doesn't close after accepting:**
- Check that `has_accepted_terms` is being updated in the database
- Verify your `profile` state is refreshing after the update

**Accept button stays disabled:**
- Ensure content is scrollable (try on a smaller screen)
- Check browser console for scroll event errors

**Styling looks wrong:**
- Verify MUI theme is properly configured
- Check that Emotion is installed (`@emotion/react`, `@emotion/styled`)

## Support

For questions or issues, contact: jakobhofstad@gmail.com
