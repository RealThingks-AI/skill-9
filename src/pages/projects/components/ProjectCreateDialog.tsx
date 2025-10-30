import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ProjectFormData } from '../types/projects';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '../services/projectService';
import { toast } from 'sonner';
import StepOne from './create-steps/StepOne';
import StepTwo from './create-steps/StepTwo';
import StepThree from './create-steps/StepThree';

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ProjectCreateDialog({
  open,
  onOpenChange,
  onSuccess,
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
      await projectService.createProject(formData, profile.user_id);
      toast.success('Project created and sent for approval');
      onOpenChange(false);
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project - Step {step} of 3</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 && (
            <StepOne formData={formData} setFormData={setFormData} />
          )}
          {step === 2 && (
            <StepTwo formData={formData} setFormData={setFormData} />
          )}
          {step === 3 && (
            <StepThree formData={formData} setFormData={setFormData} />
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
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
                {submitting ? 'Creating...' : 'Create Project'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
