import { useState } from "react";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Planning' | 'On Hold' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  progress: number;
  team: string[];
  skills: string[];
  startDate: string;
  endDate: string;
}

export const useProjects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const projects: Project[] = [
    {
      id: "1",
      name: "E-commerce Platform",
      description: "Building a new customer-facing e-commerce platform",
      status: "Active",
      priority: "High",
      progress: 75,
      team: ["John Doe", "Jane Smith", "Bob Johnson"],
      skills: ["React", "Node.js", "PostgreSQL"],
      startDate: "2024-01-01",
      endDate: "2024-06-30"
    },
    // Add more mock data as needed
  ];

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    searchTerm,
    setSearchTerm,
    projects: filteredProjects,
    loading
  };
};