import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
interface EmployeeRating {
  id: string;
  user_id: string;
  skill_id: string;
  subskill_id?: string;
  rating: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  submitted_at?: string;
  created_at: string;
  employee_name?: string;
  skill_name?: string;
  subskill_name?: string;
  category_name?: string;
  approver_name?: string;
}
interface AdminRatingsDrilldownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  ratingType: 'high' | 'medium' | 'low' | 'pending';
  records: EmployeeRating[];
}
export const AdminRatingsDrilldownModal = ({
  open,
  onOpenChange,
  categoryName,
  ratingType,
  records
}: AdminRatingsDrilldownModalProps) => {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [expandedSubskills, setExpandedSubskills] = useState<Set<string>>(new Set());

  // Group data: Skill → Subskills → Users
  const hierarchicalData = useMemo(() => {
    const filteredRecords = records;

    // Group by skill
    const skillsMap = new Map<string, {
      skillId: string;
      skillName: string;
      subskills: Map<string, EmployeeRating[]>;
      directUsers: EmployeeRating[]; // For skills without subskills
    }>();
    filteredRecords.forEach(record => {
      const skillKey = record.skill_id;
      const skillName = record.skill_name || 'Unknown Skill';
      if (!skillsMap.has(skillKey)) {
        skillsMap.set(skillKey, {
          skillId: skillKey,
          skillName,
          subskills: new Map(),
          directUsers: []
        });
      }
      const skillData = skillsMap.get(skillKey)!;
      if (record.subskill_id && record.subskill_name) {
        // Has subskill
        const subskillKey = record.subskill_id;
        if (!skillData.subskills.has(subskillKey)) {
          skillData.subskills.set(subskillKey, []);
        }
        skillData.subskills.get(subskillKey)!.push(record);
      } else {
        // Direct skill rating (no subskill)
        skillData.directUsers.push(record);
      }
    });
    return Array.from(skillsMap.values()).sort((a, b) => a.skillName.localeCompare(b.skillName));
  }, [records]);
  const toggleSkill = (skillId: string) => {
    setExpandedSkills(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };
  const toggleSubskill = (subskillId: string) => {
    setExpandedSubskills(prev => {
      const next = new Set(prev);
      if (next.has(subskillId)) {
        next.delete(subskillId);
      } else {
        next.add(subskillId);
      }
      return next;
    });
  };
  const getRatingBadgeColor = (rating: string) => {
    switch (rating) {
      case 'high':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'low':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'submitted':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };
  const title = ratingType === 'pending' ? `Pending Ratings - ${categoryName}` : `${ratingType.charAt(0).toUpperCase() + ratingType.slice(1)} Ratings - ${categoryName}`;
  const totalCount = records.length;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[67.5vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalCount} rating{totalCount !== 1 ? 's' : ''} found
          </p>
        </DialogHeader>

        <div className="space-y-3">
          {/* 3-Level Hierarchical View */}
          <ScrollArea className="h-[calc(90vh-140px)] pr-4">
            <div className="space-y-1.5">
              {hierarchicalData.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">
                  No records found
                </div> : hierarchicalData.map(skillData => {
              const isSkillExpanded = expandedSkills.has(skillData.skillId);
              const subskillsArray = Array.from(skillData.subskills.entries());
              const totalSkillRatings = skillData.directUsers.length + subskillsArray.reduce((sum, [_, users]) => sum + users.length, 0);
              return <div key={skillData.skillId} className="border border-border rounded-lg overflow-hidden">
                      {/* Level 1: Skill */}
                      <Collapsible open={isSkillExpanded} onOpenChange={() => toggleSkill(skillData.skillId)}>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-2.5 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-2">
                              {isSkillExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-sm text-foreground">{skillData.skillName}</div>
                                <div className="text-xs text-muted-foreground">
                                  ({subskillsArray.length > 0 ? `${subskillsArray.length} subskill${subskillsArray.length !== 1 ? 's' : ''}` : 'No subskills'})
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs font-semibold">
                              {totalSkillRatings}
                            </Badge>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="p-2.5 space-y-1.5 bg-background">
                            {/* Direct skill ratings (no subskills) */}
                            {skillData.directUsers.length > 0 && <div className="space-y-1.5 mb-2">
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  Direct Ratings ({skillData.directUsers.length})
                                </div>
                                {skillData.directUsers.map(user => <div key={user.id} className="pl-6 p-3 rounded-md border border-border bg-card">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="font-medium text-base text-foreground">
                                          {user.employee_name || 'Unknown Employee'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {user.status === 'approved' && user.approved_at && <>Approved: {format(new Date(user.approved_at), 'MMM d, yyyy')}</>}
                                          {user.status === 'submitted' && user.submitted_at && <>Submitted: {format(new Date(user.submitted_at), 'MMM d, yyyy')}</>}
                                          {user.approver_name && ` • ${user.approver_name}`}
                                        </div>
                                      </div>
                                      <div className="flex gap-1.5">
                                        <Badge className={`${getRatingBadgeColor(user.rating)} text-xs`}>
                                          {user.rating.toUpperCase()}
                                        </Badge>
                                        <Badge className={`${getStatusBadgeColor(user.status)} text-xs`}>
                                          {user.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>)}
                              </div>}

                            {/* Level 2: Subskills */}
                            {subskillsArray.map(([subskillId, users]) => {
                        const isSubskillExpanded = expandedSubskills.has(subskillId);
                        const subskillName = users[0]?.subskill_name || 'Unknown Subskill';
                        return <div key={subskillId} className="border border-border rounded-md overflow-hidden">
                                  <Collapsible open={isSubskillExpanded} onOpenChange={() => toggleSubskill(subskillId)}>
                                    <CollapsibleTrigger className="w-full">
                                      <div className="flex items-center justify-between p-2 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-1.5">
                                          {isSubskillExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                                          <div className="font-medium text-foreground text-xs">{subskillName}</div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {users.length}
                                        </Badge>
                                      </div>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                      <div className="p-2 space-y-1.5 bg-background">
                                        {/* Level 3: Users */}
                                        {users.map(user => <div key={user.id} className="pl-4 p-3 rounded-md border border-border bg-card">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-3">
                                                <div className="font-medium text-foreground text-base">
                                                  {user.employee_name || 'Unknown Employee'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                  {user.status === 'approved' && user.approved_at && <>Approved: {format(new Date(user.approved_at), 'MMM d, yyyy')}</>}
                                                  {user.status === 'submitted' && user.submitted_at && <>Submitted: {format(new Date(user.submitted_at), 'MMM d, yyyy')}</>}
                                                  {user.approver_name && ` • ${user.approver_name}`}
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <Badge className={`${getRatingBadgeColor(user.rating)} text-xs`}>
                                                  {user.rating.toUpperCase()}
                                                </Badge>
                                                <Badge className={`${getStatusBadgeColor(user.status)} text-xs`}>
                                                  {user.status}
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>)}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                </div>;
                      })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>;
            })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>;
};