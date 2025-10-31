import { Project } from '../../types/projects';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
interface ProjectMembersTabProps {
  project: Project;
}
export default function ProjectMembersTab({
  project
}: ProjectMembersTabProps) {
  const getCapacityColor = (available: number) => {
    if (available >= 50) return 'text-green-600';
    if (available >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getCapacityBadge = (available: number) => {
    if (available >= 50) return '🟢';
    if (available >= 25) return '🟡';
    return '🔴';
  };
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Team Members ({project.members.length})</h3>
      </div>

      <div className="space-y-3">
        {project.members.map(member => <div key={member.user_id} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{member.full_name}</p>
                  
                  <span className="text-lg">{getCapacityBadge(member.available_capacity)}</span>
                </div>
                
              </div>
              <Badge className="text-base font-semibold">
                {member.allocation_percentage}% on this project
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Allocation</span>
                <span className={getCapacityColor(member.available_capacity)}>
                  {member.current_total_allocation}% allocated • {member.available_capacity}% available
                </span>
              </div>
              <Progress value={member.current_total_allocation} className="h-2" />
            </div>
          </div>)}
      </div>
    </div>;
}