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
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      // Fetch projects with assignments and profiles
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_assignments (
            user_id,
            profiles (
              full_name
            )
          )
        `);
      
      if (error) throw error;
      
      // Transform data to match interface
      const transformedProjects: Project[] = (projectsData || []).map(project => {
        const teamMembers = project.project_assignments?.map(
          (assignment: any) => assignment.profiles?.full_name || 'Unknown'
        ) || [];
        
        // Calculate progress based on project status
        let progress = 0;
        switch (project.status) {
          case 'planning':
            progress = 10;
            break;
          case 'in_progress':
            progress = 50;
            break;
          case 'completed':
            progress = 100;
            break;
          case 'on_hold':
            progress = 25;
            break;
          default:
            progress = 0;
        }
        
        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          status: project.status,
          priority: 'Medium' as const, // Default priority since not in schema
          progress,
          team: teamMembers,
          skills: [], // Would need separate skills-projects mapping
          startDate: project.start_date || '',
          endDate: project.end_date || '',
          tech_lead_id: project.tech_lead_id,
          created_by: project.created_by
        };
      });
      
      setProjects(transformedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [profile]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    searchTerm,
    setSearchTerm,
    projects: filteredProjects,
    loading,
    refreshProjects: fetchProjects
  };
};