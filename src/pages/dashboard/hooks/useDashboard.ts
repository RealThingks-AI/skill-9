import { useState, useEffect } from "react";

export interface DashboardStats {
  totalTeamMembers: string;
  skillsTracked: string;
  completedAssessments: string;
  pendingReviews: string;
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTeamMembers: "24",
    skillsTracked: "156", 
    completedAssessments: "89%",
    pendingReviews: "7"
  });
  
  const [loading, setLoading] = useState(false);

  // Add future dashboard data fetching logic here
  
  return {
    stats,
    loading
  };
};