import { Typography, Box } from '@mui/material';

interface DisclaimerTextProps {
  variant?: 'full' | 'compact';
}

/**
 * DisclaimerText Component
 *
 * Displays the app's legal disclaimer in Norwegian.
 *
 * Props:
 * - variant: 'full' (default) shows complete text with spacing
 *           'compact' shows condensed version for settings page
 */
export default function DisclaimerText({ variant = 'full' }: DisclaimerTextProps) {
  const isCompact = variant === 'compact';

  return (
    <Box>
      <Typography
        variant={isCompact ? 'h6' : 'h5'}
        component="h2"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: 'var(--prussian-blue)',
          mb: isCompact ? 1 : 2,
        }}
      >
        Ansvarsfraskrivelse (den ærlige versjonen)
      </Typography>

      <Typography
        variant="body1"
        paragraph
        sx={{ mb: isCompact ? 1 : 2 }}
      >
        Hei, ansvarlig festløve!
        <br />
        Denne appen er laget for moro, nysgjerrighet og litt nerdeaktig selvinnsikt — ikke som en unnskyldning for å ta "én til".
      </Typography>

      <Typography
        variant="body1"
        paragraph
        sx={{ mb: isCompact ? 1 : 2 }}
      >
        Promillen du ser her er et estimat, ikke et orakel. Den kan ta feil (spesielt hvis du har glemt hvor mye du egentlig drakk).
      </Typography>

      <Typography
        variant="body1"
        paragraph
        sx={{ mb: isCompact ? 1 : 2 }}
      >
        Ikke bruk appen til å avgjøre om du kan kjøre, operere tungt maskineri eller sende meldinger du angrer på i morgen.
      </Typography>

      <Typography
        variant="body1"
        paragraph
        sx={{ mb: isCompact ? 1 : 2 }}
      >
        Utvikleren tar null ansvar for beslutninger tatt i promilletåke, men applauderer god dømmekraft og vann mellom hver enhet 💧
      </Typography>

      <Typography
        variant="body1"
        paragraph
        sx={{
          mb: isCompact ? 0.5 : 1,
          fontWeight: 500,
        }}
      >
        Ved å bruke appen sier du egentlig:
      </Typography>

      <Typography
        variant="body1"
        sx={{
          fontStyle: 'italic',
          color: '#003049',
        }}
      >
        "Jeg er over 18, og jeg lover å være et voksent menneske." 🍻
      </Typography>
    </Box>
  );
}
