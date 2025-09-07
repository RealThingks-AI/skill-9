import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { RatingPill } from "@/components/common/RatingPill";
import type { Subskill, EmployeeRating } from "@/types/database";

interface SubskillRowProps {
  subskill: Subskill;
  userSkills: EmployeeRating[];
  pendingRatings: Map<string, { type: 'skill' | 'subskill', id: string, rating: 'high' | 'medium' | 'low' }>;
  isManagerOrAbove: boolean;
  onSubskillRate: (subskillId: string, rating: 'high' | 'medium' | 'low') => void;
  onRefresh: () => void;
  onEditSubskill?: () => void;
  onDeleteSubskill?: () => void;
}

export const SubskillRow = ({
  subskill,
  userSkills,
  pendingRatings,
  isManagerOrAbove,
  onSubskillRate,
  onRefresh,
  onEditSubskill,
  onDeleteSubskill
}: SubskillRowProps) => {
  // Get current rating from pending ratings or saved ratings
  const getCurrentRating = () => {
    const pending = pendingRatings.get(subskill.id);
    if (pending && pending.type === 'subskill') return pending.rating;
    return userSkills.find(us => us.subskill_id === subskill.id)?.rating as 'high' | 'medium' | 'low' | null;
  };
  
  const userSkillRating = getCurrentRating();

  return (
    <div className="flex items-center justify-between p-2 border rounded bg-muted/30">
      <div className="flex-1">
        <h5 className="text-sm font-medium">{subskill.name}</h5>
        {subskill.description && (
          <p className="text-xs text-muted-foreground mt-1">{subskill.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <RatingPill
          rating={userSkillRating}
          onRatingChange={(rating) => onSubskillRate(subskill.id, rating)}
        />

        {isManagerOrAbove && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEditSubskill} className="p-1 h-auto">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDeleteSubskill} className="p-1 h-auto">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};