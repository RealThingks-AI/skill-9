import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Loader2, UserCheck, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Subskill {
  id: string;
  name: string;
  skill_id: string;
  skill_name: string;
  category_id: string;
}

interface EmployeeSuggestion {
  user_id: string;
  full_name: string;
  email: string;
  matched_skills: { skill_id: string; skill_name: string; rating: string }[];
  match_percentage: number;
}

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectId?: string | null;
  prefilledSubskills?: Array<{ skill_id: string; subskill_id: string }>;
  prefilledUserIds?: string[];
}

export default function ProjectFormDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  projectId,
  prefilledSubskills = [],
  prefilledUserIds = [],
}: ProjectFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [subskills, setSubskills] = useState<Subskill[]>([]);
  const [subskillSearchQuery, setSubskillSearchQuery] = useState('');
  const [selectedSubskills, setSelectedSubskills] = useState<{ skill_id: string; subskill_id: string }[]>([]);
  const [employeeSuggestions, setEmployeeSuggestions] = useState<EmployeeSuggestion[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (open) {
      fetchSubskills();
      if (projectId) {
        loadProjectData();
      } else {
        // When creating new project, use prefilled data
        resetForm();
        if (prefilledSubskills.length > 0) {
          setSelectedSubskills(prefilledSubskills);
        }
        if (prefilledUserIds.length > 0) {
          setSelectedEmployees(prefilledUserIds);
        }
      }
    }
  }, [open, projectId, prefilledSubskills, prefilledUserIds]);

  useEffect(() => {
    if (selectedSubskills.length > 0) {
      fetchEmployeeSuggestions();
      setShowSuggestions(true);
    } else {
      setEmployeeSuggestions([]);
      setShowSuggestions(false);
    }
  }, [selectedSubskills]);

  const loadProjectData = async () => {
    if (!projectId) return;

    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      setFormData({
        name: project.name || '',
        description: project.description || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
      });

      // Load required skills
      const { data: skillsData } = await supabase
        .from('project_required_skills')
        .select('skill_id, subskill_id')
        .eq('project_id', projectId);

      if (skillsData) {
        setSelectedSubskills(
          skillsData.map((s: any) => ({
            skill_id: s.skill_id,
            subskill_id: s.subskill_id,
          }))
        );
      }

      // Load assigned employees
      const { data: assignmentsData } = await supabase
        .from('project_assignments')
        .select('user_id')
        .eq('project_id', projectId);

      if (assignmentsData) {
        setSelectedEmployees(assignmentsData.map((a: any) => a.user_id));
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('Failed to load project data');
    }
  };

  const fetchSubskills = async () => {
    const { data, error } = await supabase
      .from('subskills')
      .select(`
        id,
        name,
        skill_id,
        skills(name, category_id)
      `)
      .order('name');

    if (!error && data) {
      const formattedSubskills: Subskill[] = data.map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        skill_id: sub.skill_id,
        skill_name: sub.skills.name,
        category_id: sub.skills.category_id,
      }));
      setSubskills(formattedSubskills);
    }
  };

  const fetchEmployeeSuggestions = async () => {
    const subskillIds = selectedSubskills.map((s) => s.subskill_id);
    const skillIds = [...new Set(selectedSubskills.map((s) => s.skill_id))];

    try {
      console.log('Fetching employee suggestions for subskills:', subskillIds, 'skills:', skillIds);

      // 1) Get approved ratings that match either:
      //    - exact selected subskills, OR
      //    - skill-level approvals (subskill_id is null) for the selected skills
      const { data: ratings, error: ratingsError } = await supabase
        .from('employee_ratings')
        .select(`
          user_id,
          rating,
          approved_at,
          subskill_id,
          skill_id,
          skills!inner(name),
          subskills(name)
        `)
        .eq('status', 'approved')
        .or(
          `subskill_id.in.(${subskillIds.join(',')}),and(subskill_id.is.null,skill_id.in.(${skillIds.join(',')}))`
        );

      if (ratingsError) throw ratingsError;
      if (!ratings || ratings.length === 0) {
        setEmployeeSuggestions([]);
        return;
      }

      // 2) Fetch profiles for the matched users
      const userIds = [...new Set(ratings.map((r: any) => r.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      // 3) Build suggestions with match percentage similar to Skill Explorer
      const suggestionsMap = new Map<string, { base: EmployeeSuggestion; matchedSet: Set<string> }>();

      // Helper: map skill-level approvals to all selected subskills under that skill
      const subskillsBySkill = new Map<string, string[]>(
        skillIds.map((skillId) => [
          skillId,
          selectedSubskills.filter((s) => s.skill_id === skillId).map((s) => s.subskill_id),
        ])
      );

      ratings.forEach((r: any) => {
        const profile = profileMap.get(r.user_id);
        const key = r.user_id;
        if (!suggestionsMap.has(key)) {
          suggestionsMap.set(key, {
            base: {
              user_id: r.user_id,
              full_name: profile?.full_name || 'Unknown',
              email: profile?.email || '',
              matched_skills: [],
              match_percentage: 0,
            },
            matchedSet: new Set<string>(),
          });
        }

        const entry = suggestionsMap.get(key)!;
        // Add matched skill badge info
        entry.base.matched_skills.push({
          skill_id: r.skill_id,
          skill_name: r.subskills?.name || r.skills?.name || 'Unknown',
          rating: r.rating,
        });

        if (r.subskill_id) {
          // Exact subskill approval
          if (subskillIds.includes(r.subskill_id)) entry.matchedSet.add(r.subskill_id);
        } else {
          // Skill-level approval counts for all selected subskills under that skill
          const subs = subskillsBySkill.get(r.skill_id) || [];
          subs.forEach((sid) => entry.matchedSet.add(sid));
        }
      });

      const suggestions = Array.from(suggestionsMap.values())
        .map(({ base, matchedSet }) => ({
          ...base,
          match_percentage: Math.round((matchedSet.size / subskillIds.length) * 100),
        }))
        .sort((a, b) => b.match_percentage - a.match_percentage);

      setEmployeeSuggestions(suggestions);
    } catch (err) {
      console.error('Error fetching employee suggestions:', err);
      setEmployeeSuggestions([]);
    }
  };

  const handleAddSubskill = (subskillId: string) => {
    const subskill = subskills.find(s => s.id === subskillId);
    if (!subskill) return;

    const exists = selectedSubskills.some(s => s.subskill_id === subskillId);
    if (!exists) {
      setSelectedSubskills([...selectedSubskills, { 
        skill_id: subskill.skill_id, 
        subskill_id: subskillId 
      }]);
      setSubskillSearchQuery('');
    }
  };

  const handleRemoveSubskill = (subskillId: string) => {
    setSelectedSubskills(selectedSubskills.filter(s => s.subskill_id !== subskillId));
  };

  const filteredSubskills = subskills.filter(subskill =>
    subskill.name.toLowerCase().includes(subskillSearchQuery.toLowerCase()) &&
    !selectedSubskills.some(s => s.subskill_id === subskill.id)
  );

  const toggleEmployee = (userId: string) => {
    if (selectedEmployees.includes(userId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== userId));
    } else {
      setSelectedEmployees([...selectedEmployees, userId]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    console.log('Selected subskills before validation:', selectedSubskills);

    if (selectedSubskills.length === 0) {
      toast.error('Please select at least one required subskill');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (projectId) {
        // Update existing project
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            name: formData.name,
            description: formData.description,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
          })
          .eq('id', projectId);

        if (projectError) throw projectError;

        // Delete existing skills and re-insert
        await supabase
          .from('project_required_skills')
          .delete()
          .eq('project_id', projectId);

        const skillsToInsert = selectedSubskills.map(s => ({
          project_id: projectId,
          skill_id: s.skill_id,
          subskill_id: s.subskill_id,
        }));

        console.log('Updating project skills:', skillsToInsert);

        const { data: insertedSkills, error: skillsError } = await supabase
          .from('project_required_skills')
          .insert(skillsToInsert)
          .select();

        if (skillsError) {
          console.error('Error inserting skills during update:', skillsError);
          throw skillsError;
        }

        console.log('Successfully updated skills:', insertedSkills);

        // Delete existing assignments and re-insert
        await supabase
          .from('project_assignments')
          .delete()
          .eq('project_id', projectId);

        if (selectedEmployees.length > 0) {
          const assignmentsToInsert = selectedEmployees.map(userId => ({
            project_id: projectId,
            user_id: userId,
            assigned_by: user.id,
          }));

          const { error: assignError } = await supabase
            .from('project_assignments')
            .insert(assignmentsToInsert);

          if (assignError) throw assignError;
        }

        toast.success('Project updated successfully!');
      } else {
        // Create new project
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: formData.name,
            description: formData.description,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            status: 'awaiting_approval',
            created_by: user.id,
          })
          .select()
          .single();

        if (projectError) throw projectError;

        // Add required skills (subskills with their parent skills)
        const skillsToInsert = selectedSubskills.map(s => ({
          project_id: project.id,
          skill_id: s.skill_id,
          subskill_id: s.subskill_id,
        }));

        console.log('Inserting skills:', skillsToInsert);

        const { data: insertedSkills, error: skillsError } = await supabase
          .from('project_required_skills')
          .insert(skillsToInsert)
          .select();

        if (skillsError) {
          console.error('Error inserting skills:', skillsError);
          throw skillsError;
        }

        console.log('Successfully inserted skills:', insertedSkills);

        // Assign selected employees
        if (selectedEmployees.length > 0) {
          const assignmentsToInsert = selectedEmployees.map(userId => ({
            project_id: project.id,
            user_id: userId,
            assigned_by: user.id,
          }));

          const { error: assignError } = await supabase
            .from('project_assignments')
            .insert(assignmentsToInsert);

          if (assignError) throw assignError;
        }

        toast.success('Project created successfully! Awaiting approval.');
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(error.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', start_date: '', end_date: '' });
    setSelectedSubskills([]);
    setSelectedEmployees([]);
    setEmployeeSuggestions([]);
    setShowSuggestions(false);
    setSubskillSearchQuery('');
  };

  const getSubskillDisplayName = (subskillId: string) => {
    const subskill = subskills.find(s => s.id === subskillId);
    if (!subskill) return 'Unknown';
    return `${subskill.skill_name} - ${subskill.name}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{projectId ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date (Optional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <Collapsible className="border rounded-lg" defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent">
              <div className="flex items-center gap-2">
                <Label>Required Subskills *</Label>
                {selectedSubskills.length > 0 && (
                  <Badge variant="secondary">{selectedSubskills.length} selected</Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subskills..."
                    value={subskillSearchQuery}
                    onChange={(e) => setSubskillSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {subskillSearchQuery && filteredSubskills.length > 0 && (
                  <ScrollArea className="h-48 border rounded-md">
                    <div className="p-2 space-y-1">
                      {filteredSubskills.map((subskill) => (
                        <div
                          key={subskill.id}
                          className="p-2 hover:bg-accent rounded-md cursor-pointer text-sm"
                          onClick={() => handleAddSubskill(subskill.id)}
                        >
                          <div className="font-medium">{subskill.name}</div>
                          <div className="text-xs text-muted-foreground">{subskill.skill_name}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {selectedSubskills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedSubskills.map((selected) => (
                      <Badge key={selected.subskill_id} variant="secondary" className="gap-1">
                        {getSubskillDisplayName(selected.subskill_id)}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveSubskill(selected.subskill_id)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {showSuggestions && (
            <Collapsible className="border rounded-lg" defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  <Label>Assign Employees (Optional)</Label>
                  {selectedEmployees.length > 0 && (
                    <Badge variant="secondary">{selectedEmployees.length} assigned</Badge>
                  )}
                  {employeeSuggestions.length > 0 && (
                    <Badge variant="outline">{employeeSuggestions.length} suggested</Badge>
                  )}
                </div>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 pt-0">
                {employeeSuggestions.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {employeeSuggestions.map((employee) => (
                      <div
                        key={employee.user_id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedEmployees.includes(employee.user_id)
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => toggleEmployee(employee.user_id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{employee.full_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {employee.match_percentage}% match
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">{employee.email}</div>
                        <div className="flex flex-wrap gap-1">
                          {employee.matched_skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill.skill_name} ({skill.rating})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No employees found with approved ratings for the selected subskills. You can still create the project and assign employees later.
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {projectId ? 'Update Project' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
