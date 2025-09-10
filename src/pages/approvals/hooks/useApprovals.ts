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
      // Fetch ALL employee ratings that need approval for ANY tech lead
      // This allows any tech lead to approve any employee's ratings
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

      if (error) {
        console.error('Error fetching ratings:', error);
        throw error;
      }

      console.log('📊 Fetched ratings:', ratings?.length || 0, 'ratings');

      // Get ALL profiles to map user info (including tech leads for self-ratings)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, tech_lead_id, role')
        .in('role', ['employee', 'tech_lead', 'management', 'admin']);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Create approvals for ALL submitted ratings (not filtered by tech lead assignment)
      const filteredRatings = ratings || [];

      const approvals: ApprovalRequest[] = [];

      for (const rating of filteredRatings) {
        const employeeProfile = profiles?.find(p => p.user_id === rating.user_id);
        
        // Determine the type based on the role of the person who submitted the rating
        const submitterRole = employeeProfile?.role || 'employee';
        const isTeamLead = submitterRole === 'tech_lead';
        
        approvals.push({
          id: rating.id,
          type: isTeamLead ? "Tech Lead Self-Assessment" : "Skill Assessment",
          requester: employeeProfile?.full_name || 'Unknown User',
          title: `${rating.skills?.name}${rating.subskills ? ` - ${rating.subskills.name}` : ''}`,
          description: `${isTeamLead ? 'Tech Lead' : 'Employee'} self-rated as ${rating.rating.toUpperCase()} level${rating.self_comment ? `: "${rating.self_comment}"` : ''}`,
          priority: rating.rating === 'high' ? 'High' : rating.rating === 'medium' ? 'Medium' : 'Low',
          submitDate: new Date(rating.submitted_at || rating.created_at).toLocaleDateString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          rating: rating.rating as 'high' | 'medium' | 'low',
          skill: rating.skills,
          subskill: rating.subskills,
          self_comment: rating.self_comment
        });
      }

      console.log('✅ Created approvals:', approvals.length, 'approval requests');

      setPendingApprovals(approvals);

      // Group approvals by user (including tech leads)
      const grouped = profiles?.map(profile => {
        const userRatings = approvals.filter(approval => 
          approval.requester === profile.full_name
        );
        
        return {
          employeeId: profile.user_id,
          employeeName: profile.full_name,
          email: profile.email,
          pendingCount: userRatings.length,
          submitDate: userRatings.length > 0 ? userRatings[0].submitDate : '',
          ratings: userRatings
        };
      }).filter(group => group.pendingCount > 0) || [];

      console.log('📊 Grouped approvals:', grouped.length, 'groups with pending ratings');

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
        .order('approved_at', { ascending: false })
        .limit(20);

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

  // Get approved today count
  const getApprovedTodayCount = () => {
    const today = new Date().toDateString();
    return recentActions.filter(action => 
      action.action === 'Approved' && new Date(action.date).toDateString() === today
    ).length;
  };

  // Get rejected today count
  const getRejectedTodayCount = () => {
    const today = new Date().toDateString();
    return recentActions.filter(action => 
      action.action === 'Rejected' && new Date(action.date).toDateString() === today
    ).length;
  };

  // Get approved today actions
  const getApprovedTodayActions = () => {
    const today = new Date().toDateString();
    return recentActions.filter(action => 
      action.action === 'Approved' && new Date(action.date).toDateString() === today
    );
  };

  // Get rejected today actions
  const getRejectedTodayActions = () => {
    const today = new Date().toDateString();
    return recentActions.filter(action => 
      action.action === 'Rejected' && new Date(action.date).toDateString() === today
    );
  };

  const handleApproveRating = async (approvalId: string, comment?: string) => {
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
          approved_at: new Date().toISOString(),
          approver_comment: comment || null
        })
        .eq('id', approvalId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Log the approval action
      await supabase
        .from('approval_logs')
        .insert({
          rating_id: approvalId,
          approver_id: user.id,
          action: 'approved',
          approver_comment: comment || '',
          created_at: new Date().toISOString()
        });

      toast.success('Rating approved successfully');
      fetchPendingApprovals();
      fetchRecentActions();
    } catch (error) {
      console.error('Error approving rating:', error);
      toast.error('Failed to approve rating');
    }
  };

  const handleRejectRating = async (approvalId: string, comment: string) => {
    try {
      if (!user?.id) {
        toast.error('You must be logged in to reject ratings');
        return;
      }

      if (!comment.trim()) {
        toast.error('Comment is required when rejecting ratings');
        return;
      }

      const { error } = await supabase
        .from('employee_ratings')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          approver_comment: comment
        })
        .eq('id', approvalId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Log the rejection action
      await supabase
        .from('approval_logs')
        .insert({
          rating_id: approvalId,
          approver_id: user.id,
          action: 'rejected',
          approver_comment: comment,
          created_at: new Date().toISOString()
        });

      toast.success('Rating rejected');
      fetchPendingApprovals();
      fetchRecentActions();
    } catch (error) {
      console.error('Error rejecting rating:', error);
      toast.error('Failed to reject rating');
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
    handleRejectRating,
    getApprovedTodayCount,
    getRejectedTodayCount,
    getApprovedTodayActions,
    getRejectedTodayActions,
    refetch: () => {
      fetchPendingApprovals();
      fetchRecentActions();
    }
  };
};