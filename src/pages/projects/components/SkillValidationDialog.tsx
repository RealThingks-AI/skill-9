import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SkillValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

interface SkillToValidate {
  skill_id: string;
  skill_name: string;
  rating: string;
  already_validated: boolean;
}

export default function SkillValidationDialog({
  open,
  onOpenChange,
  projectId,
  userId,
  userName,
  onSuccess,
}: SkillValidationDialogProps) {
  const [skills, setSkills] = useState<SkillToValidate[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && projectId && userId) {
      fetchSkillsToValidate();
    }
  }, [open, projectId, userId]);

  const fetchSkillsToValidate = async () => {
    try {
      // Get required skills for this project
      const { data: requiredSkills } = await supabase
        .from('project_required_skills')
        .select('skill_id')
        .eq('project_id', projectId);

      const skillIds = requiredSkills?.map((s: any) => s.skill_id) || [];

      // Get employee's ratings for these skills
      const { data: ratings } = await supabase
        .from('employee_ratings')
        .select(`
          skill_id,
          rating,
          skills(name)
        `)
        .eq('user_id', userId)
        .in('skill_id', skillIds)
        .eq('status', 'approved');

      // Check which are already validated
      const { data: validations } = await supabase
        .from('project_skill_validations')
        .select('skill_id')
        .eq('project_id', projectId)
        .eq('user_id', userId);

      const validatedIds = new Set(validations?.map((v: any) => v.skill_id) || []);

      const skillsToValidate = ratings?.map((r: any) => ({
        skill_id: r.skill_id,
        skill_name: r.skills?.name || 'Unknown',
        rating: r.rating,
        already_validated: validatedIds.has(r.skill_id),
      })) || [];

      setSkills(skillsToValidate);
      
      // Pre-select non-validated skills
      const preSelected = new Set(
        skillsToValidate
          .filter((s: SkillToValidate) => !s.already_validated)
          .map((s: SkillToValidate) => s.skill_id)
      );
      setSelectedSkills(preSelected);
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to load skills');
    }
  };

  const toggleSkill = (skillId: string) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId);
    } else {
      newSelected.add(skillId);
    }
    setSelectedSkills(newSelected);
  };

  const handleValidate = async () => {
    if (selectedSkills.size === 0) {
      toast.error('Please select at least one skill to validate');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const validations = Array.from(selectedSkills).map(skillId => ({
        project_id: projectId,
        user_id: userId,
        skill_id: skillId,
        validated_by: user.id,
        notes: notes || null,
      }));

      const { error } = await supabase
        .from('project_skill_validations')
        .upsert(validations, {
          onConflict: 'project_id,user_id,skill_id,subskill_id',
        });

      if (error) throw error;

      toast.success(`Validated ${selectedSkills.size} skill(s) for ${userName}`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error validating skills:', error);
      toast.error(error.message || 'Failed to validate skills');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSkills(new Set());
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Validate Skills for {userName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Select skills to mark as "Project Proven"</Label>
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No skills to validate
                </p>
              ) : (
                skills.map((skill) => (
                  <div key={skill.skill_id} className="flex items-start space-x-2">
                    <Checkbox
                      id={skill.skill_id}
                      checked={selectedSkills.has(skill.skill_id)}
                      onCheckedChange={() => toggleSkill(skill.skill_id)}
                      disabled={skill.already_validated}
                    />
                    <label
                      htmlFor={skill.skill_id}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      <span className={skill.already_validated ? 'text-muted-foreground' : ''}>
                        {skill.skill_name} ({skill.rating})
                      </span>
                      {skill.already_validated && (
                        <span className="ml-2 text-xs text-[hsl(var(--success))]">
                          ✓ Already validated
                        </span>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the validation"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleValidate} disabled={loading || selectedSkills.size === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Validate Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
