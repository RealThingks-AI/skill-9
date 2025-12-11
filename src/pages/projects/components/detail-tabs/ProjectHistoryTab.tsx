import { useState, useEffect } from 'react';
import { projectService } from '../../services/projectService';
import { AllocationHistory } from '../../types/projects';
import { Loader2, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
interface ProjectHistoryTabProps {
  projectId: string;
  isEmployeeView?: boolean;
}
export default function ProjectHistoryTab({
  projectId,
  isEmployeeView = false
}: ProjectHistoryTabProps) {
  const [history, setHistory] = useState<AllocationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadHistory();
  }, [projectId, isEmployeeView]);
  const loadHistory = async () => {
    try {
      setLoading(true);
      // For employee view, only show their own history
      let filterForEmployeeId: string | undefined;
      if (isEmployeeView) {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        filterForEmployeeId = user?.id;
      }
      const data = await projectService.getAllocationHistory(projectId, filterForEmployeeId);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>;
  }
  return <div className="space-y-4">
      <h3 className="font-semibold">Allocation Changes</h3>

      {history.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No allocation changes yet</p> : <div className="space-y-3">
          {history.map(entry => {
        const isNewMember = entry.previous_allocation === null;
        const isProjectUpdate = entry.previous_allocation === 0 && entry.new_allocation === 0;
        const isMemberRemoved = entry.previous_allocation !== null && entry.previous_allocation > 0 && entry.new_allocation === 0;
        const isIncrease = entry.previous_allocation !== null && entry.new_allocation > entry.previous_allocation;
        const isDecrease = entry.previous_allocation !== null && entry.new_allocation < entry.previous_allocation && !isMemberRemoved;
        
        return <div key={entry.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entry.full_name}</p>
                    <p className="text-xs text-muted-foreground">by {entry.changed_by_name} • {new Date(entry.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isProjectUpdate ? (
                      <Badge variant="outline" className="text-xs">Project Update</Badge>
                    ) : isNewMember ? (
                      <Badge variant="default" className="text-xs bg-green-500">New: {entry.new_allocation}%</Badge>
                    ) : isMemberRemoved ? (
                      <>
                        <span className="text-xs text-muted-foreground">{entry.previous_allocation}%</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="destructive" className="text-xs">Removed</Badge>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-muted-foreground">{entry.previous_allocation}%</span>
                        {isIncrease && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {isDecrease && <TrendingDown className="h-3 w-3 text-red-500" />}
                        {!isIncrease && !isDecrease && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                        <Badge variant="secondary" className="text-xs">{entry.new_allocation}%</Badge>
                      </>
                    )}
                  </div>
                </div>
                {entry.change_reason && <p className="text-xs text-muted-foreground mt-1.5 truncate">{entry.change_reason}</p>}
              </div>;
      })}
        </div>}
    </div>;
}