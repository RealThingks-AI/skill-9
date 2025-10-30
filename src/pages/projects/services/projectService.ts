import { supabase } from "@/integrations/supabase/client";
import type { 
  Project, 
  ProjectFormData, 
  EmployeeMatch, 
  AllocationHistory,
  RequiredSkill,
  RatingLevel,
  ProjectStatus
} from "../types/projects";

export const projectService = {
  async getAllProjects(): Promise<Project[]> {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const projectsWithDetails = await Promise.all(
      (projects || []).map(async (project) => {
        // Fetch members
        const { data: assignments } = await supabase
          .from('project_assignments')
          .select(`
            user_id,
            allocation_percentage,
            profiles!inner(user_id, full_name, email, role)
          `)
          .eq('project_id', project.id);

        const members = await Promise.all(
          (assignments || []).map(async (a: any) => {
            const { data: capacityData } = await supabase
              .rpc('get_user_total_allocation', { user_id_param: a.user_id });
            
            return {
              user_id: a.user_id,
              full_name: a.profiles.full_name,
              email: a.profiles.email,
              role: a.profiles.role,
              allocation_percentage: a.allocation_percentage,
              current_total_allocation: capacityData || 0,
              available_capacity: 100 - (capacityData || 0),
            };
          })
        );

        // Fetch required skills
        const { data: reqSkills } = await supabase
          .from('project_required_skills')
          .select(`
            skill_id,
            subskill_id,
            required_rating,
            skills!inner(name),
            subskills!inner(name)
          `)
          .eq('project_id', project.id);

        const required_skills = (reqSkills || []).map((rs: any) => ({
          skill_id: rs.skill_id,
          skill_name: rs.skills.name,
          subskill_id: rs.subskill_id,
          subskill_name: rs.subskills.name,
          required_rating: rs.required_rating,
        }));

        return {
          ...project,
          status: project.status as ProjectStatus,
          members,
          required_skills,
        };
      })
    );

    return projectsWithDetails as Project[];
  },

  async getProjectById(projectId: string): Promise<Project> {
    const projects = await this.getAllProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');
    return project;
  },

  async findMatchingEmployees(requiredSkills: RequiredSkill[]): Promise<EmployeeMatch[]> {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, role')
      .eq('status', 'active')
      .in('role', ['employee', 'tech_lead']);

    if (error) throw error;

    const matches: EmployeeMatch[] = await Promise.all(
      (profiles || []).map(async (profile) => {
        // Get user capacity
        const { data: totalAllocation } = await supabase
          .rpc('get_user_total_allocation', { user_id_param: profile.user_id });

        const current_total_allocation = totalAllocation || 0;
        const available_capacity = 100 - current_total_allocation;

        // Get user's approved ratings
        const { data: userRatings } = await supabase
          .from('employee_ratings')
          .select(`
            subskill_id,
            rating,
            skills!inner(id, name),
            subskills!inner(id, name)
          `)
          .eq('user_id', profile.user_id)
          .eq('status', 'approved');

        // Match against required skills
        let matched_skills = 0;
        const skill_details = requiredSkills.map(req => {
          const userRating = (userRatings || []).find(
            (ur: any) => ur.subskill_id === req.subskill_id
          );

          const ratingValues = { low: 1, medium: 2, high: 3 };
          const userRatingValue = userRating ? ratingValues[userRating.rating as RatingLevel] : 0;
          const requiredRatingValue = ratingValues[req.required_rating];
          
          const matches = userRatingValue >= requiredRatingValue;
          if (matches) matched_skills++;

          return {
            skill_name: req.skill_name,
            subskill_name: req.subskill_name,
            user_rating: (userRating?.rating || 'none') as RatingLevel | 'none',
            required_rating: req.required_rating,
            matches,
          };
        });

        const match_percentage = requiredSkills.length > 0 
          ? Math.round((matched_skills / requiredSkills.length) * 100)
          : 0;

        return {
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
          available_capacity,
          current_total_allocation,
          matched_skills,
          total_required_skills: requiredSkills.length,
          match_percentage,
          skill_details,
        };
      })
    );

    // Sort by match percentage and available capacity
    return matches.sort((a, b) => {
      if (b.match_percentage !== a.match_percentage) {
        return b.match_percentage - a.match_percentage;
      }
      return b.available_capacity - a.available_capacity;
    });
  },

  async createProject(formData: ProjectFormData, userId: string): Promise<string> {
    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        created_by: userId,
        status: 'awaiting_approval',
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Add required skills
    const skillsToInsert = formData.required_skills.map(skill => ({
      project_id: project.id,
      skill_id: skill.skill_id,
      subskill_id: skill.subskill_id,
      required_rating: skill.required_rating,
    }));

    const { error: skillsError } = await supabase
      .from('project_required_skills')
      .insert(skillsToInsert);

    if (skillsError) throw skillsError;

    // Add members
    const membersToInsert = formData.members.map(member => ({
      project_id: project.id,
      user_id: member.user_id,
      assigned_by: userId,
      allocation_percentage: member.allocation_percentage,
    }));

    const { error: membersError } = await supabase
      .from('project_assignments')
      .insert(membersToInsert);

    if (membersError) throw membersError;

    // Track allocation history
    const historyToInsert = formData.members.map(member => ({
      project_id: project.id,
      user_id: member.user_id,
      previous_allocation: null,
      new_allocation: member.allocation_percentage,
      changed_by: userId,
      change_reason: 'Initial project assignment',
    }));

    await supabase
      .from('project_allocation_history')
      .insert(historyToInsert);

    return project.id;
  },

  async updateProjectStatus(
    projectId: string, 
    status: 'active' | 'rejected',
    userId: string,
    rejectionReason?: string
  ): Promise<void> {
    const updateData: any = {
      status,
    };

    if (status === 'active') {
      updateData.approved_by = userId;
      updateData.approved_at = new Date().toISOString();
    } else if (status === 'rejected') {
      updateData.rejected_by = userId;
      updateData.rejected_at = new Date().toISOString();
      updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (error) throw error;
  },

  async getAllocationHistory(projectId: string): Promise<AllocationHistory[]> {
    const { data, error } = await supabase
      .from('project_allocation_history')
      .select(`
        *,
        profiles!user_id(full_name),
        changed_by_profile:profiles!changed_by(full_name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((h: any) => ({
      id: h.id,
      project_id: h.project_id,
      user_id: h.user_id,
      full_name: h.profiles?.full_name || 'Unknown',
      previous_allocation: h.previous_allocation,
      new_allocation: h.new_allocation,
      changed_by: h.changed_by,
      changed_by_name: h.changed_by_profile?.full_name || 'Unknown',
      change_reason: h.change_reason,
      created_at: h.created_at,
    }));
  },

  async getUserCapacity(userId: string): Promise<{ total: number; available: number }> {
    const { data: total } = await supabase
      .rpc('get_user_total_allocation', { user_id_param: userId });
    
    const { data: available } = await supabase
      .rpc('get_user_available_capacity', { user_id_param: userId });

    return {
      total: total || 0,
      available: available || 100,
    };
  },
};
