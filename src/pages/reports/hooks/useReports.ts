import { useState } from "react";

export interface ReportCategory {
  title: string;
  description: string;
  icon: any;
  reports: string[];
  color: string;
}

export interface RecentReport {
  name: string;
  type: string;
  generatedBy: string;
  date: string;
  status: 'Ready' | 'Processing' | 'Failed';
}

export const useReports = () => {
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const reportCategories: ReportCategory[] = [
    {
      title: "Skills Analytics",
      description: "Comprehensive reports on team skill development and gaps",
      icon: null, // Will be set in component
      reports: ["Skills Gap Analysis", "Team Competency Matrix", "Skill Progression Report"],
      color: "border-blue-200 bg-blue-50"
    },
    // Add more categories as needed
  ];

  const recentReports: RecentReport[] = [
    {
      name: "Q4 Skills Assessment",
      type: "Skills Analytics",
      generatedBy: "John Doe",
      date: "2024-01-15",
      status: "Ready"
    },
    // Add more reports as needed
  ];

  return {
    reportCategories,
    recentReports,
    loading
  };
};