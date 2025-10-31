import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History, Loader2 } from 'lucide-react';
import { resourceService, ResourceAllocation, UserProject, ProjectHistory } from '../services/resourceService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { dateFormatters } from '@/utils/formatters';
interface ResourceInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export default function ResourceInsightsModal({
  open,
  onOpenChange
}: ResourceInsightsModalProps) {
  const [resources, setResources] = useState<ResourceAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ResourceAllocation | null>(null);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [projectHistory, setProjectHistory] = useState<ProjectHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [view, setView] = useState<'list' | 'detail' | 'history'>('list');
  useEffect(() => {
    if (open) {
      loadResources();

      // Set up real-time subscription
      const channel = supabase.channel('resource-changes').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_assignments'
      }, () => {
        loadResources();
        if (selectedUser) {
          loadUserProjects(selectedUser.user_id);
        }
      }).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects'
      }, () => {
        loadResources();
        if (selectedUser) {
          loadUserProjects(selectedUser.user_id);
        }
      }).subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, selectedUser]);
  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getAllResourceAllocations();
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
      toast.error('Failed to load resource data');
    } finally {
      setLoading(false);
    }
  };
  const loadUserProjects = async (userId: string) => {
    try {
      const data = await resourceService.getUserCurrentProjects(userId);
      setUserProjects(data);
    } catch (error) {
      console.error('Error loading user projects:', error);
      toast.error('Failed to load user projects');
    }
  };
  const loadUserHistory = async (userId: string) => {
    try {
      setLoading(true);
      const data = await resourceService.getUserProjectHistory(userId);
      setProjectHistory(data);
      setView('history');
    } catch (error) {
      console.error('Error loading project history:', error);
      toast.error('Failed to load project history');
    } finally {
      setLoading(false);
    }
  };
  const handleUserClick = async (resource: ResourceAllocation) => {
    setSelectedUser(resource);
    await loadUserProjects(resource.user_id);
    setView('detail');
  };
  const handleBack = () => {
    if (view === 'history') {
      setView('detail');
      setShowHistory(false);
    } else {
      setView('list');
      setSelectedUser(null);
      setUserProjects([]);
      setProjectHistory([]);
    }
  };
  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
  };
  const getAllocationColor = (allocation: number) => {
    if (allocation >= 100) return 'text-red-600 dark:text-red-400';
    if (allocation >= 75) return 'text-orange-600 dark:text-orange-400';
    return 'text-foreground';
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {view !== 'list' && <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>}
            <DialogTitle>
              {view === 'list' && 'Resource Insights'}
              {view === 'detail' && `${selectedUser?.full_name} - Current Projects`}
              {view === 'history' && `${selectedUser?.full_name} - Project History`}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && view === 'list' ? <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div> : <>
              {view === 'list' && <div className="space-y-2">
                  {resources.map(resource => <div key={resource.user_id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors" onClick={() => handleUserClick(resource)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{resource.full_name}</p>
                          
                        </div>
                        
                      </div>

                      <div className="flex items-center gap-6 ml-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Projects</p>
                          <p className="font-semibold">{resource.active_projects_count}</p>
                        </div>
                        <div className="w-32">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Allocation</span>
                            <span className={`text-sm font-semibold ${getAllocationColor(resource.total_allocation)}`}>
                              {resource.total_allocation}%
                            </span>
                          </div>
                          <Progress value={resource.total_allocation} className="h-2" />
                        </div>
                      </div>
                    </div>)}
                  {resources.length === 0 && <div className="text-center py-12">
                      <p className="text-muted-foreground">No resources found</p>
                    </div>}
                </div>}

              {view === 'detail' && selectedUser && <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Allocation</p>
                      <p className={`text-2xl font-bold ${getAllocationColor(selectedUser.total_allocation)}`}>
                        {selectedUser.total_allocation}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available Capacity</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedUser.available_capacity}%
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => loadUserHistory(selectedUser.user_id)}>
                      <History className="mr-2 h-4 w-4" />
                      View History
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Active Projects</h3>
                    {userProjects.length > 0 ? userProjects.map(project => <div key={project.project_id} className="p-3 rounded-lg border space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{project.project_name}</p>
                              {(project.start_date || project.end_date) && <p className="text-xs text-muted-foreground mt-1">
                                  {project.start_date ? dateFormatters.formatDate(project.start_date) : 'TBD'} → {project.end_date ? dateFormatters.formatDate(project.end_date) : 'Ongoing'}
                                </p>}
                            </div>
                            <Badge className={getStatusColor(project.project_status)}>
                              {project.project_status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Progress value={project.allocation_percentage} className="h-2" />
                            </div>
                            <span className="text-sm font-semibold whitespace-nowrap">
                              {project.allocation_percentage}%
                            </span>
                          </div>
                        </div>) : <div className="text-center py-8">
                        <p className="text-muted-foreground">No active projects</p>
                      </div>}
                  </div>
                </div>}

              {view === 'history' && selectedUser && <div className="space-y-3">
                  {loading ? <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div> : projectHistory.length > 0 ? projectHistory.map((history, index) => <div key={`${history.project_id}-${index}`} className="p-3 rounded-lg border space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{history.project_name}</p>
                              {history.project_status && <Badge variant={history.project_status === 'completed' ? 'outline' : 'secondary'} className="text-xs">
                                  {history.project_status}
                                </Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Assigned: {dateFormatters.formatDate(history.assigned_at)}
                            </p>
                            {(history.start_date || history.end_date) && <p className="text-xs text-muted-foreground">
                                Period: {history.start_date ? dateFormatters.formatDate(history.start_date) : 'TBD'} → {history.end_date ? dateFormatters.formatDate(history.end_date) : 'Ongoing'}
                              </p>}
                          </div>
                          <span className="text-sm font-semibold whitespace-nowrap">
                            {history.allocation_percentage}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Changed by: {history.changed_by_name}</p>
                          {history.change_reason && <p>Reason: {history.change_reason}</p>}
                        </div>
                      </div>) : <div className="text-center py-12">
                      <p className="text-muted-foreground">No project history found</p>
                    </div>}
                </div>}
            </>}
        </div>
      </DialogContent>
    </Dialog>;
}