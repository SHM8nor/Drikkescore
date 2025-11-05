/**
 * Example usage of DisclaimerModal component
 *
 * This file demonstrates how to integrate the DisclaimerModal
 * into your app's authentication flow.
 *
 * DO NOT import this file in production code.
 */

import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import DisclaimerModal from './DisclaimerModal';

/**
 * Example 1: Basic Usage
 * Shows the modal and handles acceptance
 */
export function BasicExample() {
  const [open, setOpen] = useState(true);

  const handleAccept = () => {
    console.log('User accepted terms');
    setOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => setOpen(true)} variant="contained">
        Vis ansvarsfraskrivelse
      </Button>

      <DisclaimerModal
        open={open}
        onAccept={handleAccept}
      />
    </Box>
  );
}

/**
 * Example 2: With Loading State
 * Simulates async operation (e.g., saving to database)
 */
export function LoadingExample() {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Terms saved to database');
    setLoading(false);
    setOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => setOpen(true)} variant="contained">
        Vis ansvarsfraskrivelse med lasting
      </Button>

      <DisclaimerModal
        open={open}
        onAccept={handleAccept}
        loading={loading}
      />
    </Box>
  );
}

/**
 * Example 3: With Supabase Integration
 * Real-world example with database persistence
 */
export function SupabaseExample() {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      // Example Supabase call (uncomment when using)
      /*
      const { error: supabaseError } = await supabase
        .from('profiles')
        .update({
          has_accepted_terms: true,
          terms_accepted_at: new Date().toISOString(),
          privacy_policy_version: '1.0',
        })
        .eq('id', userId);

      if (supabaseError) throw supabaseError;
      */

      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Terms acceptance saved to Supabase');
      setOpen(false);
    } catch (err) {
      console.error('Failed to save terms acceptance:', err);
      setError(err instanceof Error ? err.message : 'Ukjent feil oppstod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => setOpen(true)} variant="contained">
        Vis ansvarsfraskrivelse med Supabase
      </Button>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Feil: {error}
        </Typography>
      )}

      <DisclaimerModal
        open={open}
        onAccept={handleAccept}
        loading={loading}
      />
    </Box>
  );
}

/**
 * Example 4: First-Time User Flow
 * Checks if user has accepted terms and shows modal if needed
 */
export function FirstTimeUserExample() {
  // In real implementation, get this from your auth context or Supabase
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);

    // Simulate saving to database
    await new Promise(resolve => setTimeout(resolve, 1500));

    setHasAcceptedTerms(true);
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {hasAcceptedTerms ? (
        <Box>
          <Typography variant="h4" gutterBottom>
            Velkommen til Drikkescore!
          </Typography>
          <Typography>
            Du har akseptert vilkårene og kan nå bruke appen.
          </Typography>
          <Button
            onClick={() => setHasAcceptedTerms(false)}
            sx={{ mt: 2 }}
          >
            Tilbakestill (for testing)
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="h4" gutterBottom>
            Vennligst aksepter vilkårene
          </Typography>
          <Typography>
            Appen er blokkert til du har akseptert ansvarsfraskrivelsen.
          </Typography>
        </Box>
      )}

      <DisclaimerModal
        open={!hasAcceptedTerms}
        onAccept={handleAccept}
        loading={loading}
      />
    </Box>
  );
}

/**
 * Example 5: All Examples Combined
 * Showcase component for testing different scenarios
 */
export default function DisclaimerModalExamples() {
  const [activeExample, setActiveExample] = useState<number | null>(null);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h3" gutterBottom>
        DisclaimerModal Eksempler
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => setActiveExample(1)}
          fullWidth
        >
          1. Grunnleggende eksempel
        </Button>

        <Button
          variant="outlined"
          onClick={() => setActiveExample(2)}
          fullWidth
        >
          2. Med lastetilstand
        </Button>

        <Button
          variant="outlined"
          onClick={() => setActiveExample(3)}
          fullWidth
        >
          3. Med Supabase-integrasjon
        </Button>

        <Button
          variant="outlined"
          onClick={() => setActiveExample(4)}
          fullWidth
        >
          4. Førstegangsbruker-flyt
        </Button>
      </Box>

      <Box sx={{ mt: 4 }}>
        {activeExample === 1 && <BasicExample />}
        {activeExample === 2 && <LoadingExample />}
        {activeExample === 3 && <SupabaseExample />}
        {activeExample === 4 && <FirstTimeUserExample />}
      </Box>
    </Box>
  );
}
