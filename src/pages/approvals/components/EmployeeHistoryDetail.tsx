import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle, XCircle } from "lucide-react";
import type { GroupedHistoricalApproval } from "../hooks/useApprovalHistory";

interface EmployeeHistoryDetailProps {
  employee: GroupedHistoricalApproval | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmployeeHistoryDetail = ({
  employee,
  open,
  onOpenChange
}: EmployeeHistoryDetailProps) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  if (!employee) return null;

  // Group ratings by category
  const ratingsByCategory = employee.ratings.reduce((acc, rating) => {
    const categoryName = rating.skill?.skill_categories?.name || 'Uncategorized';
    
    if (!acc[categoryName]) {
      acc[categoryName] = {
        name: categoryName,
        color: rating.skill?.skill_categories?.color || '#3B82F6',
        ratings: []
      };
    }
    acc[categoryName].ratings.push(rating);
    return acc;
  }, {} as Record<string, { name: string; color: string; ratings: typeof employee.ratings }>);

  const categoryEntries = Object.values(ratingsByCategory).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  const toggleCategory = (categoryName: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'high':
        return 'bg-emerald-500 text-white';
      case 'medium':
        return 'bg-amber-500 text-white';
      case 'low':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'approved' 
      ? <CheckCircle className="h-4 w-4 text-emerald-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'approved'
      ? 'bg-emerald-500 text-white'
      : 'bg-red-500 text-white';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Approval History - {employee.employeeName}</DialogTitle>
          <DialogDescription>
            View {employee.totalCount} historical skill rating{employee.totalCount > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-2">
            {categoryEntries.map((category) => (
              <div key={category.name} className="border rounded-lg">
                <Collapsible
                  open={openCategories[category.name] === true}
                  onOpenChange={() => toggleCategory(category.name)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform ${
                            openCategories[category.name] ? 'rotate-180' : ''
                          }`}
                        />
                        <div 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <h3 className="font-semibold">{category.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {category.ratings.length} subskill{category.ratings.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="space-y-2 p-3 pt-0">
                      {category.ratings.map((rating) => {
                        const skillName = rating.skill?.name || '';
                        const subskillName = rating.subskill?.name || skillName;
                        const displayName = rating.subskill ? `${skillName} - ${subskillName}` : skillName;
                        
                        return (
                          <div key={rating.id} className="border rounded-lg p-3 bg-card space-y-2">
                            {/* Header with subskill name, rating, and status */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h4 className="font-medium text-sm flex-1">{displayName}</h4>
                              <div className="flex items-center gap-1.5">
                                {rating.approved_at && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(rating.approved_at).toLocaleDateString()} at {new Date(rating.approved_at).toLocaleTimeString()}
                                  </span>
                                )}
                                <Badge className={`${getRatingColor(rating.rating)} text-xs`}>
                                  {rating.rating.toUpperCase()}
                                </Badge>
                                <Badge className={`${getStatusColor(rating.status)} text-xs`}>
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(rating.status)}
                                    {rating.status === 'approved' ? 'Approved' : 'Rejected'}
                                  </span>
                                </Badge>
                              </div>
                            </div>

                            {/* Employee Comment - Inline */}
                            {rating.self_comment && (
                              <div className="text-sm">
                                <span className="font-bold text-muted-foreground">Employee Comment ({employee.employeeName}): </span>
                                <span className="text-foreground">{rating.self_comment}</span>
                              </div>
                            )}

                            {/* Approver Info and Comment - Inline */}
                            <div className="text-sm">
                              <span className="font-bold text-muted-foreground">
                                {rating.status === 'approved' ? 'Approved by' : 'Rejected by'} {rating.approver?.full_name || 'Unknown'}
                                {rating.approver_comment && ': '}
                              </span>
                              {rating.approver_comment && (
                                <span className={rating.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                  {rating.approver_comment}
                                </span>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
