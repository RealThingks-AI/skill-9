import { supabase } from "@/integrations/supabase/client";

export interface ResourceAllocation {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  total_allocation: number;
  available_capacity: number;
  active_projects_count: number;
}

export interface UserProject {
  project_id: string;
  project_name: string;
  project_status: string;
  allocation_percentage: number;
  start_date?: string;
  end_date?: string;
}

export interface ProjectHistory {
  project_id: string;
  project_name: string;
  allocation_percentage: number;
  assigned_at: string;
  start_date?: string;
  end_date?: string;
  changed_by_name: string;
  change_reason?: string;
  project_status?: string;
}

export const resourceService = {
  async getAllResourceAllocations(): Promise<ResourceAllocation[]> {
    // Get all active employees and tech leads
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, role')
      .eq('status', 'active')
      .in('role', ['employee', 'tech_lead']);

    if (profilesError) throw profilesError;

    const resources = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: totalAllocation } = await supabase
          .rpc('get_user_total_allocation', { user_id_param: profile.user_id });

        // Count active projects
        const { data: assignments } = await supabase
          .from('project_assignments')
          .select('project_id, projects!inner(status)')
          .eq('user_id', profile.user_id);

        const activeProjectsCount = (assignments || []).filter(
          (a: any) => a.projects.status === 'active'
        ).length;

        return {
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
          total_allocation: totalAllocation || 0,
          available_capacity: 100 - (totalAllocation || 0),
          active_projects_count: activeProjectsCount,
        };
      })
    );

    return resources.sort((a, b) => b.total_allocation - a.total_allocation);
  },

  async getUserCurrentProjects(userId: string): Promise<UserProject[]> {
    const { data: assignments, error } = await supabase
      .from('project_assignments')
      .select(`
        allocation_percentage,
        project_id,
        projects!inner(id, name, status, start_date, end_date)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    return (assignments || [])
      .filter((a: any) => ['active', 'awaiting_approval'].includes(a.projects.status))
      .map((a: any) => ({
        project_id: a.projects.id,
        project_name: a.projects.name,
        project_status: a.projects.status,
        allocation_percentage: a.allocation_percentage,
        start_date: a.projects.start_date,
        end_date: a.projects.end_date,
      }));
  },

  async getUserProjectHistory(userId: string): Promise<ProjectHistory[]> {
    // Fetch allocation history without relational join to avoid FK issues
    const { data: historyData, error: historyError } = await supabase
      .from('project_allocation_history')
      .select('project_id, new_allocation, created_at, change_reason, changed_by')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching allocation history:', historyError);
      throw historyError;
    }

    if (!historyData || historyData.length === 0) {
      return [];
    }

    // Get unique project IDs
    const projectIds = [...new Set(historyData.map((h: any) => h.project_id))];

    // Fetch projects separately
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, start_date, end_date, status')
      .in('id', projectIds);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    }

    const projectMap = new Map(
      (projectsData || []).map((p: any) => [p.id, p])
    );

    // Get unique user IDs for changed_by
    const changedByIds = [...new Set(historyData.map((h: any) => h.changed_by))];

    // Fetch profiles separately
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', changedByIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const profileMap = new Map(
      (profilesData || []).map((p: any) => [p.user_id, p])
    );

    return historyData.map((h: any) => {
      const project = projectMap.get(h.project_id);
      const changedByProfile = profileMap.get(h.changed_by);

      return {
        project_id: h.project_id,
        project_name: project?.name || 'Unknown Project',
        allocation_percentage: h.new_allocation,
        assigned_at: h.created_at,
        start_date: project?.start_date,
        end_date: project?.end_date,
        changed_by_name: changedByProfile?.full_name || 'Unknown',
        change_reason: h.change_reason,
        project_status: project?.status,
      };
    });
  },
};
