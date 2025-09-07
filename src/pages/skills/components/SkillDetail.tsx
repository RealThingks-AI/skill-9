import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RatingPill } from "@/components/common/RatingPill";
import type { Skill, Subskill, EmployeeRating } from "@/types/database";
interface SkillDetailProps {
  skill: Skill;
  subskills: Subskill[];
  userSkills: EmployeeRating[];
  pendingRatings: Map<string, { type: 'skill' | 'subskill', id: string, rating: 'high' | 'medium' | 'low' }>;
  isManagerOrAbove: boolean;
  onSkillRate: (skillId: string, rating: 'high' | 'medium' | 'low') => void;
  onSubskillRate: (subskillId: string, rating: 'high' | 'medium' | 'low') => void;
  onSaveRatings: () => void;
  onRefresh: () => void;
}
export const SkillDetail = ({
  skill,
  subskills,
  userSkills,
  pendingRatings,
  isManagerOrAbove,
  onSkillRate,
  onSubskillRate,
  onSaveRatings,
  onRefresh
}: SkillDetailProps) => {
  const [expandedSubskills, setExpandedSubskills] = useState(true);
  const hasSubskills = subskills.length > 0;
  
  // Get current rating from pending ratings or saved ratings
  const getCurrentSkillRating = () => {
    const pending = pendingRatings.get(skill.id);
    if (pending && pending.type === 'skill') return pending.rating;
    return userSkills.find(us => us.skill_id === skill.id && !us.subskill_id)?.rating as 'high' | 'medium' | 'low' | null;
  };
  
  const getCurrentSubskillRating = (subskillId: string) => {
    const pending = pendingRatings.get(subskillId);
    if (pending && pending.type === 'subskill') return pending.rating;
    return userSkills.find(us => us.subskill_id === subskillId)?.rating as 'high' | 'medium' | 'low' | null;
  };
  
  const userSkillRating = getCurrentSkillRating();
  const userSkillStatus = userSkills.find(us => us.skill_id === skill.id && !us.subskill_id)?.status;
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'draft':
        return 'bg-amber-100 text-amber-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  const getAverageRating = () => {
    if (!hasSubskills) return null;
    const ratings = subskills.map(subskill => {
      const userSkill = userSkills.find(us => us.subskill_id === subskill.id);
      return userSkill?.rating;
    }).filter(Boolean);
    if (ratings.length === 0) return null;
    const ratingValues = ratings.map(rating => {
      switch (rating) {
        case 'high':
          return 3;
        case 'medium':
          return 2;
        case 'low':
          return 1;
        default:
          return 0;
      }
    });
    const average = ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length;
    if (average >= 2.5) return 'high';
    if (average >= 1.5) return 'medium';
    return 'low';
  };
  const averageRating = getAverageRating();
  return <ScrollArea className="h-[600px]">
      <div className="p-6 space-y-6">
        {/* Skill Header */}
        

        {/* Direct Skill Rating (if no subskills) */}
        {!hasSubskills && <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Rate this skill</h4>
                  <p className="text-sm text-muted-foreground">
                    How would you rate your proficiency in {skill.name}?
                  </p>
                </div>
                <RatingPill rating={userSkillRating} onRatingChange={rating => onSkillRate(skill.id, rating)} disabled={userSkillStatus === 'submitted' || userSkillStatus === 'approved'} />
              </div>
            </CardContent>
          </Card>}

        {/* Subskills Accordion */}
        {hasSubskills && <Collapsible open={expandedSubskills} onOpenChange={setExpandedSubskills}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-medium text-left">
                <span>Subskills ({subskills.length})</span>
                <motion.div animate={{
              rotate: expandedSubskills ? 90 : 0
            }} transition={{
              duration: 0.2
            }}>
                  <ChevronRight className="h-4 w-4" />
                </motion.div>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <motion.div initial={false} animate={{
            height: expandedSubskills ? "auto" : 0,
            opacity: expandedSubskills ? 1 : 0
          }} transition={{
            duration: 0.2
          }} className="space-y-3 mt-4">
                  {subskills.map((subskill, index) => {
              const userSubskillRating = getCurrentSubskillRating(subskill.id);
              const userSubskillStatus = userSkills.find(us => us.subskill_id === subskill.id)?.status;
              return <motion.div key={subskill.id} initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.2,
                delay: index * 0.05
              }}>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-medium text-foreground">
                                    {subskill.name}
                                  </h5>
                                  {userSubskillStatus && <Badge variant="secondary" className={`text-xs ${getStatusColor(userSubskillStatus)}`}>
                                      {userSubskillStatus}
                                    </Badge>}
                                </div>
                                {subskill.description && <p className="text-sm text-muted-foreground">
                                    {subskill.description}
                                  </p>}
                              </div>
                              <RatingPill rating={userSubskillRating} onRatingChange={rating => onSubskillRate(subskill.id, rating)} disabled={userSubskillStatus === 'submitted' || userSubskillStatus === 'approved'} />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>;
            })}
              </motion.div>
            </CollapsibleContent>
          </Collapsible>}

        {/* Save Ratings Button */}
        {!isManagerOrAbove && pendingRatings.size > 0 && (
          <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t p-4 -m-6 mt-6">
            <Button onClick={onSaveRatings} className="w-full bg-green-600 hover:bg-green-700 text-white">
              Save Ratings ({pendingRatings.size})
            </Button>
          </div>
        )}

        {/* Tech Lead Actions would go here */}
        {/* TODO: Add approval/rejection controls for tech leads */}
      </div>
    </ScrollArea>;
};