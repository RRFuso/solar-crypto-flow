
import React from 'react';
import DashboardLayout from './DashboardLayout';

interface DashboardLayoutWrapperProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

/**
 * This wrapper ensures only the allowed tabs are shown in the navigation
 */
const DashboardLayoutWrapper: React.FC<DashboardLayoutWrapperProps> = ({ 
  activeTab, 
  onTabChange,
  children
}) => {
  // Filter tabs to only show Home, Performance and Social Flow
  const handleTabChange = (tab: string) => {
    // Only allow navigation to permitted tabs
    if (['home', 'performance', 'social-flow'].includes(tab)) {
      onTabChange(tab);
    }
  };
  
  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {children}
    </DashboardLayout>
  );
};

export default DashboardLayoutWrapper;
