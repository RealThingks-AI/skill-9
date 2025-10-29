import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, CheckCircle2, XCircle, Clock, Pencil } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import SkillValidationDialog from './SkillValidationDialog';
import ProjectFormDialog from './ProjectFormDialog';

interface ProjectDetailDialogProps {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userRole: string;
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  required_skills: { skill_id: string; subskill_id?: string | null; skill_name: string; subskill_name?: string }[];
  assigned_employees: {
    user_id: string;
    full_name: string;
    email: string;
    mapped_skills: { skill_id: string; skill_name: string; rating: string; validated: boolean }[];
  }[];
}

export default function ProjectDetailDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
  userRole,
}: ProjectDetailDialogProps) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [validationDialog, setValidationDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({ open: false, userId: '', userName: '' });

  useEffect(() => {
    if (projectId && open) {
      fetchProjectDetails();
    }
  }, [projectId, open]);

  const fetchProjectDetails = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      // Fetch project basic info
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch required skills
      const { data: skillsData } = await supabase
        .from('project_required_skills')
        .select(`
          skill_id,
          subskill_id,
          skills(name),
          subskills(name)
        `)
        .eq('project_id', projectId);

      const requiredSkills =
        skillsData?.map((s: any) => ({
          skill_id: s.skill_id,
          subskill_id: s.subskill_id,
          skill_name: s.skills?.name || 'Unknown',
          subskill_name: s.subskills?.name,
        })) || [];

      // Fetch assigned employees (without relying on FK joins)
      const { data: assignmentsData } = await supabase
        .from('project_assignments')
        .select('user_id')
        .eq('project_id', projectId);

      const userIds: string[] = Array.from(new Set((assignmentsData || []).map((a: any) => a.user_id)));

      let profileMap = new Map<string, { full_name: string; email: string }>();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);
        profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, { full_name: p.full_name, email: p.email }]));
      }

      const requiredSkillIds = Array.from(new Set(requiredSkills.map((s: any) => s.skill_id)));
      const requiredSubskillIds = Array.from(new Set((requiredSkills || []).map((s: any) => s.subskill_id).filter(Boolean)));

      const employees = await Promise.all(
        (userIds || []).map(async (userId: string) => {
          // Get employee approved ratings that match selected skills or subskills
          const { data: ratingsData } = await supabase
            .from('employee_ratings')
            .select(`
              skill_id,
              subskill_id,
              rating,
              status,
              skills(name),
              subskills(name)
            `)
            .eq('user_id', userId)
            .eq('status', 'approved')
            .or(
              `${requiredSubskillIds.length ? `subskill_id.in.(${requiredSubskillIds.join(',')})` : ''}${
                requiredSubskillIds.length && requiredSkillIds.length ? ',' : ''
              }${requiredSkillIds.length ? `and(subskill_id.is.null,skill_id.in.(${requiredSkillIds.join(',')}))` : ''}`
            );

          // Check which skills/subskills are validated
          const { data: validationsData } = await supabase
            .from('project_skill_validations')
            .select('skill_id, subskill_id')
            .eq('project_id', projectId)
            .eq('user_id', userId);

          const validatedSkillIds = new Set((validationsData || []).map((v: any) => v.skill_id).filter(Boolean));
          const validatedSubskillIds = new Set((validationsData || []).map((v: any) => v.subskill_id).filter(Boolean));

          const mappedSkills = (ratingsData || []).map((r: any) => ({
            skill_id: r.skill_id,
            skill_name: r.subskills?.name || r.skills?.name || 'Unknown',
            rating: r.rating,
            validated: validatedSubskillIds.has(r.subskill_id) || validatedSkillIds.has(r.skill_id),
          }));

          const profile = profileMap.get(userId);
          return {
            user_id: userId,
            full_name: profile?.full_name || 'Unknown',
            email: profile?.email || '',
            mapped_skills: mappedSkills,
          };
        })
      );

      setProject({
        ...projectData,
        required_skills: requiredSkills,
        assigned_employees: employees,
      });
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('projects')
        .update({
          status: 'active',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Project approved successfully!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error approving project:', error);
      toast.error(error.message || 'Failed to approve project');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Project rejected and deleted');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error rejecting project:', error);
      toast.error(error.message || 'Failed to reject project');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Project marked as completed!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error completing project:', error);
      toast.error(error.message || 'Failed to complete project');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      awaiting_approval: 'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]',
      active: 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]',
      completed: 'bg-muted text-muted-foreground',
      on_hold: 'bg-destructive/10 text-destructive',
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const canApprove = ['admin', 'management'].includes(userRole) && project?.status === 'awaiting_approval';
  const canComplete = ['tech_lead', 'management', 'admin'].includes(userRole) && project?.status === 'active';
  const canValidate = ['tech_lead', 'management', 'admin'].includes(userRole);
  const canEdit = ['tech_lead', 'management', 'admin'].includes(userRole);

  if (loading || !project) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading Project</DialogTitle>
            <DialogDescription className="sr-only">Fetching project details</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <DialogTitle className="text-2xl">{project.name}</DialogTitle>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditDialogOpen(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Badge className={getStatusBadge(project.status)}>
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
            <DialogDescription className="sr-only">Project details and assigned employees</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {project.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {project.start_date || 'Not set'} - {project.end_date || 'Ongoing'}
                </span>
              </div>
            </div>

            <Collapsible defaultOpen className="border rounded-lg">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent">
                <h3 className="font-semibold">Required Skills ({project.required_skills.length})</h3>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  {project.required_skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">
                      {skill.skill_name}
                      {skill.subskill_name && ` - ${skill.subskill_name}`}
                    </Badge>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible defaultOpen className="border rounded-lg">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <h3 className="font-semibold">
                    Assigned Employees ({project.assigned_employees.length})
                  </h3>
                </div>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 pt-0">
                {project.assigned_employees.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">
                    No employees have been assigned to this project yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {project.assigned_employees.map((employee) => (
                      <div key={employee.user_id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium text-sm">{employee.full_name}</div>
                            <div className="text-xs text-muted-foreground">{employee.email}</div>
                          </div>
                          {canValidate && project.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setValidationDialog({
                                  open: true,
                                  userId: employee.user_id,
                                  userName: employee.full_name,
                                })
                              }
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Validate Skills
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {employee.mapped_skills.map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant={skill.validated ? 'default' : 'secondary'}
                              className="text-xs gap-1"
                            >
                              {skill.validated && <CheckCircle2 className="h-3 w-3" />}
                              {skill.skill_name} ({skill.rating})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-end gap-2 pt-4 border-t">
              {canApprove && (
                <>
                  <Button variant="outline" onClick={handleReject} disabled={loading}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button onClick={handleApprove} disabled={loading}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Project
                  </Button>
                </>
              )}
              {canComplete && (
                <Button onClick={handleMarkComplete} disabled={loading}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SkillValidationDialog
        open={validationDialog.open}
        onOpenChange={(open) => setValidationDialog({ ...validationDialog, open })}
        projectId={projectId || ''}
        userId={validationDialog.userId}
        userName={validationDialog.userName}
        onSuccess={() => {
          fetchProjectDetails();
          onSuccess();
        }}
      />

      <ProjectFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        projectId={projectId}
        onSuccess={() => {
          fetchProjectDetails();
          onSuccess();
        }}
      />
    </>
  );
}
