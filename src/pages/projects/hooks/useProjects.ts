import { useState, useEffect } from "react";
import { projectService } from "../services/projectService";
import type { Project } from "../types/projects";
import { toast } from "sonner";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
      return false;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    refreshProjects: fetchProjects,
    deleteProject,
  };
};