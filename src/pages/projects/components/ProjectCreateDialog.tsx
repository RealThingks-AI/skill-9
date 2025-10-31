import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ProjectFormData, Project, RequiredSkill } from '../types/projects';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '../services/projectService';
import { toast } from 'sonner';
import StepOne from './create-steps/StepOne';
import StepTwo from './create-steps/StepTwo';
import StepThree from './create-steps/StepThree';
import { supabase } from '@/integrations/supabase/client';

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  prefilledSubskills?: { skill_id: string; subskill_id: string }[];
  prefilledUserIds?: string[];
  editMode?: Project;
}

export default function ProjectCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  prefilledSubskills = [],
  prefilledUserIds = [],
  editMode,
}: ProjectCreateDialogProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const { profile } = useAuth();

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    required_skills: [],
    members: [],
  });

  // Populate form data when in edit mode
  useEffect(() => {
    if (open && editMode) {
      setFormData({
        name: editMode.name,
        description: editMode.description || '',
        start_date: editMode.start_date || '',
        end_date: editMode.end_date || '',
        required_skills: editMode.required_skills,
        members: editMode.members.map(m => ({
          user_id: m.user_id,
          allocation_percentage: m.allocation_percentage,
        })),
      });
    } else if (!open) {
      resetForm();
    }
  }, [open, editMode]);

  // Update formData when prefilled data changes and dialog opens
  useEffect(() => {
    if (open && !editMode && (prefilledSubskills.length > 0 || prefilledUserIds.length > 0)) {
      // Load subskills data to map prefilled IDs to full skill data
      const loadPrefilledSkills = async () => {
        if (prefilledSubskills.length > 0) {
          const { data: subskillsData } = await supabase
            .from('subskills')
            .select('id, name, skills!inner(id, name)')
            .in('id', prefilledSubskills.map(ps => ps.subskill_id));

          const prefilledSkills: RequiredSkill[] = prefilledSubskills
            .map(ps => {
              const subskill = subskillsData?.find((s: any) => s.id === ps.subskill_id);
              if (!subskill) return null;
              return {
                skill_id: ps.skill_id,
                skill_name: (subskill as any).skills.name,
                subskill_id: ps.subskill_id,
                subskill_name: (subskill as any).name,
                required_rating: 'medium',
              } as RequiredSkill;
            })
            .filter((s): s is RequiredSkill => s !== null);

          setFormData(prev => ({
            ...prev,
            required_skills: prefilledSkills,
            members: prefilledUserIds.map(userId => ({
              user_id: userId,
              allocation_percentage: 50 as const,
            })),
          }));

          // Skip to step 2 if we have prefilled skills
          setStep(2);
        } else {
          setFormData(prev => ({
            ...prev,
            members: prefilledUserIds.map(userId => ({
              user_id: userId,
              allocation_percentage: 50 as const,
            })),
          }));
        }
      };

      loadPrefilledSkills();
    }
  }, [open, prefilledSubskills, prefilledUserIds, editMode]);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const canProceedToStep2 = formData.required_skills.length > 0;
  const canProceedToStep3 = formData.name && formData.description && formData.start_date;

  const handleSubmit = async () => {
    if (!profile) return;

    if (formData.members.length === 0) {
      toast.error('Please assign at least one team member');
      return;
    }

    try {
      setSubmitting(true);
      if (editMode) {
        await projectService.updateProject(editMode.id, formData);
        toast.success('Project updated successfully');
      } else {
        await projectService.createProject(formData, profile.user_id);
        toast.success('Project created and sent for approval');
      }
      onOpenChange(false);
      onSuccess();
      resetForm();
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} project:`, error);
      toast.error(`Failed to ${editMode ? 'update' : 'create'} project`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      required_skills: [],
      members: [],
    });
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[160rem] w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{editMode ? 'Edit Project' : 'Create New Project'} - Step {step} of 3</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {step === 1 && (
            <StepOne 
              formData={formData} 
              setFormData={setFormData}
              prefilledSubskills={prefilledSubskills}
            />
          )}
          {step === 2 && (
            <StepTwo formData={formData} setFormData={setFormData} />
          )}
          {step === 3 && (
            <StepThree formData={formData} setFormData={setFormData} />
          )}
        </div>

        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex gap-2">
            {step < 3 && (
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !canProceedToStep2) ||
                  (step === 2 && !canProceedToStep3)
                }
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Project' : 'Create Project')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
