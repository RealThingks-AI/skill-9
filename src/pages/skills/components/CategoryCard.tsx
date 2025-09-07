import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { AddCategoryModal } from "./admin/AddCategoryModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SkillsService } from "../services/skills.service";
import type { SkillCategory } from "@/types/database";

interface CategoryCardProps {
  category: SkillCategory;
  skillCount: number;
  isManagerOrAbove: boolean;
  onClick: () => void;
  onRefresh: () => void;
  index: number;
}

export const CategoryCard = ({
  category,
  skillCount,
  isManagerOrAbove,
  onClick,
  onRefresh,
  index
}: CategoryCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { toast } = useToast();

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
        whileTap={{ scale: 0.98 }}
        className="group"
      >
        <Card 
          className="relative h-48 w-full max-w-[400px] mx-auto cursor-pointer border-0 bg-gradient-to-br from-card via-card to-card/90 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          role="button"
          tabIndex={0}
          aria-label={`Open ${category.name} category`}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Admin Actions */}
          {isManagerOrAbove && (
            <div 
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-10"
              onClick={(e) => e.stopPropagation()}
            >
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
            </div>
          )}

          <CardContent className="relative h-full p-6 flex flex-col items-center justify-center text-center z-10">
            {/* Category Name */}
            <motion.h3 
              className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-200 line-clamp-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {category.name}
            </motion.h3>

            {/* Description */}
            {category.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                {category.description}
              </p>
            )}

            {/* Skill Count Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Badge 
                variant="secondary" 
                className="text-xs font-medium bg-primary/10 text-primary border-primary/20 px-3 py-1"
              >
                {skillCount} {skillCount === 1 ? 'skill' : 'skills'}
              </Badge>
            </motion.div>

            {/* Hover indicator */}
            <motion.div 
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              initial={false}
              animate={{ width: "2rem" }}
            />
          </CardContent>

          {/* Click ripple effect */}
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
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
    </>
  );
};