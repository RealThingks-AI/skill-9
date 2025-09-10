import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Target, TrendingUp, Users } from "lucide-react";
import type { EmployeeRating, Skill } from "@/types/database";

interface PendingRatingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  ratings: EmployeeRating[];
  skills: Skill[];
  subskills?: any[];
}

export const PendingRatingsModal = ({
  open,
  onOpenChange,
  categoryName,
  ratings,
  skills,
  subskills = []
}: PendingRatingsModalProps) => {
  const pendingRatings = ratings.filter(rating => rating.status === 'submitted');

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'high':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Users className="h-4 w-4 text-blue-500" />;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            {categoryName} - Pending Skills
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3">
            {pendingRatings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending skills found for this category.
              </div>
            ) : (
              pendingRatings.map((rating) => (
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
                    <div className="text-xs text-yellow-600 mt-1">
                      Submitted: {new Date(rating.submitted_at || rating.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRatingIcon(rating.rating)}
                    <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600">
                      Pending {rating.rating}
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