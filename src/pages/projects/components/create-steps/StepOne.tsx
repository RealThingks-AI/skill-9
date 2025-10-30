import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ProjectFormData, RequiredSkill, RatingLevel } from '../../types/projects';
import FormSelect from '@/components/common/FormSelect';

interface StepOneProps {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
}

export default function StepOne({ formData, setFormData }: StepOneProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [subskills, setSubskills] = useState<any[]>([]);
  const [filteredSubskills, setFilteredSubskills] = useState<any[]>([]);

  useEffect(() => {
    fetchSubskills();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = subskills.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.skills.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSubskills(filtered);
    } else {
      setFilteredSubskills([]);
    }
  }, [searchTerm, subskills]);

  const fetchSubskills = async () => {
    const { data } = await supabase
      .from('subskills')
      .select('*, skills!inner(id, name)')
      .order('name');
    
    if (data) setSubskills(data);
  };

  const addSkill = (subskill: any, rating: RatingLevel) => {
    const exists = formData.required_skills.some(
      s => s.subskill_id === subskill.id
    );

    if (exists) return;

    setFormData({
      ...formData,
      required_skills: [
        ...formData.required_skills,
        {
          skill_id: subskill.skills.id,
          skill_name: subskill.skills.name,
          subskill_id: subskill.id,
          subskill_name: subskill.name,
          required_rating: rating,
        },
      ],
    });
    setSearchTerm('');
  };

  const removeSkill = (subskillId: string) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter(
        s => s.subskill_id !== subskillId
      ),
    });
  };

  const updateRating = (subskillId: string, rating: RatingLevel) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.map(s =>
        s.subskill_id === subskillId ? { ...s, required_rating: rating } : s
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Search and Select Required Subskills</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subskills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {searchTerm && filteredSubskills.length > 0 && (
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {filteredSubskills.map((subskill) => (
              <div
                key={subskill.id}
                className="p-3 hover:bg-muted/50 border-b last:border-0 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{subskill.name}</p>
                  <p className="text-sm text-muted-foreground">{subskill.skills.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => addSkill(subskill, 'low')}>
                    + Low
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addSkill(subskill, 'medium')}>
                    + Medium
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addSkill(subskill, 'high')}>
                    + High
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label>Selected Skills ({formData.required_skills.length})</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.required_skills.map((skill) => (
            <Badge key={skill.subskill_id} variant="secondary" className="flex items-center gap-2 pl-3 pr-2">
              <div className="flex flex-col items-start">
                <span className="text-xs">{skill.skill_name}</span>
                <span className="font-medium">{skill.subskill_name}</span>
              </div>
              <select
                value={skill.required_rating}
                onChange={(e) => updateRating(skill.subskill_id, e.target.value as RatingLevel)}
                className="text-xs bg-transparent border-0 font-semibold uppercase"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeSkill(skill.subskill_id)}
              />
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
