import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, Target } from "lucide-react";
import type { Project } from "../types/projects";
import { getStatusColor, getPriorityColor } from "../utils/projectHelpers";

interface ProjectCardProps {
  project: Project;
  onViewDetails?: (id: string) => void;
}

export const ProjectCard = ({ project, onViewDetails }: ProjectCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <div className="flex gap-2">
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {project.team.length} members
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {project.skills.length} skills
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {project.endDate}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {project.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {project.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{project.skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <Button 
          className="w-full mt-4" 
          variant="outline" 
          onClick={() => onViewDetails?.(project.id)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};