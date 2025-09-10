import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SkillCategory } from "@/types/database";

interface AddCategorySelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: SkillCategory[];
  visibleCategoryIds: string[];
  onCategoriesSelected: (categoryIds: string[]) => void;
}

export const AddCategorySelectionModal = ({
  open,
  onOpenChange,
  categories,
  visibleCategoryIds,
  onCategoriesSelected
}: AddCategorySelectionModalProps) => {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const availableCategories = categories.filter(
    category => !visibleCategoryIds.includes(category.id)
  );

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleConfirm = () => {
    if (selectedCategoryIds.length > 0) {
      onCategoriesSelected([...visibleCategoryIds, ...selectedCategoryIds]);
      setSelectedCategoryIds([]);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedCategoryIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Categories to Dashboard
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select categories to display on your skills dashboard. Choose from {availableCategories.length} available categories.
          </p>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Category Selection Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            {availableCategories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">All categories are already displayed on your dashboard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableCategories.map((category, index) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isSelected 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => handleCategoryToggle(category.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {category.description}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex-shrink-0"
                              >
                                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selection Summary */}
          {selectedCategoryIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-accent/30 rounded-lg p-3 border border-border"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Selected:</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'}
                  </Badge>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedCategoryIds.length === 0}
              className="min-w-[100px]"
            >
              Add {selectedCategoryIds.length > 0 && `(${selectedCategoryIds.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};