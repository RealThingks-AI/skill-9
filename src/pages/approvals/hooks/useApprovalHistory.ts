import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Profile } from "@/types/database";
import { fetchAllRows } from "@/utils/supabasePagination";

export interface HistoricalRating {
  id: string;
  user_id: string;
  skill_id: string;
  subskill_id: string | null;
  rating: 'high' | 'medium' | 'low';
  status: 'approved' | 'rejected';
  self_comment: string | null;
  approver_comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  skill?: {
    id: string;
    name: string;
    skill_categories?: {
      id: string;
      name: string;
      color: string;
    };
  };
  subskill?: {
    id: string;
    name: string;
  };
  approver?: Profile;
  employee?: Profile;
}

export interface GroupedHistoricalApproval {
  userId: string;
  employeeName: string;
  employeeEmail: string;
  ratings: HistoricalRating[];
  totalCount: number;
}

export const useApprovalHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistoricalApproval[]>([]);

  const fetchApprovalHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch ALL approved or rejected ratings using pagination helper
      const { data: allRatings, error: ratingsError } = await fetchAllRows(
        supabase
          .from('employee_ratings')
          .select(`
            *,
            skill:skills (
              id,
              name,
              skill_categories (
                id,
                name,
                color
              )
            ),
            subskill:subskills (
              id,
              name
            )
          `)
          .in('status', ['approved', 'rejected'])
          .order('approved_at', { ascending: false })
      );

      if (ratingsError) throw ratingsError;

      // Fetch user profiles separately
      const userIds = [...new Set((allRatings || []).map(r => r.user_id))];
      const approverIds = [...new Set((allRatings || []).map(r => r.approved_by).filter(Boolean))];
      const allUserIds = [...new Set([...userIds, ...approverIds])];

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', allUserIds);

      if (profileError) throw profileError;

      const profileMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile as Profile;
        return acc;
      }, {} as Record<string, Profile>);

      // Group by employee
      const grouped = (allRatings || []).reduce((acc, rating) => {
        const userId = rating.user_id;
        
        if (!acc[userId]) {
          const employeeProfile = profileMap[userId];
          acc[userId] = {
            userId,
            employeeName: employeeProfile?.full_name || 'Unknown',
            employeeEmail: employeeProfile?.email || '',
            ratings: [],
            totalCount: 0
          };
        }

        // Add profile data to the rating
        const enrichedRating: HistoricalRating = {
          ...rating as any,
          approver: rating.approved_by ? profileMap[rating.approved_by] : undefined,
          employee: profileMap[userId]
        };

        acc[userId].ratings.push(enrichedRating);
        acc[userId].totalCount++;
        
        return acc;
      }, {} as Record<string, GroupedHistoricalApproval>);

      setGroupedHistory(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching approval history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApprovalHistory();
    }
  }, [user]);

  return {
    groupedHistory,
    loading,
    refetch: fetchApprovalHistory
  };
};
