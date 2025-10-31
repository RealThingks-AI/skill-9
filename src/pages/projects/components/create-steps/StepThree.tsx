import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, Loader2 } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { ProjectFormData, EmployeeMatch, AllocationPercentage } from '../../types/projects';
import { toast } from 'sonner';
interface StepThreeProps {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
}
export default function StepThree({
  formData,
  setFormData
}: StepThreeProps) {
  const [matches, setMatches] = useState<EmployeeMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  useEffect(() => {
    loadMatches();
  }, []);
  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await projectService.findMatchingEmployees(formData.required_skills);
      setMatches(data);
    } catch (error) {
      console.error('Error loading matches:', error);
      toast.error('Failed to load employee matches');
    } finally {
      setLoading(false);
    }
  };
  const addMember = (userId: string, allocation: AllocationPercentage) => {
    const match = matches.find(m => m.user_id === userId);
    if (!match) return;
    if (allocation > match.available_capacity) {
      toast.error(`${match.full_name} only has ${match.available_capacity}% capacity available`);
      return;
    }
    const exists = formData.members.some(m => m.user_id === userId);
    if (exists) {
      toast.error('User already added');
      return;
    }
    setFormData({
      ...formData,
      members: [...formData.members, {
        user_id: userId,
        allocation_percentage: allocation
      }]
    });
  };
  const removeMember = (userId: string) => {
    setFormData({
      ...formData,
      members: formData.members.filter(m => m.user_id !== userId)
    });
  };
  const updateAllocation = (userId: string, allocation: AllocationPercentage) => {
    const match = matches.find(m => m.user_id === userId);
    if (!match) return;
    if (allocation > match.available_capacity) {
      toast.error(`${match.full_name} only has ${match.available_capacity}% capacity available`);
      return;
    }
    setFormData({
      ...formData,
      members: formData.members.map(m => m.user_id === userId ? {
        ...m,
        allocation_percentage: allocation
      } : m)
    });
  };
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
  if (loading) {
    return <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>;
  }
  return <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Assigned Members ({formData.members.length})</h3>
        {formData.members.length === 0 ? <p className="text-sm text-muted-foreground">No members assigned yet</p> : <div className="space-y-2">
            {formData.members.map(member => {
          const match = matches.find(m => m.user_id === member.user_id);
          if (!match) return null;
          return <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{match.full_name}</p>
                    <p className="text-sm text-muted-foreground">{match.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select value={member.allocation_percentage} onChange={e => updateAllocation(member.user_id, Number(e.target.value) as AllocationPercentage)} className="text-sm border rounded px-2 py-1">
                      <option value={25}>25%</option>
                      <option value={50}>50%</option>
                      <option value={75}>75%</option>
                      <option value={100}>100%</option>
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => removeMember(member.user_id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>;
        })}
          </div>}
      </div>

      <div>
        <h3 className="font-semibold mb-2">Suggested Employees</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {matches.map(match => {
          const isAssigned = formData.members.some(m => m.user_id === match.user_id);
          const isExpanded = expandedUserId === match.user_id;
          return <div key={match.user_id} className="border rounded-lg">
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{match.full_name}</p>
                        <Badge variant={match.match_percentage >= 70 ? 'default' : 'secondary'}>
                          {match.match_percentage}% match
                        </Badge>
                        <span className="text-lg">{getCapacityBadge(match.available_capacity)}</span>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className={getCapacityColor(match.available_capacity)}>
                            {match.available_capacity}% available
                          </span>
                          <span className="text-muted-foreground">({match.current_total_allocation}% allocated)</span>
                        </div>
                        <Progress value={match.current_total_allocation} className="mt-1 h-2" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!isAssigned && <>
                          <Button size="sm" variant="outline" onClick={() => addMember(match.user_id, 25)}>
                            + 25%
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => addMember(match.user_id, 50)}>
                            + 50%
                          </Button>
                        </>}
                      <Button size="sm" variant="ghost" onClick={() => setExpandedUserId(isExpanded ? null : match.user_id)}>
                        {isExpanded ? 'Hide' : 'Details'}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && <div className="mt-3 pt-3 border-t space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Skill Match Details</p>
                      {match.skill_details.map((detail, idx) => <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {detail.skill_name} → {detail.subskill_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant={detail.matches ? 'default' : 'destructive'} className="text-xs">
                              {detail.user_rating.toUpperCase()} / {detail.required_rating.toUpperCase()}
                            </Badge>
                            {detail.matches ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                          </div>
                        </div>)}
                    </div>}
                </div>
              </div>;
        })}
        </div>
      </div>
    </div>;
}