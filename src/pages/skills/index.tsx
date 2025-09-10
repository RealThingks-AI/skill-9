import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Plus, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CategoryCard } from "./components/CategoryCard";
import { CategoryModal } from "./components/CategoryModal";
import { AddCategoryModal } from "./components/admin/AddCategoryModal";
import { ActionMenu } from "./components/admin/ActionMenu";
import { CriteriaModal } from "./components/CriteriaModal";
import { AddCategorySelectionModal } from "./components/AddCategorySelectionModal";
import { HideCategoryConfirmDialog } from "./components/HideCategoryConfirmDialog";
import { useSkills } from "./hooks/useSkills";
import { useCategoryPreferences } from "./hooks/useCategoryPreferences";
import type { SkillCategory } from "@/types/database";
const Skills = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [categoryToHide, setCategoryToHide] = useState<{id: string, name: string} | null>(null);
  const {
    isManagerOrAbove,
    profile
  } = useAuth();
  const {
    skillCategories,
    skills,
    subskills,
    userSkills,
    pendingRatings,
    loading,
    fetchData,
    handleSkillRate,
    handleSubskillRate,
    handleSaveRatings,
    setPendingRatings
  } = useSkills();

  const {
    visibleCategoryIds,
    loading: preferencesLoading,
    addCategories,
    hideCategory
  } = useCategoryPreferences();
  const handleCategoryClick = (category: SkillCategory) => {
    setSelectedCategory(category);
  };
  const handleCloseModal = () => {
    setSelectedCategory(null);
    setPendingRatings(new Map()); // Clear pending ratings when closing modal
  };

  const handleHideCategory = (categoryId: string, categoryName: string) => {
    setCategoryToHide({ id: categoryId, name: categoryName });
  };

  const confirmHideCategory = () => {
    if (categoryToHide) {
      hideCategory(categoryToHide.id, categoryToHide.name);
      setCategoryToHide(null);
    }
  };

  // Get visible categories based on user preferences
  const visibleCategories = skillCategories.filter(category => 
    visibleCategoryIds.includes(category.id)
  );

  // Filter visible categories based on search
  const filteredCategories = visibleCategories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (loading || preferencesLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading skills...</p>
        </div>
      </div>;
  }
  return <>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Skills Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {visibleCategories.length === 0 
                ? "Add categories to start tracking your skills" 
                : `Track and manage your skills across ${visibleCategories.length} visible categories`
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Add Category Button for Employee/Tech Lead */}
            {!isManagerOrAbove && (
              <Button
                onClick={() => setShowCategorySelection(true)}
                className="flex items-center gap-2"
                disabled={skillCategories.length === visibleCategoryIds.length}
              >
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            )}
            
            {/* Search - only show if there are visible categories */}
            {visibleCategories.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCriteria(true)}
              className="flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              Criteria
            </Button>
            
            {isManagerOrAbove && (
              <ActionMenu categories={skillCategories} skills={skills} subskills={subskills} onRefresh={fetchData} />
            )}
          </div>
        </div>

        {/* Category Cards Grid - Fixed 3x3 Layout */}
        <div className="flex-1 overflow-y-auto">
          {visibleCategories.length === 0 ? (
            /* Empty State */
            <motion.div 
              className="flex flex-col items-center justify-center h-full py-16 text-center" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {isManagerOrAbove ? "No Categories Yet" : "No Categories Selected"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {isManagerOrAbove 
                  ? "Get started by creating your first skill category." 
                  : "Add categories to your dashboard to start tracking your skills. Click the '+ Add Category' button to get started."
                }
              </p>
              {isManagerOrAbove ? (
                skillCategories.length === 0 && (
                  <Button onClick={() => setShowAddCategory(true)} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Category
                  </Button>
                )
              ) : (
                <Button onClick={() => setShowCategorySelection(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              )}
            </motion.div>
          ) : filteredCategories.length === 0 ? (
            /* No Search Results */
            <motion.div 
              className="flex flex-col items-center justify-center h-full py-16 text-center" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Results Found
              </h3>
              <p className="text-muted-foreground max-w-md">
                Try adjusting your search terms to find what you're looking for.
              </p>
            </motion.div>
          ) : (
            /* Fixed 3x3 Grid */
            <div className="h-full p-4">
              <motion.div 
                className="grid grid-cols-3 gap-4 w-full h-full"
                style={{
                  gridTemplateRows: 'repeat(3, 1fr)'
                }}
                layout
              >
                <AnimatePresence mode="popLayout">
                  {/* Render exactly 9 slots */}
                  {Array.from({ length: 9 }, (_, index) => {
                    const category = filteredCategories[index];
                    const isAddButtonSlot = !category && index === filteredCategories.length && !isManagerOrAbove && filteredCategories.length < 9;
                    
                    if (category) {
                      // Show category card
                      return (
                        <CategoryCard 
                          key={category.id} 
                          category={category} 
                          skillCount={skills.filter(skill => skill.category_id === category.id).length}
                          subskills={subskills}
                          isManagerOrAbove={isManagerOrAbove} 
                          onClick={() => handleCategoryClick(category)} 
                          onRefresh={fetchData} 
                          index={index}
                          userSkills={userSkills}
                          skills={skills}
                          showHideButton={!isManagerOrAbove}
                          onHide={!isManagerOrAbove ? handleHideCategory : undefined}
                        />
                      );
                    } else if (isAddButtonSlot) {
                      // Show add category button in the next empty slot
                      return (
                        <motion.div
                          key={`add-${index}`}
                          className="border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center p-6 hover:border-muted-foreground/50 transition-colors cursor-pointer group"
                          onClick={() => setShowCategorySelection(true)}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 group-hover:bg-muted-foreground/10 transition-colors">
                            <Plus className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            Add Category
                          </span>
                        </motion.div>
                      );
                    } else {
                      // Show empty slot
                      return (
                        <motion.div
                          key={`empty-${index}`}
                          className="rounded-lg bg-muted/20 border border-muted/40"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      );
                    }
                  })}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {selectedCategory && <CategoryModal category={selectedCategory} skills={skills.filter(skill => skill.category_id === selectedCategory.id)} subskills={subskills} userSkills={userSkills} pendingRatings={pendingRatings} isManagerOrAbove={isManagerOrAbove} profile={profile as any} onClose={handleCloseModal} onSkillRate={handleSkillRate} onSubskillRate={handleSubskillRate} onSaveRatings={handleSaveRatings} onRefresh={fetchData} />}
      </AnimatePresence>

      {/* Add Category Modal */}
      <AddCategoryModal open={showAddCategory} onOpenChange={setShowAddCategory} onSuccess={() => {
      setShowAddCategory(false);
      fetchData();
    }} />

      {/* Criteria Modal */}
      <CriteriaModal open={showCriteria} onOpenChange={setShowCriteria} />

      {/* Category Selection Modal */}
      <AddCategorySelectionModal
        open={showCategorySelection}
        onOpenChange={setShowCategorySelection}
        categories={skillCategories}
        visibleCategoryIds={visibleCategoryIds}
        onCategoriesSelected={addCategories}
      />

      {/* Hide Category Confirmation Dialog */}
      <HideCategoryConfirmDialog
        open={!!categoryToHide}
        onOpenChange={(open) => !open && setCategoryToHide(null)}
        categoryName={categoryToHide?.name || ""}
        onConfirm={confirmHideCategory}
      />
    </>;
};
export default Skills;