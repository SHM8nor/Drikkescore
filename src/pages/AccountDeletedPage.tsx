import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import WavingHandIcon from '@mui/icons-material/WavingHand';

/**
 * AccountDeletedPage
 *
 * Public page shown after successful account deletion.
 * Provides confirmation message and navigation options to either
 * create a new account or return to the homepage.
 */
export default function AccountDeletedPage() {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate('/register');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eae2b7',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            padding: { xs: 3, sm: 4, md: 5 },
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 2,
          }}
        >
          {/* Waving hand icon */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 3,
            }}
          >
            <WavingHandIcon
              sx={{
                fontSize: { xs: 64, sm: 80 },
                color: '#003049',
              }}
            />
          </Box>

          {/* Heading */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: '#003049',
              marginBottom: 2,
            }}
          >
            Farvel!
          </Typography>

          {/* Main message */}
          <Typography
            variant="body1"
            paragraph
            sx={{
              color: '#001219',
              marginBottom: 2,
              fontSize: { xs: '1rem', sm: '1.1rem' },
            }}
          >
            Din konto er nå permanent slettet.
          </Typography>

          <Typography
            variant="body1"
            paragraph
            sx={{
              color: '#001219',
              marginBottom: 2,
              fontSize: { xs: '1rem', sm: '1.1rem' },
            }}
          >
            All data knyttet til kontoen din er fjernet fra våre systemer.
          </Typography>

          <Typography
            variant="body1"
            paragraph
            sx={{
              color: '#001219',
              marginBottom: 3,
              fontSize: { xs: '1rem', sm: '1.1rem' },
            }}
          >
            Vi håper du har hatt en god opplevelse med Drikkescore.
            Hvis du angrer, kan du alltid opprette en ny konto.
          </Typography>

          {/* Action buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              marginTop: 4,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleCreateAccount}
              sx={{
                backgroundColor: '#003049',
                color: '#eae2b7',
                fontWeight: 600,
                paddingX: 3,
                paddingY: 1.5,
                flex: { xs: 1, sm: 'initial' },
                '&:hover': {
                  backgroundColor: '#002033',
                },
              }}
            >
              Opprett ny konto
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={handleGoHome}
              sx={{
                borderColor: '#003049',
                color: '#003049',
                fontWeight: 600,
                paddingX: 3,
                paddingY: 1.5,
                flex: { xs: 1, sm: 'initial' },
                '&:hover': {
                  borderColor: '#002033',
                  backgroundColor: 'rgba(0, 48, 73, 0.04)',
                },
              }}
            >
              Gå til forsiden
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
