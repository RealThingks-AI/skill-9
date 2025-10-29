import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Target, Users, CheckCircle, Clock } from 'lucide-react';
import { useProjects } from './hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProjectFormDialog from './components/ProjectFormDialog';
import ProjectDetailDialog from './components/ProjectDetailDialog';
import { Badge } from '@/components/ui/badge';

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'awaiting' | 'active' | 'completed'>('active');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const { projects, loading, refreshProjects } = useProjects();
  const { profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const awaitingProjects = filteredProjects.filter(p => p.status === 'awaiting_approval');
  const activeProjects = filteredProjects.filter(p => p.status === 'active');
  const completedProjects = filteredProjects.filter(p => p.status === 'completed');

  const stats = {
    awaiting: awaitingProjects.length,
    active: activeProjects.length,
    completed: completedProjects.length,
    total: projects.length,
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setDetailDialogOpen(true);
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

  const renderProjectCard = (project: any) => (
    <Card
      key={project.id}
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleProjectClick(project.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{project.name}</CardTitle>
          <Badge className={`${getStatusBadge(project.status)} shrink-0 text-xs`}>
            {project.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{project.team?.length || 0} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>{project.skills?.length || 0} skills</span>
          </div>
        </div>
        {(project.start_date || project.end_date) && (
          <div className="text-xs text-muted-foreground">
            {project.start_date || 'TBD'} - {project.end_date || 'Ongoing'}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setFormDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
          <TabsList className="flex-shrink-0 justify-start">
            <TabsTrigger value="awaiting">
              Awaiting Approval ({stats.awaiting})
            </TabsTrigger>
            <TabsTrigger value="active">Active Projects ({stats.active})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="awaiting" className="mt-0">
              {awaitingProjects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {awaitingProjects.map(renderProjectCard)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">No projects awaiting approval</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="mt-0">
              {activeProjects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeProjects.map(renderProjectCard)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground mb-4">No active projects</p>
                  <Button onClick={() => setFormDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Project
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              {completedProjects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedProjects.map(renderProjectCard)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">No completed projects yet</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <ProjectFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSuccess={refreshProjects}
      />

        <ProjectDetailDialog
          projectId={selectedProjectId}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onSuccess={refreshProjects}
          userRole={profile?.role || ''}
        />
      </div>
    </div>
  );
};

export default Projects;