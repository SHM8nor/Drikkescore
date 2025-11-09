import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import type { Session, Profile, DrinkEntry } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { formatBAC, getBACDescription } from '../utils/bacCalculator';
import { calculateTotalAlcoholGrams, convertGramsToBeers } from '../utils/chartHelpers';
import { calculateBAC } from '../utils/bacCalculator';
import BACLineChart from './charts/BACLineChart';
import AlcoholConsumptionChart from './charts/AlcoholConsumptionChart';
import DrinkingTimelineChart from './charts/DrinkingTimelineChart';

interface ReadOnlySessionViewProps {
  session: Session;
  participants: Profile[];
  drinks: DrinkEntry[];
}

export function ReadOnlySessionView({ session, participants, drinks }: ReadOnlySessionViewProps) {
  const { user } = useAuth();
  const theme = useTheme();

  const leaderboard = useMemo(() => {
    if (participants.length === 0) return [];

    const endTime = new Date(session.end_time);
    const leaderboardData = participants.map((participant) => {
      const userDrinks = drinks.filter((d) => d.user_id === participant.id);
      const bac = calculateBAC(userDrinks, participant, endTime);

      return {
        user_id: participant.id,
        display_name: participant.display_name,
        bac,
        rank: 0,
      };
    });

    leaderboardData.sort((a, b) => b.bac - a.bac);
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboardData;
  }, [participants, drinks, session.end_time]);

  const userStats = useMemo(() => {
    if (!user) return { bac: 0, beerUnits: 0, rank: 0 };

    const userDrinks = drinks.filter((d) => d.user_id === user.id);
    const profile = participants.find((p) => p.id === user.id);

    if (!profile) return { bac: 0, beerUnits: 0, rank: 0 };

    const bac = calculateBAC(userDrinks, profile, new Date(session.end_time));
    const totalGrams = calculateTotalAlcoholGrams(userDrinks);
    const beerUnits = convertGramsToBeers(totalGrams);
    const rank = leaderboard.find((e) => e.user_id === user.id)?.rank || 0;

    return { bac, beerUnits, rank };
  }, [drinks, participants, user, session.end_time, leaderboard]);

  return (
    <Stack spacing={3}>
      {/* Session Info Card */}
      <Card
        sx={{
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <CardContent
          sx={{
            padding: theme.spacing(3),
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: theme.spacing(3),
              color: 'var(--prussian-blue)',
              fontWeight: theme.typography.fontWeightBold,
            }}
          >
            {session.session_name || 'Økt'}
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                sx={{
                  color: 'var(--prussian-blue)',
                  minWidth: '90px',
                  fontWeight: theme.typography.fontWeightBold,
                }}
              >
                Kode:
              </Typography>
              <Chip
                label={session.session_code}
                sx={{
                  color: 'var(--prussian-blue)',
                  bgcolor: 'var(--vanilla)',
                  fontWeight: theme.typography.fontWeightMedium,
                }}
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                sx={{
                  color: 'var(--prussian-blue)',
                  minWidth: '90px',
                  fontWeight: theme.typography.fontWeightBold,
                }}
              >
                Startet:
              </Typography>
              <Typography sx={{ color: 'var(--prussian-blue)' }}>
                {new Date(session.start_time).toLocaleString('no-NO', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                sx={{
                  color: 'var(--prussian-blue)',
                  minWidth: '90px',
                  fontWeight: theme.typography.fontWeightBold,
                }}
              >
                Avsluttet:
              </Typography>
              <Typography sx={{ color: 'var(--prussian-blue)' }}>
                {new Date(session.end_time).toLocaleString('no-NO', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* User Stats Card */}
      {user && participants.find((p) => p.id === user.id) && (
        <Card
          sx={{
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CardContent
            sx={{
              padding: theme.spacing(3),
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: theme.spacing(3),
                color: 'var(--prussian-blue)',
                fontWeight: theme.typography.fontWeightBold,
              }}
            >
              Dine resultater
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: theme.spacing(3),
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing(1),
                  padding: theme.spacing(2),
                  bgcolor: 'var(--vanilla)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `var(--border-width-thick) solid var(--orange-wheel)`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--prussian-blue)',
                    opacity: 0.8,
                  }}
                >
                  Sluttresultat
                </Typography>
                <Typography
                  sx={{
                    fontSize: 'var(--font-size-display)',
                    fontWeight: theme.typography.fontWeightBold,
                    color: 'var(--prussian-blue)',
                  }}
                >
                  {formatBAC(userStats.bac)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--prussian-blue)',
                  }}
                >
                  {getBACDescription(userStats.bac)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing(1),
                  padding: theme.spacing(2),
                  bgcolor: 'var(--vanilla)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `var(--border-width-thick) solid var(--orange-wheel)`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--prussian-blue)',
                    opacity: 0.8,
                  }}
                >
                  Enheter konsumert
                </Typography>
                <Typography
                  sx={{
                    fontSize: 'var(--font-size-display)',
                    fontWeight: theme.typography.fontWeightBold,
                    color: 'var(--prussian-blue)',
                  }}
                >
                  {userStats.beerUnits.toFixed(1)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing(1),
                  padding: theme.spacing(2),
                  bgcolor: 'var(--vanilla)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `var(--border-width-thick) solid var(--orange-wheel)`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--prussian-blue)',
                    opacity: 0.8,
                  }}
                >
                  Plassering
                </Typography>
                <Typography
                  sx={{
                    fontSize: 'var(--font-size-display)',
                    fontWeight: theme.typography.fontWeightBold,
                    color: 'var(--prussian-blue)',
                  }}
                >
                  #{userStats.rank}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* BAC Timeline Chart */}
      {participants.length > 0 && drinks.length > 0 && (
        <Card
          sx={{
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CardContent
            sx={{
              padding: theme.spacing(3),
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: theme.spacing(2),
                color: 'var(--prussian-blue)',
                fontWeight: theme.typography.fontWeightBold,
              }}
            >
              Promilleutvikling
            </Typography>
            <BACLineChart
              participants={participants}
              drinks={drinks}
              sessionStartTime={new Date(session.start_time)}
              sessionEndTime={new Date(session.end_time)}
              currentUserId={user?.id || participants[0]?.id || ''}
              view="all"
            />
          </CardContent>
        </Card>
      )}

      {/* Alcohol Consumption Chart */}
      {participants.length > 0 && drinks.length > 0 && (
        <Card
          sx={{
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CardContent
            sx={{
              padding: theme.spacing(3),
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: theme.spacing(2),
                color: 'var(--prussian-blue)',
                fontWeight: theme.typography.fontWeightBold,
              }}
            >
              Alkoholkonsum per deltaker
            </Typography>
            <AlcoholConsumptionChart
              participants={participants}
              drinks={drinks}
              view="per-participant"
              unit="beers"
              currentUserId={user?.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Drinking Timeline Chart */}
      {participants.length > 0 && drinks.length > 0 && (
        <Card
          sx={{
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CardContent
            sx={{
              padding: theme.spacing(3),
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: theme.spacing(2),
                color: 'var(--prussian-blue)',
                fontWeight: theme.typography.fontWeightBold,
              }}
            >
              Drikketidslinje
            </Typography>
            <DrinkingTimelineChart
              drinks={drinks}
              participants={participants}
              sessionStartTime={new Date(session.start_time)}
              sessionEndTime={new Date(session.end_time)}
            />
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Card */}
      <Card
        sx={{
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <CardContent
          sx={{
            padding: theme.spacing(3),
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: theme.spacing(3),
              color: 'var(--prussian-blue)',
              fontWeight: theme.typography.fontWeightBold,
            }}
          >
            Sluttresultat
          </Typography>
          {leaderboard.length > 0 && (
            <Box
              sx={{
                background: 'var(--gradient-secondary)',
                padding: theme.spacing(2),
                borderRadius: 'var(--radius-md)',
                mb: theme.spacing(3),
                textAlign: 'center',
                fontWeight: theme.typography.fontWeightBold,
                color: 'var(--prussian-blue)',
                fontSize: 'var(--font-size-subheading)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {leaderboard[0]?.display_name} vant med {formatBAC(leaderboard[0]?.bac)}!
            </Box>
          )}
          {leaderboard.length === 0 ? (
            <Typography
              sx={{
                textAlign: 'center',
                color: 'var(--prussian-blue)',
                opacity: 0.6,
              }}
            >
              Ingen deltakere
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {leaderboard.map((entry, index) => (
                <Box
                  key={entry.user_id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: theme.spacing(2),
                    bgcolor: index === 0 ? 'var(--xanthous)' : 'var(--vanilla)',
                    borderRadius: 'var(--radius-md)',
                    gap: theme.spacing(2),
                    transition: 'var(--transition-base)',
                    border: index === 0 ? `var(--border-width-base) solid var(--orange-wheel)` : 'none',
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: theme.typography.fontWeightBold,
                      color: 'var(--prussian-blue)',
                      minWidth: '40px',
                      fontSize: 'var(--font-size-subheading)',
                    }}
                  >
                    #{entry.rank}
                  </Typography>
                  <Typography
                    sx={{
                      flex: 1,
                      color: 'var(--prussian-blue)',
                      fontWeight:
                        index === 0
                          ? theme.typography.fontWeightBold
                          : theme.typography.fontWeightRegular,
                      fontSize: index === 0 ? 'var(--font-size-subheading)' : 'var(--font-size-base)',
                    }}
                  >
                    {entry.display_name}
                  </Typography>
                  <Chip
                    label={formatBAC(entry.bac)}
                    sx={{
                      fontWeight: theme.typography.fontWeightBold,
                      color: 'var(--prussian-blue)',
                      bgcolor: index === 0 ? 'var(--orange-wheel)' : 'var(--xanthous)',
                    }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Participants Card */}
      <Card
        sx={{
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <CardContent
          sx={{
            padding: theme.spacing(3),
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: theme.spacing(3),
              color: 'var(--prussian-blue)',
              fontWeight: theme.typography.fontWeightBold,
            }}
          >
            Deltakere ({participants.length})
          </Typography>
          <Stack spacing={1.5}>
            {participants.map((participant) => {
              const drinkCount = drinks.filter((d) => d.user_id === participant.id).length;
              return (
                <Box
                  key={participant.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: theme.spacing(2),
                    bgcolor: 'var(--vanilla)',
                    borderRadius: 'var(--radius-md)',
                    gap: theme.spacing(2),
                  }}
                >
                  <Typography
                    sx={{
                      color: 'var(--prussian-blue)',
                      fontWeight: theme.typography.fontWeightMedium,
                    }}
                  >
                    {participant.display_name}
                  </Typography>
                  <Chip
                    label={`${drinkCount} ${drinkCount === 1 ? 'enhet' : 'enheter'}`}
                    size="small"
                    sx={{
                      color: 'var(--prussian-blue)',
                      bgcolor: 'var(--xanthous)',
                      fontWeight: theme.typography.fontWeightMedium,
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
