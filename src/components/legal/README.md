# Legal Components

This directory contains legal and compliance components for the Drikkescore app, including disclaimer and privacy policy displays.

## Components

### 1. DisclaimerText

Reusable component that displays the app's disclaimer text in Norwegian.

**Props:**
- `variant?: 'full' | 'compact'` - Display mode (default: 'full')
  - `'full'`: Complete text with full spacing (for modals)
  - `'compact'`: Condensed version with reduced spacing (for settings pages)

**Usage:**

```tsx
import { DisclaimerText } from '@/components/legal';

// Full version in a modal
<DisclaimerText variant="full" />

// Compact version in settings
<DisclaimerText variant="compact" />
```

---

### 2. PrivacyPolicyText

Reusable component that displays the privacy policy in Norwegian.

**Props:**
- `variant?: 'full' | 'compact'` - Display mode (default: 'full')
  - `'full'`: Complete text with full spacing
  - `'compact'`: Condensed version with reduced spacing

**Features:**
- Clickable `mailto:` link for contact email
- Styled email link with hover effects
- Responsive typography

**Usage:**

```tsx
import { PrivacyPolicyText } from '@/components/legal';

// Full version
<PrivacyPolicyText variant="full" />

// Compact version
<PrivacyPolicyText variant="compact" />
```

---

### 3. DisclaimerModal

Full-screen blocking modal that users MUST accept before using the app.

**Props:**
- `open: boolean` - Controls modal visibility
- `onAccept: () => void` - Callback when user accepts terms
- `loading?: boolean` - Shows loading state during acceptance (default: false)

**Features:**
- **Cannot be dismissed** - No close button, blocks escape key and backdrop clicks
- **Scroll-to-accept** - Accept button disabled until user scrolls to bottom
- **Responsive design** - Full-screen on mobile, dialog on desktop
- **Loading state** - Shows spinner and disables button during async operations
- **Scroll detection** - Automatically enables accept button when user scrolls within 50px of bottom
- **Themed styling** - Matches app color scheme (Prussian Blue #003049, Vanilla #F2E8CF)

**Usage:**

```tsx
import { useState } from 'react';
import { DisclaimerModal } from '@/components/legal';

function App() {
  const [modalOpen, setModalOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Save acceptance to database
      await saveTermsAcceptance();
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to save terms acceptance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DisclaimerModal
        open={modalOpen}
        onAccept={handleAccept}
        loading={loading}
      />
      {/* Rest of your app */}
    </>
  );
}
```

**Integration with Authentication Flow:**

```tsx
import { useEffect, useState } from 'react';
import { DisclaimerModal } from '@/components/legal';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

function ProtectedApp() {
  const { user, profile } = useAuth();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show disclaimer if user hasn't accepted terms
    if (user && profile && !profile.has_accepted_terms) {
      setShowDisclaimer(true);
    }
  }, [user, profile]);

  const handleAcceptTerms = async () => {
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

      setShowDisclaimer(false);
    } catch (error) {
      console.error('Error accepting terms:', error);
      alert('Kunne ikke lagre aksept. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DisclaimerModal
        open={showDisclaimer}
        onAccept={handleAcceptTerms}
        loading={loading}
      />
      {/* Your app content */}
    </>
  );
}
```

**Usage in Settings Page:**

```tsx
import { Box, Paper, Typography } from '@mui/material';
import { DisclaimerText, PrivacyPolicyText } from '@/components/legal';

function SettingsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Innstillinger
      </Typography>

      {/* Other settings... */}

      <Paper sx={{ p: 3, mt: 3 }}>
        <DisclaimerText variant="compact" />
      </Paper>

      <Paper sx={{ p: 3, mt: 2 }}>
        <PrivacyPolicyText variant="compact" />
      </Paper>
    </Box>
  );
}
```

## Styling

All components use the Drikkescore color scheme:
- **Prussian Blue**: `#003049` (primary, headers, buttons)
- **Rich Black**: `#001219` (text)
- **Vanilla**: `#F2E8CF` (backgrounds, light text)
- **Sandy Brown**: `#E69F4E` (accents, links)

## Accessibility

- Proper heading hierarchy (h1, h2)
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast text for readability
- Mobile-friendly touch targets

## Norwegian Text

All text is in Norwegian as per app requirements. Emojis are included to maintain a friendly, approachable tone:
- 💧 Water emoji in disclaimer
- 🍻 Cheers emoji for agreement
- 🔒 Lock emoji for privacy
- 🍺 Beer emoji in privacy policy

## File Structure

```
src/components/legal/
├── DisclaimerText.tsx       # Disclaimer content component
├── PrivacyPolicyText.tsx    # Privacy policy content component
├── DisclaimerModal.tsx      # Full-screen modal with scroll-to-accept
├── index.ts                 # Barrel exports
└── README.md                # This documentation
```

## Database Schema Requirements

To use DisclaimerModal with persistent storage, ensure your `profiles` table has these columns:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_accepted_terms BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT;
```

## Testing

To test the DisclaimerModal:

1. **Scroll detection**: Verify accept button is disabled until scrolling to bottom
2. **Loading state**: Test with simulated async operations
3. **Cannot dismiss**: Try escape key, backdrop click - modal should remain open
4. **Responsive**: Test on mobile (full-screen) and desktop (dialog) layouts
5. **Accessibility**: Navigate with keyboard, test with screen readers

## Future Enhancements

Potential improvements:
- Version tracking for terms/privacy policy updates
- Multi-language support (English, Norwegian)
- Analytics for acceptance rates
- A/B testing different disclaimer copy
- "Print" or "Download PDF" functionality
