import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import { useAdmin } from '../../../hooks/useAdmin';
import { useFriends } from '../../../hooks/useFriends';
import BurgerIcon from './BurgerIcon';
import MenuOverlay from './MenuOverlay';
import MenuPanel from './MenuPanel';
import MenuItem from './MenuItem';
import UserHeader from './UserHeader';
import { useBurgerMenu } from './useBurgerMenu';
import { staggerContainerVariants, menuItemVariants, tapScale } from './menuAnimations';
import type { MenuItemData } from './types';

// Material-UI Icons
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import InsightsIcon from '@mui/icons-material/Insights';
import LogoutIcon from '@mui/icons-material/Logout';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import './BurgerMenu.css';

const baseMenuItems: MenuItemData[] = [
  { label: 'Hjem', path: '/', icon: <HomeIcon /> },
  { label: 'Venner', path: '/friends', icon: <PeopleIcon /> },
  { label: 'Historikk', path: '/history', icon: <HistoryIcon /> },
  { label: 'Merker', path: '/badges', icon: <EmojiEventsIcon /> },
  { label: 'Analyse', path: '/analytics', icon: <AnalyticsIcon /> },
  { label: 'Innstillinger', path: '/settings', icon: <SettingsIcon /> },
];

const adminMenuItems: MenuItemData[] = [
  { label: 'Sesjoner', path: '/admin', icon: <DashboardIcon /> },
  { label: 'Brukere', path: '/admin/users', icon: <GroupIcon /> },
  { label: 'Analyse', path: '/admin/analytics', icon: <InsightsIcon /> },
  { label: 'Merker', path: '/admin/badges', icon: <EmojiEventsIcon /> },
];

export default function BurgerMenu() {
  const { isOpen, close, toggle } = useBurgerMenu();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const isAdmin = useAdmin();
  const { pendingCount } = useFriends();

  // Build menu items array conditionally based on admin status
  const menuItems: MenuItemData[] = isAdmin
    ? [...baseMenuItems, ...adminMenuItems]
    : baseMenuItems;

  const handleNavigation = (path: string) => {
    navigate(path);
    close();
  };

  const handleSignOut = async () => {
    await signOut();
    close();
    navigate('/login');
  };

  // Render menu item with optional badge for Friends
  const renderMenuItem = (item: MenuItemData, index: number) => {
    const isActive = location.pathname === item.path;

    // Add notification badge for Friends menu item
    if (item.path === '/friends' && pendingCount > 0) {
      const iconWithBadge = (
        <Badge
          badgeContent={pendingCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.65rem',
              height: '18px',
              minWidth: '18px',
              padding: '0 4px',
            },
          }}
        >
          {item.icon}
        </Badge>
      );

      return (
        <MenuItem
          key={item.path}
          item={{ ...item, icon: iconWithBadge }}
          index={index}
          isActive={isActive}
          onClick={() => handleNavigation(item.path)}
        />
      );
    }

    return (
      <MenuItem
        key={item.path}
        item={item}
        index={index}
        isActive={isActive}
        onClick={() => handleNavigation(item.path)}
      />
    );
  };

  return (
    <>
      <BurgerIcon isOpen={isOpen} onClick={toggle} />
      <MenuOverlay isOpen={isOpen} onClick={close} />
      <MenuPanel isOpen={isOpen} onClose={close}>
        {profile && (
          <UserHeader
            displayName={profile.display_name || 'User'}
            email={user?.email || ''}
          />
        )}

        <motion.nav
          className="burger-menu-nav"
          variants={staggerContainerVariants}
          initial="closed"
          animate={isOpen ? 'open' : 'closed'}
          role="menu"
        >
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </motion.nav>

        <div className="burger-menu-divider" />

        <motion.button
          className="burger-menu-signout"
          custom={menuItems.length}
          variants={menuItemVariants}
          initial="closed"
          animate={isOpen ? 'open' : 'closed'}
          whileTap={tapScale}
          onClick={handleSignOut}
          role="menuitem"
        >
          <span className="burger-menu-signout__icon">
            <LogoutIcon />
          </span>
          <span className="burger-menu-signout__label">Logg ut</span>
        </motion.button>
      </MenuPanel>
    </>
  );
}
