import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Plus, Edit, Trash2 } from "lucide-react";
import { RatingPill } from "@/components/common/RatingPill";
import { SubskillRow } from "./SubskillRow";
import { AddSubskillModal } from "./admin/AddSubskillModal";
import { cn } from "@/lib/utils";
import type { Skill, Subskill, UserSkill } from "@/types/database";
interface SkillRowProps {
  skill: Skill;
  subskills: Subskill[];
  userSkills: UserSkill[];
  pendingRatings: Map<string, { type: 'skill' | 'subskill', id: string, rating: 'high' | 'medium' | 'low' }>;
  isManagerOrAbove: boolean;
  onClick?: () => void;
  onSkillRate: (skillId: string, rating: 'high' | 'medium' | 'low') => void;
  onSubskillRate: (subskillId: string, rating: 'high' | 'medium' | 'low') => void;
  onRefresh: () => void;
  onEditSkill?: () => void;
  onDeleteSkill?: () => void;
}
export const SkillRow = ({
  skill,
  subskills,
  userSkills,
  pendingRatings,
  isManagerOrAbove,
  onClick,
  onSkillRate,
  onSubskillRate,
  onRefresh,
  onEditSkill,
  onDeleteSkill
}: SkillRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddSubskill, setShowAddSubskill] = useState(false);
  const hasSubskills = subskills.length > 0;
  
  // Get current rating from pending ratings or saved ratings
  const getCurrentSkillRating = () => {
    const pending = pendingRatings.get(skill.id);
    if (pending && pending.type === 'skill') return pending.rating;
    return userSkills.find(us => us.skill_id === skill.id && !us.subskill_id)?.rating as 'high' | 'medium' | 'low' | null;
  };
  
  const userSkillRating = getCurrentSkillRating();
  const userSkillStatus = userSkills.find(us => us.skill_id === skill.id && !us.subskill_id)?.status;
  return <div className="border rounded-lg p-3 bg-card hover:shadow-md transition-all cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
           {hasSubskills}
          
          <div className="flex-1">
            <h4 className="font-medium text-sm">{skill.name}</h4>
            {skill.description}
          </div>

          {/* Only show rating for skills without subskills */}
          {!hasSubskills && <div onClick={e => e.stopPropagation()}>
              <RatingPill rating={userSkillRating} onRatingChange={rating => onSkillRate(skill.id, rating)} disabled={userSkillStatus === 'submitted' || userSkillStatus === 'approved'} className="ml-auto" />
            </div>}
        </div>

        {isManagerOrAbove && <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={e => {
          e.stopPropagation();
          setShowAddSubskill(true);
        }} className="p-1 h-auto">
              <Plus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={e => {
          e.stopPropagation();
          onEditSkill?.();
        }} className="p-1 h-auto">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={e => {
          e.stopPropagation();
          onDeleteSkill?.();
        }} className="p-1 h-auto">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>}
      </div>

      {hasSubskills && <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent>
            <div className="mt-3 ml-6 space-y-2">
              {subskills.map(subskill => (
                <SubskillRow 
                  key={subskill.id} 
                  subskill={subskill} 
                  userSkills={userSkills} 
                  pendingRatings={pendingRatings}
                  isManagerOrAbove={isManagerOrAbove} 
                  onSubskillRate={onSubskillRate} 
                  onRefresh={onRefresh} 
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>}

      <AddSubskillModal open={showAddSubskill} onOpenChange={setShowAddSubskill} skillId={skill.id} onSuccess={() => {
      setShowAddSubskill(false);
      onRefresh();
    }} />
    </div>;
};