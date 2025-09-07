import { useState } from "react";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  systemHealth: 'Good' | 'Warning' | 'Critical';
}

export const useAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("user-management");

  // Mock data - replace with actual API calls
  const stats: AdminStats = {
    totalUsers: 124,
    activeUsers: 98,
    pendingApprovals: 7,
    systemHealth: 'Good'
  };

  return {
    loading,
    activeTab,
    setActiveTab,
    stats
  };
};