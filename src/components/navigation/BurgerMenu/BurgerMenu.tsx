import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAdmin } from '../../../hooks/useAdmin';
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
import HistoryIcon from '@mui/icons-material/History';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';

import './BurgerMenu.css';

const baseMenuItems: MenuItemData[] = [
  { label: 'Hjem', path: '/', icon: <HomeIcon /> },
  { label: 'Historikk', path: '/history', icon: <HistoryIcon /> },
  { label: 'Analyse', path: '/analytics', icon: <AnalyticsIcon /> },
  { label: 'Innstillinger', path: '/settings', icon: <SettingsIcon /> },
];

const adminMenuItem: MenuItemData = {
  label: 'Admin',
  path: '/admin',
  icon: <AdminPanelSettingsIcon />,
};

export default function BurgerMenu() {
  const { isOpen, close, toggle } = useBurgerMenu();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const isAdmin = useAdmin();

  // Build menu items array conditionally based on admin status
  const menuItems: MenuItemData[] = isAdmin
    ? [...baseMenuItems, adminMenuItem]
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

  return (
    <>
      <BurgerIcon isOpen={isOpen} onClick={toggle} />
      <MenuOverlay isOpen={isOpen} onClick={close} />
      <MenuPanel isOpen={isOpen} onClose={close}>
        {profile && (
          <UserHeader
            displayName={profile.full_name || 'User'}
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
          {menuItems.map((item, index) => (
            <MenuItem
              key={item.path}
              item={item}
              index={index}
              isActive={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            />
          ))}
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
