import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkillRow } from "./SkillRow";
import { SkillDetail } from "./SkillDetail";
import { AddSkillModal } from "./admin/AddSkillModal";
import { AddSubskillModal } from "./admin/AddSubskillModal";
import { EditSkillModal } from "./admin/EditSkillModal";
import { DeleteSkillDialog } from "./admin/DeleteSkillDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { SkillCategory, Skill, Subskill, UserSkill, Profile } from "@/types/database";
interface CategoryModalProps {
  category: SkillCategory;
  skills: Skill[];
  subskills: Subskill[];
  userSkills: UserSkill[];
  pendingRatings: Map<string, { type: 'skill' | 'subskill', id: string, rating: 'high' | 'medium' | 'low' }>;
  isManagerOrAbove: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSkillRate: (skillId: string, rating: 'high' | 'medium' | 'low') => void;
  onSubskillRate: (subskillId: string, rating: 'high' | 'medium' | 'low') => void;
  onSaveRatings: () => void;
  onRefresh: () => void;
}
export const CategoryModal = ({
  category,
  skills,
  subskills,
  userSkills,
  pendingRatings,
  isManagerOrAbove,
  profile,
  onClose,
  onSkillRate,
  onSubskillRate,
  onSaveRatings,
  onRefresh
}: CategoryModalProps) => {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showEditSkill, setShowEditSkill] = useState(false);
  const [showDeleteSkill, setShowDeleteSkill] = useState(false);
  const [showAddSubskill, setShowAddSubskill] = useState(false);
  const [skillToEdit, setSkillToEdit] = useState<Skill | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState<string[]>([]);
  const { toast } = useToast();

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedSkill) {
          setSelectedSkill(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedSkill, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(skill);
  };
  const handleBackToSkills = () => {
    setSelectedSkill(null);
  };
  const handleEditSkill = (skill: Skill) => {
    // Ensure delete modal is closed first
    setShowDeleteSkill(false);
    setSkillToDelete(null);
    setSkillToEdit(skill);
    setShowEditSkill(true);
  };
  const handleDeleteSkill = (skill: Skill) => {
    // Ensure edit modal is closed first
    setShowEditSkill(false);
    setSkillToEdit(null);
    setSkillToDelete(skill);
    setShowDeleteSkill(true);
  };
  const handleSubmitRatings = async () => {
    if (!profile?.user_id) return;
    try {
      // Get all draft ratings for skills in this category
      const skillIds = skills.map(s => s.id);
      const draftRatings = userSkills.filter(us => skillIds.includes(us.skill_id) && us.status === 'draft');
      if (draftRatings.length === 0) {
        toast({
          title: "No Ratings to Submit",
          description: "Please rate some skills before submitting.",
          variant: "destructive"
        });
        return;
      }
      setPendingSubmit(draftRatings.map(r => r.id));

      // Update status to submitted (pending)
      const {
        error
      } = await supabase.from('user_skills').update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }).in('id', draftRatings.map(r => r.id));
      if (error) throw error;

      // TODO: Send notification to tech lead
      // This would require the tech_lead_id field in profiles table

      toast({
        title: "Ratings Submitted",
        description: `${draftRatings.length} skill ratings submitted for approval.`
      });
      onRefresh();
      setPendingSubmit([]);
    } catch (error) {
      console.error('Error submitting ratings:', error);
      toast({
        title: "Error",
        description: "Failed to submit ratings",
        variant: "destructive"
      });
      setPendingSubmit([]);
    }
  };
  const draftCount = userSkills.filter(us => skills.map(s => s.id).includes(us.skill_id) && us.status === 'draft').length;
  const submittedCount = userSkills.filter(us => skills.map(s => s.id).includes(us.skill_id) && us.status === 'submitted').length;
  const approvedCount = userSkills.filter(us => skills.map(s => s.id).includes(us.skill_id) && us.status === 'approved').length;
  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }} transition={{
    duration: 0.2
  }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={selectedSkill ? handleBackToSkills : onClose} />

      {/* Modal Content */}
      <motion.div initial={{
      opacity: 0,
      scale: 0.95,
      y: 20
    }} animate={{
      opacity: 1,
      scale: 1,
      y: 0
    }} exit={{
      opacity: 0,
      scale: 0.95,
      y: 20
     }} transition={{
      duration: 0.2,
      ease: "easeOut"
    }} className="relative z-10 w-full max-w-4xl max-h-[90vh] mx-auto">
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-card/50">
            <div className="flex items-center gap-4">
              {selectedSkill && <Button variant="ghost" size="sm" onClick={handleBackToSkills} className="p-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>}
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {selectedSkill ? selectedSkill.name : category.name}
                </h2>
                {selectedSkill ? selectedSkill.description : <>
                    {category.description}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
                      </Badge>
                      {draftCount > 0 && <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                          {draftCount} draft
                        </Badge>}
                      {submittedCount > 0 && <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {submittedCount} pending
                        </Badge>}
                      {approvedCount > 0 && <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {approvedCount} approved
                        </Badge>}
                    </div>
                  </>}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedSkill && isManagerOrAbove && <Button variant="outline" size="sm" onClick={() => setShowAddSubskill(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subskill
                </Button>}
              
              {!selectedSkill && isManagerOrAbove && <Button variant="outline" size="sm" onClick={() => setShowAddSkill(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </Button>}
              
              {!selectedSkill && !isManagerOrAbove && draftCount > 0 && <Button onClick={handleSubmitRatings} disabled={pendingSubmit.length > 0} className="bg-primary hover:bg-primary/90">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit {draftCount} Rating{draftCount !== 1 ? 's' : ''}
                </Button>}
              
              {/* Save Ratings button for pending ratings */}
              {!selectedSkill && !isManagerOrAbove && pendingRatings.size > 0 && (
                <Button onClick={onSaveRatings} className="bg-green-600 hover:bg-green-700">
                  Save Ratings ({pendingRatings.size})
                </Button>
              )}
              
              <Button variant="ghost" size="sm" onClick={onClose} className="p-2 hover:bg-muted" aria-label="Close modal">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {selectedSkill ? <motion.div key="skill-detail" initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -20
            }} transition={{
              duration: 0.2
            }}>
                  <SkillDetail skill={selectedSkill} subskills={subskills.filter(s => s.skill_id === selectedSkill.id)} userSkills={userSkills} pendingRatings={pendingRatings} isManagerOrAbove={isManagerOrAbove} onSkillRate={onSkillRate} onSubskillRate={onSubskillRate} onSaveRatings={onSaveRatings} onRefresh={onRefresh} />
                </motion.div> : <motion.div key="skills-list" initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: 20
            }} transition={{
              duration: 0.2
            }}>
                  <CardContent className="p-0">
                    {/* Add Skill Button */}
                    {isManagerOrAbove}

                    {/* Skills List */}
                    <ScrollArea className="h-[600px]">
                      <div className="p-6 space-y-3">
                        {skills.length === 0 ? <div className="text-center py-12">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                              <Plus className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              No Skills Yet
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              {isManagerOrAbove ? "Start building this category by adding your first skill." : "This category doesn't have any skills yet."}
                            </p>
                            {isManagerOrAbove && <Button onClick={() => setShowAddSkill(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Skill
                              </Button>}
                          </div> : skills.map((skill, index) => <motion.div key={skill.id} initial={{
                      opacity: 0,
                      y: 20
                    }} animate={{
                      opacity: 1,
                      y: 0
                    }} transition={{
                      duration: 0.2,
                      delay: index * 0.05,
                      ease: "easeOut"
                    }}>
                              <SkillRow skill={skill} subskills={subskills.filter(s => s.skill_id === skill.id)} userSkills={userSkills} pendingRatings={pendingRatings} isManagerOrAbove={isManagerOrAbove} onClick={() => handleSkillClick(skill)} onSkillRate={onSkillRate} onSubskillRate={onSubskillRate} onRefresh={onRefresh} onEditSkill={() => handleEditSkill(skill)} onDeleteSkill={() => handleDeleteSkill(skill)} />
                            </motion.div>)}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </motion.div>}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      <AddSkillModal open={showAddSkill} onOpenChange={setShowAddSkill} categoryId={category.id} onSuccess={() => {
      setShowAddSkill(false);
      onRefresh();
    }} />

      <EditSkillModal open={showEditSkill} onOpenChange={setShowEditSkill} skill={skillToEdit} onSuccess={() => {
      setShowEditSkill(false);
      setSkillToEdit(null);
      onRefresh();
    }} />

      <DeleteSkillDialog open={showDeleteSkill} onOpenChange={setShowDeleteSkill} skill={skillToDelete} onSuccess={() => {
      setShowDeleteSkill(false);
      setSkillToDelete(null);
      onRefresh();
    }} />
      <AddSubskillModal open={showAddSubskill} onOpenChange={setShowAddSubskill} skillId={selectedSkill?.id || ''} onSuccess={() => {
      setShowAddSubskill(false);
      onRefresh();
    }} />
    </motion.div>;
};