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
  budget?: number;
  client?: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
}

export interface ProjectSkill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  required: boolean;
}

export type ProjectStatus = 'Active' | 'Planning' | 'On Hold' | 'Completed';
export type ProjectPriority = 'High' | 'Medium' | 'Low';