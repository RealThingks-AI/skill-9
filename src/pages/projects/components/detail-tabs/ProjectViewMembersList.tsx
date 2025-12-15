import { Project } from '../../types/projects';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Users, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { dateFormatters } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
interface ProjectViewMembersListProps {
  project: Project;
  onEditMember?: (userId: string) => void;
  onRemoveMember?: (userId: string) => void;
  readOnly?: boolean;
}
type ViewMode = 'user' | 'month';
export default function ProjectViewMembersList({
  project,
  onEditMember,
  onRemoveMember,
  readOnly = false
}: ProjectViewMembersListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('user');
  const [memberToDelete, setMemberToDelete] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Calculate total months assigned for each member
  const membersWithMonthCount = useMemo(() => {
    return project.members.map(member => {
      const activeAllocations = member.monthly_allocations?.filter(ma => ma.allocation_percentage && ma.allocation_percentage > 0) || [];
      return {
        ...member,
        monthCount: activeAllocations.length,
        activeAllocations
      };
    }).sort((a, b) => b.monthCount - a.monthCount);
  }, [project.members]);

  // Group allocations by month
  const monthWiseAllocations = useMemo(() => {
    const monthMap: Record<string, {
      month: string;
      members: {
        user_id: string;
        full_name: string;
        role: string;
        allocation_percentage: number;
      }[];
    }> = {};
    project.members.forEach(member => {
      member.monthly_allocations?.forEach(ma => {
        if (ma.allocation_percentage && ma.allocation_percentage > 0) {
          if (!monthMap[ma.month]) {
            monthMap[ma.month] = {
              month: ma.month,
              members: []
            };
          }
          monthMap[ma.month].members.push({
            user_id: member.user_id,
            full_name: member.full_name,
            role: member.role,
            allocation_percentage: ma.allocation_percentage
          });
        }
      });
    });
    return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  }, [project.members]);
  const hasActions = !readOnly && (onEditMember || onRemoveMember);
  const handleConfirmDelete = () => {
    if (memberToDelete && onRemoveMember) {
      onRemoveMember(memberToDelete.userId);
      setMemberToDelete(null);
    }
  };
  return <div className="flex flex-col">
      <div className="flex-shrink-0 mb-2 flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium">
          Assigned Members ({project.members.length})
        </h3>
        <ToggleGroup type="single" value={viewMode} onValueChange={value => value && setViewMode(value as ViewMode)} className="bg-muted rounded-md p-0.5">
          <ToggleGroupItem value="user" aria-label="User wise" className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:shadow-sm">
            <Users className="h-3.5 w-3.5 mr-1" />
            User
          </ToggleGroupItem>
          <ToggleGroupItem value="month" aria-label="Month wise" className="text-xs px-2.5 py-1 h-7 data-[state=on]:bg-background data-[state=on]:shadow-sm">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Month
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div className="space-y-1.5 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto">
        {viewMode === 'user' ? membersWithMonthCount.length > 0 ? membersWithMonthCount.map(member => {
        const isExpanded = expandedUsers.has(member.user_id);
        return <Collapsible key={member.user_id} open={isExpanded} onOpenChange={() => toggleUserExpanded(member.user_id)}>
                  <div className="border rounded-lg bg-background overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center p-2.5 hover:bg-muted/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 flex-1">
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium text-lg">{member.full_name}</span>
                        </div>
                        <span className="text-muted-foreground flex-1 text-center font-extralight text-base">
                          ({member.monthCount} months)
                        </span>
                        <div className="flex-1 flex justify-end">
                          {hasActions ? <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              {onEditMember && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary" onClick={() => onEditMember(member.user_id)} title="Edit allocation">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>}
                              {onRemoveMember && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setMemberToDelete({
                      userId: member.user_id,
                      name: member.full_name
                    })} title="Remove from project">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>}
                            </div> : <div className="flex items-center gap-1.5 opacity-30">
                              <Pencil className="h-3.5 w-3.5" />
                              <Trash2 className="h-3.5 w-3.5" />
                            </div>}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="border-t bg-muted/20 px-3 py-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Monthly Allocations</div>
                        {member.activeAllocations.length > 0 ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {member.activeAllocations.sort((a, b) => a.month.localeCompare(b.month)).map(alloc => <div key={alloc.month} className="flex items-center justify-between bg-background border rounded px-2.5 py-1.5">
                                  <span className="font-medium text-sm">{dateFormatters.formatMonthYear(alloc.month)}</span>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {alloc.allocation_percentage}%
                                  </Badge>
                                </div>)}
                          </div> : <div className="text-xs text-muted-foreground">No allocations</div>}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>;
      }) : <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No team members assigned
            </div> : monthWiseAllocations.length > 0 ? monthWiseAllocations.map(monthData => <div key={monthData.month} className="border rounded-lg bg-background overflow-hidden">
                <div className="px-3 py-2 bg-muted/50 border-b flex items-center">
                  <span className="font-medium text-sm flex-1">{dateFormatters.formatMonthYear(monthData.month)}</span>
                  <span className="text-muted-foreground flex-1 text-center text-sm">({monthData.members.length} members)</span>
                  <span className="flex-1"></span>
                </div>
                <div className="p-2 space-y-1">
                  {monthData.members.map((member, idx) => <div key={idx} className="flex items-center px-2 py-1.5 rounded hover:bg-muted/30">
                      <span className="flex-1 text-base">{member.full_name}</span>
                      <span className="font-medium text-muted-foreground flex-1 text-center text-sm">{member.allocation_percentage}%</span>
                      <div className="flex-1 flex justify-end">
                        {hasActions && <div className="flex items-center gap-0.5">
                            {onEditMember && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary" onClick={() => onEditMember(member.user_id)} title="Edit allocation">
                                <Pencil className="h-3 w-3" />
                              </Button>}
                            {onRemoveMember && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => setMemberToDelete({
                  userId: member.user_id,
                  name: member.full_name
                })} title="Remove from project">
                                <Trash2 className="h-3 w-3" />
                              </Button>}
                          </div>}
                      </div>
                    </div>)}
                </div>
              </div>) : <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No allocations assigned
            </div>}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={open => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToDelete?.name}</strong> from this project? 
              This will remove all their monthly allocations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}