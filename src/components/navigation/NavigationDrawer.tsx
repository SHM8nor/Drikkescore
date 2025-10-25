import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dialog,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

export function NavigationDrawer() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/login');
  };

  const menuItems = [
    { text: 'Hjem', icon: <HomeIcon />, path: '/' },
    { text: 'Historikk', icon: <HistoryIcon />, path: '/history' },
    { text: 'Analyse', icon: <AnalyticsIcon />, path: '/analytics' },
    { text: 'Innstillinger', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <>
      <IconButton
        edge="start"
        aria-label="menu"
        onClick={handleOpen}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1100,
          color: '#003049',
          bgcolor: '#eae2b7',
          '&:hover': {
            bgcolor: '#fcbf49',
          }
        }}
      >
        <MenuIcon />
      </IconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }
        }}
        PaperProps={{
          sx: {
            bgcolor: '#eae2b7',
            borderRadius: '12px',
            minWidth: '320px',
            maxWidth: '360px',
            margin: '72px 0 0 16px',
            position: 'absolute',
            top: 0,
            left: 0,
          }
        }}
      >
        <Box role="presentation">
          {/* User Info Header */}
          <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderBottom: '1px solid #eae2b7' }}>
            <Typography variant="h6" noWrap sx={{ color: '#003049', fontWeight: 'bold' }}>
              Drikkescore
            </Typography>
            {profile && (
              <Typography variant="body2" sx={{ color: '#000000', mt: 0.5 }}>
                {profile.full_name}
              </Typography>
            )}
          </Box>

          <Divider sx={{ borderColor: '#003049', opacity: 0.2 }} />

          {/* Navigation Menu */}
          <List>
            {menuItems.map((item) => {
              const isSelected = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      '&.Mui-selected': {
                        bgcolor: '#f77f00',
                        color: '#ffffff',
                        '&:hover': {
                          bgcolor: '#d66d00',
                        },
                        '& .MuiListItemIcon-root': {
                          color: '#ffffff',
                        }
                      },
                      '&:hover': {
                        bgcolor: '#fcbf49',
                      },
                      color: '#003049',
                      '& .MuiListItemIcon-root': {
                        color: '#003049',
                      }
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ borderColor: '#003049', opacity: 0.2 }} />

          {/* Sign Out */}
          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleSignOut}
                sx={{
                  '&:hover': {
                    bgcolor: '#d62828',
                    color: '#ffffff',
                    '& .MuiListItemIcon-root': {
                      color: '#ffffff',
                    }
                  },
                  color: '#003049',
                  '& .MuiListItemIcon-root': {
                    color: '#003049',
                  }
                }}
              >
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logg ut" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Dialog>
    </>
  );
}
