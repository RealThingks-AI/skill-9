import { useState, useEffect } from 'react';
import { projectService } from '../../services/projectService';
import { AllocationHistory } from '../../types/projects';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectHistoryTabProps {
  projectId: string;
}

export default function ProjectHistoryTab({ projectId }: ProjectHistoryTabProps) {
  const [history, setHistory] = useState<AllocationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [projectId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllocationHistory(projectId);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Allocation Changes</h3>

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No allocation changes yet</p>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => {
            const isIncrease = entry.previous_allocation && entry.new_allocation > entry.previous_allocation;
            const isDecrease = entry.previous_allocation && entry.new_allocation < entry.previous_allocation;

            return (
              <div key={entry.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium">{entry.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Changed by: {entry.changed_by_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.previous_allocation !== null && (
                      <>
                        <span className="text-sm text-muted-foreground">{entry.previous_allocation}%</span>
                        {isIncrease && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {isDecrease && <TrendingDown className="h-4 w-4 text-red-600" />}
                      </>
                    )}
                    <Badge>{entry.new_allocation}%</Badge>
                  </div>
                </div>

                {entry.change_reason && (
                  <p className="text-sm text-muted-foreground mt-2">{entry.change_reason}</p>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
