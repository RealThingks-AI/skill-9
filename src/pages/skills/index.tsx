import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CategoryCard } from "./components/CategoryCard";
import { CategoryModal } from "./components/CategoryModal";
import { AddCategoryModal } from "./components/admin/AddCategoryModal";
import { ImportExportBar } from "./components/admin/ImportExportBar";
import { useSkills } from "./hooks/useSkills";
import type { SkillCategory } from "@/types/database";
const Skills = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  const { isManagerOrAbove, profile } = useAuth();
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
  const handleCategoryClick = (category: SkillCategory) => {
    setSelectedCategory(category);
  };

  const handleCloseModal = () => {
    setSelectedCategory(null);
    setPendingRatings(new Map()); // Clear pending ratings when closing modal
  };

  // Filter categories based on search
  const filteredCategories = skillCategories.filter(category => category.name.toLowerCase().includes(searchTerm.toLowerCase()) || category.description?.toLowerCase().includes(searchTerm.toLowerCase()));
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading skills...</p>
        </div>
      </div>;
  }
  return <>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Skills Management
            </h1>
            
          </div>
          
          <div className="flex items-center gap-3">
            {isManagerOrAbove && <>
                
                <ImportExportBar categories={skillCategories} skills={skills} subskills={subskills} onRefresh={fetchData} />
              </>}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Cards Grid */}
        <motion.div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" layout>
          <AnimatePresence mode="popLayout">
            {filteredCategories.length === 0 ? <motion.div className="col-span-full flex flex-col items-center justify-center py-16 text-center" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -20
          }}>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {skillCategories.length === 0 ? "No Categories Yet" : "No Results Found"}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {skillCategories.length === 0 ? "Get started by creating your first skill category." : "Try adjusting your search terms to find what you're looking for."}
                </p>
                {isManagerOrAbove && skillCategories.length === 0 && <Button onClick={() => setShowAddCategory(true)} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Category
                  </Button>}
              </motion.div> : filteredCategories.map((category, index) => <CategoryCard key={category.id} category={category} skillCount={skills.filter(skill => skill.category_id === category.id).length} isManagerOrAbove={isManagerOrAbove} onClick={() => handleCategoryClick(category)} onRefresh={fetchData} index={index} />)}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <CategoryModal
            category={selectedCategory}
            skills={skills.filter(skill => skill.category_id === selectedCategory.id)}
            subskills={subskills}
            userSkills={userSkills}
            pendingRatings={pendingRatings}
            isManagerOrAbove={isManagerOrAbove}
            profile={profile as any}
            onClose={handleCloseModal}
            onSkillRate={handleSkillRate}
            onSubskillRate={handleSubskillRate}
            onSaveRatings={handleSaveRatings}
            onRefresh={fetchData}
          />
        )}
      </AnimatePresence>

      {/* Add Category Modal */}
      <AddCategoryModal open={showAddCategory} onOpenChange={setShowAddCategory} onSuccess={() => {
      setShowAddCategory(false);
      fetchData();
    }} />
    </>;
};
export default Skills;