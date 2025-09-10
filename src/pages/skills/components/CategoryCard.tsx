import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, TrendingUp, Users, Target, X, Settings } from "lucide-react";
import { AddCategoryModal } from "./admin/AddCategoryModal";
import { ApprovedRatingsModal } from "./ApprovedRatingsModal";
import { PendingRatingsModal } from "./PendingRatingsModal";
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
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<'high' | 'medium' | 'low' | undefined>();
  const { toast } = useToast();

  // Calculate user-specific statistics using new progress rules
  const progressData = React.useMemo(() => {
    return calculateCategoryProgress(category.id, skills, subskills, userSkills);
  }, [category.id, skills, subskills, userSkills]);

  const { 
    totalItems, 
    ratedItems, 
    progressPercentage, 
    ratingCounts, 
    approvedCount, 
    pendingCount 
  } = progressData;

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
      const { data: userRole } = await supabase.rpc('get_current_user_role');
      console.log('Current user role:', userRole);
      
      await SkillsService.deleteCategory(category.id);

      console.log('Category deleted successfully');
      toast({
        title: "Category Deleted",
        description: `"${category.name}" has been deleted successfully.`,
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting category:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: "Error",
        description: `Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ 
          duration: 0.2, 
          delay: Math.min(index * 0.05, 0.3),
          ease: "easeOut" 
        }}
        whileHover={{ 
          y: -8,
          transition: { duration: 0.2 }
        }}
        className="group"
      >
        <Card 
          className="relative h-80 w-full border-0 bg-gradient-to-br from-card via-card to-card/90 hover:shadow-2xl transition-all duration-300 overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Action Buttons */}
          <div 
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hide Category Button for Employee/Tech Lead */}
            {showHideButton && onHide && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onHide(category.id, category.name);
                }}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 text-destructive border border-border/50"
                aria-label={`Hide ${category.name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            {/* Admin Actions */}
            {isManagerOrAbove && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEdit(e);
                  }}
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-primary/10 border border-border/50"
                  aria-label={`Edit ${category.name}`}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(e);
                  }}
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 text-destructive border border-border/50"
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>

          <CardHeader className="pb-3">
            <div className="space-y-2">
              <motion.h3 
                className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                {category.name}
              </motion.h3>
              
              {category.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0 relative z-10">
            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={(e) => {
                  console.log('High button clicked');
                  handleRatingClick('high', e);
                }}
                className="text-center p-2 bg-background/50 rounded-lg border border-border/50 hover:bg-background/80 transition-colors cursor-pointer relative z-20"
                type="button"
              >
                <div className="flex items-center justify-center mb-1">
                  <Target className="h-3 w-3 text-green-500" />
                </div>
                <div className="text-xs font-semibold text-foreground">{ratingCounts.high}</div>
                <div className="text-xs text-muted-foreground">High</div>
              </button>
              
              <button
                onClick={(e) => {
                  console.log('Medium button clicked');
                  handleRatingClick('medium', e);
                }}
                className="text-center p-2 bg-background/50 rounded-lg border border-border/50 hover:bg-background/80 transition-colors cursor-pointer relative z-20"
                type="button"
              >
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="h-3 w-3 text-yellow-500" />
                </div>
                <div className="text-xs font-semibold text-foreground">{ratingCounts.medium}</div>
                <div className="text-xs text-muted-foreground">Medium</div>
              </button>
              
              <button
                onClick={(e) => {
                  console.log('Low button clicked');
                  handleRatingClick('low', e);
                }}
                className="text-center p-2 bg-background/50 rounded-lg border border-border/50 hover:bg-background/80 transition-colors cursor-pointer relative z-20"
                type="button"
              >
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-3 w-3 text-blue-500" />
                </div>
                <div className="text-xs font-semibold text-foreground">{ratingCounts.low}</div>
                <div className="text-xs text-muted-foreground">Low</div>
              </button>
            </div>

            {/* Status Information and Update Button */}
            <div className="flex items-center justify-between text-xs relative z-20">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    console.log('Approved badge clicked');
                    handleApprovedClick(e);
                  }}
                  className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors cursor-pointer hover:bg-background/80 border-border bg-background text-foreground"
                  type="button"
                >
                  {approvedCount} Approved
                </button>
                {pendingCount > 0 && (
                  <button
                    onClick={(e) => {
                      console.log('Pending badge clicked');
                      handlePendingClick(e);
                    }}
                    className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors cursor-pointer hover:bg-yellow-500/20 bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                    type="button"
                  >
                    {pendingCount} Pending
                  </button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  console.log('Update button clicked');
                  handleUpdateClick(e);
                }}
                className="h-6 px-2 text-xs hover:bg-primary/10 relative z-30"
                type="button"
              >
                <Settings className="h-3 w-3 mr-1" />
                Update
              </Button>
            </div>

            {/* Hover indicator */}
            <motion.div 
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              initial={false}
              animate={{ width: "2rem" }}
            />
          </CardContent>

        </Card>
      </motion.div>

      <AddCategoryModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        category={category}
        onSuccess={() => {
          setShowEditModal(false);
          onRefresh();
        }}
      />

      <ApprovedRatingsModal
        open={showApprovedModal}
        onOpenChange={setShowApprovedModal}
        categoryName={category.name}
        ratings={userSkills}
        skills={skills}
        subskills={subskills}
        filterRating={selectedRatingFilter}
      />

      <PendingRatingsModal
        open={showPendingModal}
        onOpenChange={setShowPendingModal}
        categoryName={category.name}
        ratings={userSkills}
        skills={skills}
        subskills={subskills}
      />
    </>
  );
};