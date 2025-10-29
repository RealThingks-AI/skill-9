import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: "High" | "Medium" | "Low";
  progress: number;
  team: string[];
  skills: string[];
  startDate: string;
  endDate: string;
  tech_lead_id?: string;
  created_by: string;
}

export const useProjects = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch additional data for each project
      const projectsWithDetails = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Fetch team assignments
          const { data: assignments } = await supabase
            .from('project_assignments')
            .select('user_id')
            .eq('project_id', project.id);

          const team = assignments?.map(a => a.user_id) || [];

          // Fetch required skills
          const { data: requiredSkills } = await supabase
            .from('project_required_skills')
            .select('skill_id')
            .eq('project_id', project.id);

          const skills = requiredSkills?.map(s => s.skill_id) || [];

          // Calculate progress based on status
          const progress = 
            project.status === 'completed' ? 100 :
            project.status === 'active' ? 50 :
            project.status === 'awaiting_approval' ? 10 : 25;
          
          return {
            id: project.id,
            name: project.name,
            description: project.description || '',
            status: project.status,
            priority: 'Medium' as const,
            progress,
            team,
            skills,
            startDate: project.start_date || '',
            endDate: project.end_date || '',
            tech_lead_id: project.tech_lead_id,
            created_by: project.created_by
          };
        })
      );
      
      setProjects(projectsWithDetails);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchProjects();
    }
  }, [profile]);

  return {
    projects,
    loading,
    refreshProjects: fetchProjects
  };
};