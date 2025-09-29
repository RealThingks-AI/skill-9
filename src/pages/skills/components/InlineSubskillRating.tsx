import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RatingPill } from "@/components/common/RatingPill";
import { canUpgradeRating, getAvailableRatingOptions } from "@/pages/skills/utils/skillHelpers";
import type { Subskill, EmployeeRating } from "@/types/database";

interface InlineSubskillRatingProps {
  subskill: Subskill;
  userSkills: EmployeeRating[];
  pendingRatings: Map<string, { type: 'skill' | 'subskill', id: string, rating: 'high' | 'medium' | 'low' }>;
  onSubskillRate: (subskillId: string, rating: 'high' | 'medium' | 'low') => void;
  onCommentChange: (subskillId: string, comment: string) => void;
  comment: string;
}

export const InlineSubskillRating = ({
  subskill,
  userSkills,
  pendingRatings,
  onSubskillRate,
  onCommentChange,
  comment
}: InlineSubskillRatingProps) => {
  // Get current rating from pending ratings or saved ratings
  const getCurrentRating = () => {
    const pending = pendingRatings.get(subskill.id);
    if (pending && pending.type === 'subskill') return pending.rating;
    return userSkills.find(us => us.subskill_id === subskill.id)?.rating as 'high' | 'medium' | 'low' | null;
  };
  
  const userSkillRating = getCurrentRating();
  const userSkillEntry = userSkills.find(us => us.subskill_id === subskill.id);
  const userSkillStatus = userSkillEntry?.status;
  const approvedComment = userSkillEntry?.approver_comment;
  const nextUpgradeDate = userSkillEntry?.next_upgrade_date;
  
  // Check progression rules
  const upgradeCheck = canUpgradeRating(userSkillRating, 'high', userSkillStatus || 'draft', nextUpgradeDate);
  const availableRatings = getAvailableRatingOptions(userSkillRating, userSkillStatus || 'draft', nextUpgradeDate);
  
  // Determine if rating is disabled - rejected ratings should be editable for resubmission
  const isSubmittedOrPending = userSkillStatus === 'submitted';
  const isHighAndApproved = userSkillRating === 'high' && userSkillStatus === 'approved';
  const isInCoolDown = userSkillStatus === 'approved' && !upgradeCheck.canUpgrade && !!upgradeCheck.daysLeft;
  const isDisabled = isSubmittedOrPending || isHighAndApproved || isInCoolDown;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success text-success-foreground border-success';
      case 'submitted':
        return 'bg-warning text-warning-foreground border-warning';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground border-destructive';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'submitted':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Draft';
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg bg-card/50">
      {/* Subskill Name and Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {subskill.name}
          </h5>
          {userSkillStatus && (
            <Badge variant="secondary" className={`text-xs ${getStatusColor(userSkillStatus)}`}>
              {getStatusLabel(userSkillStatus)}
            </Badge>
          )}
          {isHighAndApproved && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
              🔒 Locked
            </Badge>
          )}
        </div>
        {subskill.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
            {subskill.description}
          </p>
        )}
        {isInCoolDown && upgradeCheck.reason && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            {upgradeCheck.reason}
          </p>
        )}
      </div>

      {/* Rating Pills */}
      <div className="flex items-center justify-center min-w-fit">
        <RatingPill
          rating={userSkillRating}
          onRatingChange={(rating) => {
            const upgradeCheck = canUpgradeRating(userSkillRating, rating, userSkillStatus || 'draft', nextUpgradeDate);
            if (upgradeCheck.canUpgrade) {
              onSubskillRate(subskill.id, rating);
            }
          }}
          disabled={isDisabled}
          availableRatings={availableRatings}
          className="justify-center"
        />
      </div>

      {/* Comment Input */}
      <div className="flex-1 max-w-sm">
        <Input
          placeholder={approvedComment ? approvedComment : "Add your comment..."}
          value={userSkillStatus === 'rejected' ? comment : (approvedComment || comment)}
          onChange={(e) => onCommentChange(subskill.id, e.target.value)}
          disabled={isDisabled || (!!approvedComment && userSkillStatus !== 'rejected')}
          className="text-sm h-8 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
        />
      </div>
    </div>
  );
};