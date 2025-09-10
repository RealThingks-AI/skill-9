import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DashboardStats {
  totalTeamMembers: string;
  skillsTracked: string;
  completedAssessments: string;
  pendingReviews: string;
  totalMembers?: string;
  membersChange?: string;
  totalSkills?: string;
  skillsChange?: string;
  completionRate?: number;
  completionChange?: string;
  reviewsChange?: string;
  recentActivity?: Array<{
    description: string;
    timestamp: string;
  }>;
  topSkills?: Array<{
    name: string;
    percentage: number;
  }>;
}

export const useDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTeamMembers: "0",
    skillsTracked: "0", 
    completedAssessments: "0%",
    pendingReviews: "0"
  });
  
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      // Get total team members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('status', 'active');
      
      // Get total skills tracked
      const { data: skills } = await supabase
        .from('skills')
        .select('id');
      
      // Get completed assessments (approved ratings)
      const { data: totalRatings } = await supabase
        .from('employee_ratings')
        .select('id');
        
      const { data: approvedRatings } = await supabase
        .from('employee_ratings')
        .select('id')
        .eq('status', 'approved');
      
      // Get pending reviews
      const { data: pendingRatings } = await supabase
        .from('employee_ratings')
        .select('id')
        .eq('status', 'submitted');
      
      const completionRate = totalRatings?.length 
        ? Math.round((approvedRatings?.length || 0) / totalRatings.length * 100)
        : 0;
      
      setStats({
        totalTeamMembers: (profiles?.length || 0).toString(),
        skillsTracked: (skills?.length || 0).toString(),
        completedAssessments: `${completionRate}%`,
        pendingReviews: (pendingRatings?.length || 0).toString(),
        // Additional properties for compatibility
        totalMembers: (profiles?.length || 0).toString(),
        membersChange: "+2 this month",
        totalSkills: (skills?.length || 0).toString(),
        skillsChange: "+5 this week",
        completionRate: completionRate,
        completionChange: "+12% this month",
        reviewsChange: "-3 this week",
        recentActivity: [
          {
            description: "John Doe completed React assessment",
            timestamp: "2 hours ago"
          },
          {
            description: "Sarah Wilson updated TypeScript skills",
            timestamp: "4 hours ago"
          },
          {
            description: "Mike Chen submitted Node.js evaluation",
            timestamp: "1 day ago"
          }
        ],
        topSkills: [
          { name: "React", percentage: 85 },
          { name: "TypeScript", percentage: 72 },
          { name: "Node.js", percentage: 68 },
          { name: "Python", percentage: 55 },
          { name: "AWS", percentage: 43 }
        ]
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [profile]);
  
  return {
    stats,
    loading,
    refreshStats: fetchDashboardStats
  };
};