import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/components/common/AuthProvider";
import type { EmployeeRating, Profile, Skill, Subskill } from "@/types/database";
import { toast } from "sonner";

export interface ApprovalRequest {
  id: string;
  type: string;
  requester: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  submitDate: string;
  dueDate: string;
  rating: 'high' | 'medium' | 'low';
  skill?: Skill;
  subskill?: Subskill;
  self_comment?: string;
}

export interface GroupedApproval {
  employeeId: string;
  employeeName: string;
  email: string;
  pendingCount: number;
  submitDate: string;
  ratings: ApprovalRequest[];
}

export interface RecentAction {
  id: string;
  action: 'Approved' | 'Rejected';
  title: string;
  approver: string;
  date: string;
}

export const useApprovals = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [groupedApprovals, setGroupedApprovals] = useState<GroupedApproval[]>([]);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const { user } = useAuthContext();

  const fetchPendingApprovals = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch employee ratings that need approval for tech leads
      const { data: ratings, error } = await supabase
        .from('employee_ratings')
        .select(`
          *,
          skills (
            id,
            name,
            category_id,
            created_at,
            skill_categories (name)
          ),
          subskills (
            id,
            name,
            skill_id,
            created_at,
            updated_at
          )
        `)
        .eq('status', 'submitted');

      if (error) throw error;

      // Get profiles for tech lead filtering
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, tech_lead_id')
        .eq('tech_lead_id', user.id);

      if (profilesError) throw profilesError;

      // Filter ratings for employees under this tech lead
      const userIds = profiles?.map(p => p.user_id) || [];
      const filteredRatings = ratings?.filter(rating => 
        userIds.includes(rating.user_id)
      ) || [];

      const approvals: ApprovalRequest[] = [];

      for (const rating of filteredRatings) {
        const employeeProfile = profiles?.find(p => p.user_id === rating.user_id);
        
        approvals.push({
          id: rating.id,
          type: "Skill Assessment",
          requester: employeeProfile?.full_name || 'Unknown Employee',
          title: `${rating.skills?.name}${rating.subskills ? ` - ${rating.subskills.name}` : ''}`,
          description: `Employee self-rated as ${rating.rating.toUpperCase()} level${rating.self_comment ? `: "${rating.self_comment}"` : ''}`,
          priority: rating.rating === 'high' ? 'High' : rating.rating === 'medium' ? 'Medium' : 'Low',
          submitDate: new Date(rating.submitted_at || rating.created_at).toLocaleDateString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          rating: rating.rating as 'high' | 'medium' | 'low',
          skill: rating.skills,
          subskill: rating.subskills,
          self_comment: rating.self_comment
        });
      }

      setPendingApprovals(approvals);

      // Group approvals by employee
      const grouped = profiles?.map(profile => {
        const employeeRatings = approvals.filter(approval => 
          approval.requester === profile.full_name
        );
        
        return {
          employeeId: profile.user_id,
          employeeName: profile.full_name,
          email: profile.email,
          pendingCount: employeeRatings.length,
          submitDate: employeeRatings.length > 0 ? employeeRatings[0].submitDate : '',
          ratings: employeeRatings
        };
      }).filter(group => group.pendingCount > 0) || [];

      setGroupedApprovals(grouped);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      toast.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActions = async () => {
    if (!user) return;

    try {
      const { data: ratings, error } = await supabase
        .from('employee_ratings')
        .select(`
          *,
          skills (name),
          subskills (name)
        `)
        .in('status', ['approved', 'rejected'])
        .eq('approved_by', user.id)
        .order('approved_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Get profile names for the rated users
      const userIds = ratings?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const actions: RecentAction[] = ratings?.map(rating => {
        const profile = profiles?.find(p => p.user_id === rating.user_id);
        return {
          id: rating.id,
          action: rating.status === 'approved' ? 'Approved' : 'Rejected',
          title: `${rating.skills?.name}${rating.subskills ? ` - ${rating.subskills.name}` : ''}`,
          approver: profile?.full_name || 'Unknown',
          date: new Date(rating.approved_at || rating.updated_at).toLocaleDateString()
        };
      }) || [];

      setRecentActions(actions);
    } catch (error) {
      console.error('Error fetching recent actions:', error);
    }
  };

  const handleApproveRating = async (approvalId: string) => {
    try {
      if (!user?.id) {
        toast.error('You must be logged in to approve ratings');
        return;
      }

      const { error } = await supabase
        .from('employee_ratings')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast.success('Rating approved successfully');
      fetchPendingApprovals();
      fetchRecentActions();
    } catch (error) {
      console.error('Error approving rating:', error);
      toast.error('Failed to approve rating');
    }
  };

  const handleUpdateRating = async (
    approvalId: string, 
    newRating: 'high' | 'medium' | 'low', 
    comment?: string
  ) => {
    try {
      if (!user?.id) {
        toast.error('You must be logged in to update ratings');
        return;
      }

      const { error } = await supabase
        .from('employee_ratings')
        .update({
          rating: newRating,
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          approver_comment: comment
        })
        .eq('id', approvalId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast.success('Rating updated and approved');
      fetchPendingApprovals();
      fetchRecentActions();
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error('Failed to update rating');
    }
  };

  useEffect(() => {
    if (user) {
      fetchPendingApprovals();
      fetchRecentActions();
    }
  }, [user]);

  return {
    searchTerm,
    setSearchTerm,
    pendingApprovals,
    groupedApprovals,
    recentActions,
    loading,
    handleApproveRating,
    handleUpdateRating,
    refetch: () => {
      fetchPendingApprovals();
      fetchRecentActions();
    }
  };
};