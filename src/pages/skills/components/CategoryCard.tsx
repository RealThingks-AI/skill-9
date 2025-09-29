import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, TrendingUp, Minus, TrendingDown, Users, Target, X, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { AddCategoryModal } from "./admin/AddCategoryModal";
import { ApprovedRatingsModal } from "./ApprovedRatingsModal";
import { PendingRatingsModal } from "./PendingRatingsModal";
import { RejectedRatingsModal } from "./RejectedRatingsModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SkillsService } from "../services/skills.service";
import { calculateCategoryProgress } from "../utils/skillHelpers";
import type { SkillCategory, EmployeeRating, Skill } from "@/types/database";
interface CategoryCardProps {
  category: SkillCategory;
  skillCount: number;
  isManagerOrAbove: boolean;
  onClick: () => void;
  onRefresh: () => void;
  index: number;
  userSkills?: EmployeeRating[];
  skills?: Skill[];
  subskills?: any[];
  showHideButton?: boolean;
  onHide?: (categoryId: string, categoryName: string) => void;
}
export const CategoryCard = ({
  category,
  skillCount,
  isManagerOrAbove,
  onClick,
  onRefresh,
  index,
  userSkills = [],
  skills = [],
  subskills = [],
  showHideButton = false,
  onHide
}: CategoryCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<'high' | 'medium' | 'low' | undefined>();
  const [showStatusBreakdown, setShowStatusBreakdown] = useState(false);
  const {
    toast
  } = useToast();

  // Calculate user-specific statistics using corrected progress rules
  const progressData = React.useMemo(() => {
    return calculateCategoryProgress(category.id, skills, subskills, userSkills);
  }, [category.id, skills, subskills, userSkills]);
  const {
    totalItems,
    ratedItems,
    progressPercentage,
    ratingCounts,
    approvedCount,
    pendingCount,
    rejectedCount,
    level,
    totalPoints,
    maxPossiblePoints
  } = progressData;

  // Determine status based on level from calculateCategoryProgress
  const statusInfo = React.useMemo(() => {
    if (level === 'expert') return { 
      status: 'Expert', 
      color: 'bg-green-500 text-white', 
      bgTint: 'bg-green-50 border-green-200' 
    };
    if (level === 'moderate') return { 
      status: 'Moderate', 
      color: 'bg-yellow-500 text-white', 
      bgTint: 'bg-yellow-50 border-yellow-200' 
    };
    return { 
      status: 'Beginner', 
      color: 'bg-red-500 text-white', 
      bgTint: 'bg-red-50 border-red-200' 
    };
  }, [level]);

  // Handle status badge click
  const handleStatusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowStatusBreakdown(!showStatusBreakdown);
  };
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditModal(true);
  };
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete button clicked for category:', category.name, category.id);
    if (!confirm(`Are you sure you want to delete "${category.name}"? This will also delete all associated skills and ratings.`)) {
      console.log('Delete cancelled by user');
      return;
    }
    try {
      console.log('Attempting to delete category:', category.id);

      // Enhanced logging to debug the deletion process
      const {
        data: userRole
      } = await supabase.rpc('get_current_user_role');
      console.log('Current user role:', userRole);
      await SkillsService.deleteCategory(category.id);
      console.log('Category deleted successfully');
      toast({
        title: "Category Deleted",
        description: `"${category.name}" has been deleted successfully.`
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting category:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: "Error",
        description: `Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  const handleRatingClick = (rating: 'high' | 'medium' | 'low', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRatingFilter(rating);
    setShowApprovedModal(true);
  };
  const handleApprovedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRatingFilter(undefined);
    setShowApprovedModal(true);
  };
  const handleRejectedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRejectedModal(true);
  };
  const handlePendingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPendingModal(true);
  };
  const handleUpdateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };
  return <>
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} exit={{
      opacity: 0,
      y: -20,
      scale: 0.95
    }} transition={{
      duration: 0.2,
      delay: Math.min(index * 0.05, 0.3),
      ease: "easeOut"
    }} whileHover={{
      y: -8,
      transition: {
        duration: 0.2
      }
    }} className="group">
        <Card className={`relative h-full w-full border border-border/20 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-all duration-300 overflow-hidden rounded-xl ${ratingCounts.high + ratingCounts.medium + ratingCounts.low > 0 ? statusInfo.bgTint : ''}`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
          
          {/* Action Buttons */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-50" onClick={e => e.stopPropagation()}>
            {/* Hide Category Button for Employee/Tech Lead */}
            {showHideButton && onHide && <Button variant="ghost" size="sm" onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onHide(category.id, category.name);
          }} className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 text-destructive border border-border/50" aria-label={`Hide ${category.name}`}>
                <X className="h-3 w-3" />
              </Button>}
            
            {/* Admin Actions */}
            {isManagerOrAbove && <>
                <Button variant="ghost" size="sm" onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleEdit(e);
            }} className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-primary/10 border border-border/50" aria-label={`Edit ${category.name}`}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(e);
            }} className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 text-destructive border border-border/50" aria-label={`Delete ${category.name}`}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>}
          </div>

          <CardHeader className="pb-2 px-4 pt-4">
            <div className="space-y-1">
              <div className="flex items-start justify-between">
                <motion.h3 className="text-2xl font-bold text-foreground line-clamp-2 leading-tight flex-1 pr-2" whileHover={{
                  scale: 1.02
                }} transition={{
                  duration: 0.2
                }}>
                  {category.name}
                </motion.h3>
                
                {/* Status Badge positioned below the action buttons */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {/* Spacer to account for action buttons when shown */}
                  <div className="h-8 w-20" />
                  {ratingCounts.high + ratingCounts.medium + ratingCounts.low > 0 && (
                    <Badge 
                      className={`${statusInfo.color} font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}
                      onClick={handleStatusClick}
                    >
                      {statusInfo.status}
                      {showStatusBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Badge>
                  )}
                </div>
              </div>
              
              {category.description && <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {category.description}
                </p>}
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pt-0 px-4 pb-2 relative z-20 flex flex-col h-full">
            {/* Status Breakdown - Animated */}
            <AnimatePresence>
              {showStatusBreakdown && ratingCounts.high + ratingCounts.medium + ratingCounts.low > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-muted/20 rounded-lg border border-border/30 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Progress Details</span>
                      <span className="text-muted-foreground">{totalPoints}/{maxPossiblePoints} points</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={e => {
              console.log('High button clicked');
              handleRatingClick('high', e);
            }} className="text-center p-4 bg-muted/30 rounded-xl border border-border/30 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer relative z-30 group/rating" type="button">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600 group-hover/rating:text-emerald-700 transition-colors" />
                </div>
                <div className="text-lg font-bold text-foreground group-hover/rating:text-emerald-800 transition-colors">{ratingCounts.high}</div>
                <div className="text-sm text-muted-foreground font-medium group-hover/rating:text-emerald-600 transition-colors">High</div>
              </button>
              
              <button onClick={e => {
              console.log('Medium button clicked');
              handleRatingClick('medium', e);
            }} className="text-center p-4 bg-muted/30 rounded-xl border border-border/30 hover:bg-amber-50 hover:border-amber-200 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer relative z-30 group/rating" type="button">
                <div className="flex items-center justify-center mb-2">
                  <Minus className="h-4 w-4 text-amber-600 group-hover/rating:text-amber-700 transition-colors" />
                </div>
                <div className="text-lg font-bold text-foreground group-hover/rating:text-amber-800 transition-colors">{ratingCounts.medium}</div>
                <div className="text-sm text-muted-foreground font-medium group-hover/rating:text-amber-600 transition-colors">Medium</div>
              </button>
              
              <button onClick={e => {
              console.log('Low button clicked');
              handleRatingClick('low', e);
            }} className="text-center p-4 bg-muted/30 rounded-xl border border-border/30 hover:bg-slate-50 hover:border-slate-200 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer relative z-30 group/rating" type="button">
                <div className="flex items-center justify-center mb-2">
                  <TrendingDown className="h-4 w-4 text-slate-600 group-hover/rating:text-slate-700 transition-colors" />
                </div>
                <div className="text-lg font-bold text-foreground group-hover/rating:text-slate-800 transition-colors">{ratingCounts.low}</div>
                <div className="text-sm text-muted-foreground font-medium group-hover/rating:text-slate-600 transition-colors">Low</div>
              </button>
            </div>

            {/* Footer with Status Pills and Update Button */}
            <div className="mt-auto pt-1">
              <div className="flex items-end justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button onClick={e => {
                  console.log('Approved badge clicked');
                  handleApprovedClick(e);
                }} className="inline-flex items-center rounded-full border px-4 py-1.5 text-base font-semibold transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-105 border-border bg-muted text-foreground relative z-30" type="button">
                    {approvedCount} Approved
                  </button>
                  {pendingCount > 0 && <button onClick={e => {
                  console.log('Pending badge clicked');
                  handlePendingClick(e);
                }} className="inline-flex items-center rounded-full border px-4 py-1.5 text-base font-semibold transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-105 bg-muted/40 text-muted-foreground border-border relative z-30" type="button">
                      {pendingCount} Pending
                    </button>}
                  {rejectedCount > 0 && <button onClick={e => {
                  console.log('Rejected badge clicked');
                  handleRejectedClick(e);
                }} className="inline-flex items-center rounded-full border px-4 py-1.5 text-base font-semibold transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-105 bg-muted/40 text-muted-foreground border-border relative z-30" type="button">
                      {rejectedCount} Rejected
                    </button>}
                </div>
                <Button variant="light" size="sm" onClick={e => {
                console.log('Update button clicked');
                handleUpdateClick(e);
              }} className="h-10 px-6 text-base relative z-40 shrink-0 hover:shadow-lg hover:scale-105 transition-all duration-200 group/update" type="button">
                  <Settings className="h-5 w-5 mr-2 group-hover/update:rotate-90 transition-transform duration-200" />
                  Update
                </Button>
              </div>
            </div>

            {/* Hover indicator */}
            <motion.div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" initial={false} animate={{
            width: "2rem"
          }} />
          </CardContent>

        </Card>
      </motion.div>

      <AddCategoryModal open={showEditModal} onOpenChange={setShowEditModal} category={category} onSuccess={() => {
      setShowEditModal(false);
      onRefresh();
    }} />

      <ApprovedRatingsModal open={showApprovedModal} onOpenChange={setShowApprovedModal} categoryName={category.name} ratings={userSkills} skills={skills.filter(skill => skill.category_id === category.id)} subskills={subskills.filter(subskill => skills.some(skill => skill.id === subskill.skill_id && skill.category_id === category.id))} filterRating={selectedRatingFilter} />

      <PendingRatingsModal open={showPendingModal} onOpenChange={setShowPendingModal} categoryName={category.name} ratings={userSkills} skills={skills.filter(skill => skill.category_id === category.id)} subskills={subskills.filter(subskill => skills.some(skill => skill.id === subskill.skill_id && skill.category_id === category.id))} />

      <RejectedRatingsModal open={showRejectedModal} onOpenChange={setShowRejectedModal} categoryName={category.name} ratings={userSkills} skills={skills.filter(skill => skill.category_id === category.id)} subskills={subskills.filter(subskill => skills.some(skill => skill.id === subskill.skill_id && skill.category_id === category.id))} />
    </>;
};