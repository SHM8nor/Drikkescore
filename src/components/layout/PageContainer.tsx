import React from 'react';
import './PageContainer.css';

interface PageContainerProps {
  children: React.ReactNode;
}

/**
 * PageContainer - A simple wrapper component for consistent page layout
 *
 * Provides:
 * - Maximum width constraint (1200px)
 * - Centered alignment
 * - Responsive horizontal padding (16px mobile, 32px desktop)
 */
export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return <div className="page-container">{children}</div>;
};
