export interface BurgerMenuState {
  isOpen: boolean;
  isAnimating: boolean;
  swipeProgress: number;
}

export interface MenuItemData {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export interface BurgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export interface BurgerIconProps {
  isOpen: boolean;
  onClick: () => void;
}

export interface MenuOverlayProps {
  isOpen: boolean;
  onClick: () => void;
}

export interface MenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface MenuItemProps {
  item: MenuItemData;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export interface UserHeaderProps {
  displayName: string;
  email: string;
}

export interface SwipeConfig {
  openThreshold: number;
  closeThreshold: number;
  velocityThreshold: number;
  dragElastic: number;
  edgeZone: number;
}
