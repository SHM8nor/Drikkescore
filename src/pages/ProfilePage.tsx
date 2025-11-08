/**
 * ProfilePage
 *
 * View user profiles with privacy-aware information display.
 * Shows full_name only to friends and profile owner.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { PageContainer } from '../components/layout/PageContainer';
import { getUserProfileWithPrivacy, type PublicProfile, type FullProfileView } from '../api/users';
import { sendFriendRequest } from '../api/friendships';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from '../context/AuthContext';
import { BadgeSection } from '../components/profile/BadgeSection';

function isFullProfile(profile: PublicProfile | FullProfileView): profile is FullProfileView {
  return 'full_name' in profile;
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: queryKeys.users.profile(userId || ''),
    queryFn: () => getUserProfileWithPrivacy(userId!),
    enabled: Boolean(userId),
  });

  const addFriendMutation = useMutation({
    mutationFn: (friendId: string) => sendFriendRequest(friendId),
    onSuccess: () => {
      // Invalidate profile query to update friendship status
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) });
      }
      // Invalidate friends queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.friends.list(user.id) });
      }
    },
  });

  const handleAddFriend = async () => {
    if (userId) {
      try {
        await addFriendMutation.mutateAsync(userId);
      } catch (err) {
        console.error('Error adding friend:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, var(--vanilla) 0%, var(--vanilla-light) 50%, var(--xanthous-bg) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, var(--vanilla) 0%, var(--vanilla-light) 50%, var(--xanthous-bg) 100%)',
          pb: 4,
        }}
      >
        <PageContainer>
          <Box sx={{ py: { xs: 2, sm: 4 } }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{ mb: 2 }}
            >
              Tilbake
            </Button>
            <Alert severity="error">
              {error instanceof Error ? error.message : 'Kunne ikke laste profil'}
            </Alert>
          </Box>
        </PageContainer>
      </Box>
    );
  }

  const showFullName = isFullProfile(profile);
  const canAddFriend = !profile.isFriend && !profile.isOwnProfile;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, var(--vanilla) 0%, var(--vanilla-light) 50%, var(--xanthous-bg) 100%)',
        pb: 4,
      }}
    >
      <PageContainer>
        <Box sx={{ py: { xs: 2, sm: 4 } }}>
          {/* Back Button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              mb: 2,
              color: 'var(--prussian-blue)',
              '&:hover': {
                background: 'rgba(0, 48, 73, 0.05)',
              },
            }}
          >
            Tilbake
          </Button>

          {/* Profile Card */}
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: { xs: 2, sm: 3 },
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 48, 73, 0.1)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              {/* Profile Header */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={3}
                alignItems={{ xs: 'center', sm: 'flex-start' }}
                sx={{ mb: 3 }}
              >
                {/* Avatar */}
                <Avatar
                  src={profile.avatar_url || undefined}
                  alt={profile.display_name}
                  sx={{
                    width: { xs: 100, sm: 120 },
                    height: { xs: 100, sm: 120 },
                    border: '4px solid white',
                    boxShadow: '0 4px 20px rgba(0, 48, 73, 0.15)',
                  }}
                >
                  <PersonIcon sx={{ fontSize: { xs: 50, sm: 60 } }} />
                </Avatar>

                {/* Profile Info */}
                <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                  {/* Display Name */}
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      fontSize: { xs: '1.75rem', sm: '2.125rem' },
                      background: 'linear-gradient(135deg, var(--prussian-blue) 0%, var(--orange-wheel) 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {profile.display_name}
                  </Typography>

                  {/* Full Name (if friend or own profile) */}
                  {showFullName && (
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'var(--color-text-secondary)',
                        mb: 2,
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                      }}
                    >
                      {profile.full_name}
                    </Typography>
                  )}

                  {/* Badges */}
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent={{ xs: 'center', sm: 'flex-start' }}
                    sx={{ mb: 2 }}
                  >
                    {profile.isFriend && (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, var(--prussian-blue) 0%, var(--prussian-blue-light) 100%)',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        <BadgeIcon sx={{ fontSize: 16 }} />
                        Venn
                      </Box>
                    )}
                    {profile.isOwnProfile && (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, var(--orange-wheel) 0%, var(--xanthous) 100%)',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 16 }} />
                        Din profil
                      </Box>
                    )}
                  </Stack>

                  {/* Add Friend Button */}
                  {canAddFriend && (
                    <Button
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={handleAddFriend}
                      disabled={addFriendMutation.isPending}
                      sx={{
                        background: 'linear-gradient(135deg, var(--prussian-blue) 0%, var(--orange-wheel) 100%)',
                        color: 'white',
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: '0 4px 14px rgba(0, 48, 73, 0.25)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, var(--prussian-blue-light) 0%, var(--orange-wheel) 100%)',
                          boxShadow: '0 6px 20px rgba(0, 48, 73, 0.3)',
                        },
                        '&:disabled': {
                          background: 'var(--color-disabled)',
                          color: 'var(--color-text-disabled)',
                        },
                      }}
                    >
                      {addFriendMutation.isPending ? 'Sender...' : 'Legg til venn'}
                    </Button>
                  )}

                  {addFriendMutation.isSuccess && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Venneforespørsel sendt!
                    </Alert>
                  )}
                  {addFriendMutation.isError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {addFriendMutation.error instanceof Error
                        ? addFriendMutation.error.message
                        : 'Kunne ikke sende venneforespørsel'}
                    </Alert>
                  )}
                </Box>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* Badge Section */}
              {userId && <BadgeSection userId={userId} />}

              <Divider sx={{ my: 3 }} />

              {/* Profile Details */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'var(--prussian-blue)',
                    mb: 2,
                  }}
                >
                  Profilinformasjon
                </Typography>

                <Stack spacing={2}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Visningsnavn
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: 'var(--color-text-primary)' }}
                    >
                      {profile.display_name}
                    </Typography>
                  </Box>

                  {showFullName && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        Fullt navn
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: 'var(--color-text-primary)' }}
                      >
                        {profile.full_name}
                      </Typography>
                    </Box>
                  )}

                  {!showFullName && !profile.isOwnProfile && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Fullt navn er kun synlig for venner. Legg til som venn for å se mer informasjon.
                    </Alert>
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </PageContainer>
    </Box>
  );
}
