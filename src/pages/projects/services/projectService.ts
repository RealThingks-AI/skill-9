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
        // Fetch members (avoid failing relational join by fetching profiles separately)
        const { data: assignments, error: assignmentsError } = await supabase
          .from('project_assignments')
          .select('user_id, allocation_percentage')
          .eq('project_id', project.id);

        if (assignmentsError) {
          console.error('Error fetching project assignments:', assignmentsError);
        }

        const userIds = (assignments || []).map((a: any) => a.user_id);
        const { data: profilesData, error: profilesError } = userIds.length
          ? await supabase
              .from('profiles')
              .select('user_id, full_name, email, role')
              .in('user_id', userIds)
          : { data: [], error: null } as any;

        if (profilesError) {
          console.error('Error fetching profiles for assignments:', profilesError);
        }

        const profileMap = new Map<string, { user_id: string; full_name: string; email: string; role: string }>(
          (profilesData || []).map((p: any) => [p.user_id, p])
        );

        const members = await Promise.all(
          (assignments || []).map(async (a: any) => {
            const { data: capacityData } = await supabase
              .rpc('get_user_total_allocation', { user_id_param: a.user_id });

            const p = profileMap.get(a.user_id);
            return {
              user_id: a.user_id,
              full_name: p?.full_name || 'Unknown',
              email: p?.email || '',
              role: p?.role || '',
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
            skills!project_required_skills_skill_id_fkey(name),
            subskills!project_required_skills_subskill_id_fkey(name)
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
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
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

  async updateProject(projectId: string, formData: ProjectFormData): Promise<void> {
    // Get current user ID for tracking
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Get current project to check if it's an active project being updated
    const { data: currentProject } = await supabase
      .from('projects')
      .select('status, name, description, start_date, end_date')
      .eq('id', projectId)
      .single();

    const isActiveProjectUpdate = currentProject?.status === 'active';

    // Update project basic info
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        updated_at: new Date().toISOString(),
        // If updating an active project, send it back for approval
        status: isActiveProjectUpdate ? 'awaiting_approval' : undefined,
      })
      .eq('id', projectId);

    if (projectError) throw projectError;

    // Log the update in allocation history
    if (isActiveProjectUpdate) {
      const changes = [];
      if (currentProject.name !== formData.name) changes.push(`Name: "${currentProject.name}" → "${formData.name}"`);
      if (currentProject.description !== formData.description) changes.push('Description updated');
      if (currentProject.start_date !== formData.start_date) changes.push('Start date updated');
      if (currentProject.end_date !== formData.end_date) changes.push('End date updated');
      
      const changeReason = `Active project updated (${changes.join(', ')}) - Sent back for approval`;
      
      await supabase.from('project_allocation_history').insert({
        project_id: projectId,
        user_id: userId,
        previous_allocation: 0,
        new_allocation: 0,
        changed_by: userId,
        change_reason: changeReason,
      });
    }

    // Delete existing required skills and add new ones
    await supabase.from('project_required_skills').delete().eq('project_id', projectId);
    
    const skillsToInsert = formData.required_skills.map(skill => ({
      project_id: projectId,
      skill_id: skill.skill_id,
      subskill_id: skill.subskill_id,
      required_rating: skill.required_rating,
    }));

    if (skillsToInsert.length > 0) {
      const { error: skillsError } = await supabase
        .from('project_required_skills')
        .insert(skillsToInsert);

      if (skillsError) throw skillsError;
    }

    // Get existing assignments and skills for detailed change tracking
    const { data: existingAssignments } = await supabase
      .from('project_assignments')
      .select('user_id, allocation_percentage')
      .eq('project_id', projectId);

    const { data: existingSkills } = await supabase
      .from('project_required_skills')
      .select('skill_id, subskill_id, required_rating')
      .eq('project_id', projectId);

    const existingMap = new Map(
      (existingAssignments || []).map((a: any) => [a.user_id, a.allocation_percentage])
    );

    // Delete all assignments and re-insert
    await supabase.from('project_assignments').delete().eq('project_id', projectId);

    const membersToInsert = formData.members.map(member => ({
      project_id: projectId,
      user_id: member.user_id,
      assigned_by: userId,
      allocation_percentage: member.allocation_percentage,
    }));

    if (membersToInsert.length > 0) {
      const { error: membersError } = await supabase
        .from('project_assignments')
        .insert(membersToInsert);

      if (membersError) throw membersError;
    }

    // Track allocation history changes with detailed reasons
    const historyToInsert: any[] = [];
    
    // Track member allocation changes
    formData.members.forEach(member => {
      const oldAllocation = existingMap.get(member.user_id);
      if (oldAllocation !== member.allocation_percentage) {
        historyToInsert.push({
          project_id: projectId,
          user_id: member.user_id,
          previous_allocation: oldAllocation || null,
          new_allocation: member.allocation_percentage,
          changed_by: userId,
          change_reason: oldAllocation 
            ? `Allocation updated: ${oldAllocation}% → ${member.allocation_percentage}%`
            : `New member assigned with ${member.allocation_percentage}% allocation`,
        });
      }
    });

    // Track removed members
    existingAssignments?.forEach((existing: any) => {
      const stillAssigned = formData.members.find(m => m.user_id === existing.user_id);
      if (!stillAssigned) {
        historyToInsert.push({
          project_id: projectId,
          user_id: existing.user_id,
          previous_allocation: existing.allocation_percentage,
          new_allocation: 0,
          changed_by: userId,
          change_reason: 'Member removed from project',
        });
      }
    });

    // Track skill changes
    const skillChanges: string[] = [];
    const existingSkillSet = new Set(
      existingSkills?.map((s: any) => `${s.skill_id}-${s.subskill_id}-${s.required_rating}`) || []
    );
    const newSkillSet = new Set(
      formData.required_skills.map(s => `${s.skill_id}-${s.subskill_id}-${s.required_rating}`)
    );
    
    const addedSkills = formData.required_skills.filter(
      s => !existingSkillSet.has(`${s.skill_id}-${s.subskill_id}-${s.required_rating}`)
    );
    const removedSkills = existingSkills?.filter(
      (s: any) => !newSkillSet.has(`${s.skill_id}-${s.subskill_id}-${s.required_rating}`)
    ) || [];

    if (addedSkills.length > 0 || removedSkills.length > 0) {
      skillChanges.push(
        addedSkills.length > 0 ? `${addedSkills.length} skills added` : '',
        removedSkills.length > 0 ? `${removedSkills.length} skills removed` : ''
      );
      
      historyToInsert.push({
        project_id: projectId,
        user_id: userId,
        previous_allocation: 0,
        new_allocation: 0,
        changed_by: userId,
        change_reason: `Required skills updated: ${skillChanges.filter(Boolean).join(', ')}`,
      });
    }

    if (historyToInsert.length > 0) {
      await supabase
        .from('project_allocation_history')
        .insert(historyToInsert);
    }
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
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch user profiles for all unique user_ids and changed_by ids
    const userIds = new Set<string>();
    (data || []).forEach((h: any) => {
      if (h.user_id) userIds.add(h.user_id);
      if (h.changed_by) userIds.add(h.changed_by);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', Array.from(userIds));

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p.full_name])
    );

    return (data || []).map((h: any) => ({
      id: h.id,
      project_id: h.project_id,
      user_id: h.user_id,
      full_name: profileMap.get(h.user_id) || 'Unknown',
      previous_allocation: h.previous_allocation,
      new_allocation: h.new_allocation,
      changed_by: h.changed_by,
      changed_by_name: profileMap.get(h.changed_by) || 'Unknown',
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

  async deleteProject(projectId: string): Promise<void> {
    // Delete related records first (due to foreign key constraints)
    await supabase.from('project_assignments').delete().eq('project_id', projectId);
    await supabase.from('project_required_skills').delete().eq('project_id', projectId);
    await supabase.from('project_allocation_history').delete().eq('project_id', projectId);
    
    // Delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  }
};
