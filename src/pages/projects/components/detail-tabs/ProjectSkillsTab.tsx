import { Project } from '../../types/projects';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProjectSkillsTabProps {
  project: Project;
}

export default function ProjectSkillsTab({ project }: ProjectSkillsTabProps) {
  const [skillCoverage, setSkillCoverage] = useState<any[]>([]);

  useEffect(() => {
    loadSkillCoverage();
  }, [project]);

  const loadSkillCoverage = async () => {
    const coverage = await Promise.all(
      project.required_skills.map(async (reqSkill) => {
        // Check which team members have this skill approved
        const { data: ratings } = await supabase
          .from('employee_ratings')
          .select('user_id, rating, profiles!inner(full_name)')
          .eq('subskill_id', reqSkill.subskill_id)
          .eq('status', 'approved')
          .in('user_id', project.members.map(m => m.user_id));

        const ratingValues = { low: 1, medium: 2, high: 3 };
        const requiredValue = ratingValues[reqSkill.required_rating];

        const coveredBy = (ratings || []).filter((r: any) => {
          const userValue = ratingValues[r.rating as keyof typeof ratingValues];
          return userValue >= requiredValue;
        });

        return {
          ...reqSkill,
          covered: coveredBy.length > 0,
          covered_by: coveredBy.map((r: any) => r.profiles.full_name),
        };
      })
    );

    setSkillCoverage(coverage);
  };

  const coveredCount = skillCoverage.filter(s => s.covered).length;
  const totalCount = skillCoverage.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Skills Coverage</h3>
        <Badge variant={coveredCount === totalCount ? 'default' : 'secondary'}>
          {coveredCount} / {totalCount} covered
        </Badge>
      </div>

      <div className="space-y-2">
        {skillCoverage.map((skill) => (
          <div key={skill.subskill_id} className="p-3 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{skill.subskill_name}</p>
                  <Badge variant="outline" className="text-xs">
                    {skill.required_rating.toUpperCase()}
                  </Badge>
                  {skill.covered ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{skill.skill_name}</p>
                {skill.covered_by.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Covered by: {skill.covered_by.join(', ')}
                  </p>
                )}
              </div>
              <Badge variant={skill.covered ? 'default' : 'destructive'}>
                {skill.covered ? 'Covered' : 'Not Covered'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
