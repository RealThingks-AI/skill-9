import { Project } from '../../types/projects';
import { Calendar, User, Users } from 'lucide-react';

interface ProjectOverviewTabProps {
  project: Project;
}

export default function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Description</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Start Date</span>
          </div>
          <p className="font-medium">{project.start_date || 'Not set'}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>End Date</span>
          </div>
          <p className="font-medium">{project.end_date || 'Ongoing'}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Team Size</span>
          </div>
          <p className="font-medium">{project.members.length} members</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Required Skills</span>
          </div>
          <p className="font-medium">{project.required_skills.length} skills</p>
        </div>
      </div>

      {project.rejection_reason && (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
          <h3 className="font-semibold text-destructive mb-2">Rejection Reason</h3>
          <p className="text-sm text-muted-foreground">{project.rejection_reason}</p>
        </div>
      )}
    </div>
  );
}
