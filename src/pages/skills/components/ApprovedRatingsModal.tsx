import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, Minus, TrendingDown } from "lucide-react";
import type { EmployeeRating, Skill } from "@/types/database";

interface ApprovedRatingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  ratings: EmployeeRating[];
  skills: Skill[];
  subskills?: any[];
  filterRating?: 'high' | 'medium' | 'low';
}

export const ApprovedRatingsModal = ({
  open,
  onOpenChange,
  categoryName,
  ratings,
  skills,
  subskills = [],
  filterRating
}: ApprovedRatingsModalProps) => {
  // Filter ratings to only include those from skills in this specific category
  const categorySkillIds = skills.map(skill => skill.id);
  const categoryRatings = ratings.filter(rating => 
    categorySkillIds.includes(rating.skill_id)
  );

  const filteredRatings = filterRating 
    ? categoryRatings.filter(rating => rating.status === 'approved' && rating.rating === filterRating)
    : categoryRatings.filter(rating => rating.status === 'approved');

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'high':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'medium':
        return <Minus className="h-4 w-4 text-amber-600" />;
      case 'low':
        return <TrendingDown className="h-4 w-4 text-slate-600" />;
      default:
        return null;
    }
  };

  const getSkillName = (skillId: string, subskillId?: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return 'Unknown Skill';
    
    if (subskillId) {
      const subskill = subskills.find(s => s.id === subskillId);
      return subskill ? `${skill.name} - ${subskill.name}` : skill.name;
    }
    
    return skill.name;
  };

  const title = filterRating 
    ? `${categoryName} - ${filterRating.charAt(0).toUpperCase() + filterRating.slice(1)} Rated Skills`
    : `${categoryName} - All Approved Skills`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {filterRating && getRatingIcon(filterRating)}
            {title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3">
            {filteredRatings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No approved skills found for this category.
              </div>
            ) : (
              filteredRatings.map((rating) => (
                <div
                  key={rating.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {getSkillName(rating.skill_id, rating.subskill_id)}
                    </div>
                    {rating.self_comment && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {rating.self_comment}
                      </div>
                    )}
                     {rating.approver?.full_name && (
                       <div className="text-xs text-blue-600 mt-1">
                         Approver: {rating.approver.full_name}
                       </div>
                     )}
                     {rating.approver_comment && (
                       <div className="text-xs text-muted-foreground mt-1">
                         Comment: {rating.approver_comment}
                       </div>
                     )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getRatingIcon(rating.rating)}
                    <Badge 
                      variant={rating.rating === 'high' ? 'default' : 
                               rating.rating === 'medium' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {rating.rating.charAt(0).toUpperCase() + rating.rating.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};