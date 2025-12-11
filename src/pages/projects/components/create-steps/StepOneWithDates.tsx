import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ProjectFormData } from '../../types/projects';
import ManpowerLimitInput from './ManpowerLimitInput';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { dateFormatters } from '@/utils/formatters';

interface StepOneWithDatesProps {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
  isEditMode?: boolean;
  readOnly?: boolean;
}

export default function StepOneWithDates({ formData, setFormData, isEditMode = false, readOnly = false }: StepOneWithDatesProps) {
  const { profile } = useAuth();
  const [techLeadName, setTechLeadName] = useState<string>('');
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  // Track when profile is loaded
  useEffect(() => {
    if (profile) {
      setIsProfileLoaded(true);
    }
  }, [profile]);

  // Auto-set tech_lead_id to current user on create (not edit)
  useEffect(() => {
    if (profile && !isEditMode && !formData.tech_lead_id) {
      setFormData({ ...formData, tech_lead_id: profile.user_id });
    }
  }, [profile, isEditMode]);

  // Fetch tech lead name for display
  useEffect(() => {
    const fetchTechLeadName = async () => {
      const techLeadId = formData.tech_lead_id || profile?.user_id;
      if (!techLeadId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', techLeadId)
          .single();

        if (error) throw error;
        setTechLeadName(data?.full_name || '');
      } catch (error) {
        console.error('Error fetching tech lead name:', error);
      }
    };

    fetchTechLeadName();
  }, [formData.tech_lead_id, profile?.user_id]);

  const isTechLead = profile?.role === 'tech_lead';
  const isManagementOrAdmin = ['management', 'admin'].includes(profile?.role || '');

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="project-name">Project Name *</Label>
        <Input
          id="project-name"
          placeholder="Enter project name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={readOnly}
        />
      </div>

      <div>
        <Label htmlFor="customer-name">Customer Name *</Label>
        <Input
          id="customer-name"
          placeholder="Enter customer name"
          value={formData.customer_name || ''}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
          required
          disabled={readOnly}
        />
      </div>

      <div>
        <Label htmlFor="project-description">Description *</Label>
        <Textarea
          id="project-description"
          placeholder="Enter project description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
          disabled={readOnly}
        />
      </div>

      {/* Tech Lead field - only show after profile is loaded, hidden for Tech Lead users, read-only for Management/Admin */}
      {isProfileLoaded && !isTechLead && (
        <div>
          <Label htmlFor="tech-lead">Tech Lead</Label>
          <Input
            id="tech-lead"
            value={techLeadName || 'Loading...'}
            disabled
            className="bg-muted"
          />
        </div>
      )}

      {readOnly ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="start-date">Start Date *</Label>
            <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formData.start_date ? dateFormatters.formatDate(formData.start_date) : 'Not set'}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="end-date">End Date *</Label>
            <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formData.end_date ? dateFormatters.formatDate(formData.end_date) : 'Not set'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="start-date">Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.start_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.start_date ? dateFormatters.formatDate(formData.start_date) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.start_date ? parseISO(formData.start_date) : undefined}
                  onSelect={(date) => setFormData({ ...formData, start_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label htmlFor="end-date">End Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="end-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.end_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.end_date ? dateFormatters.formatDate(formData.end_date) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.end_date ? parseISO(formData.end_date) : undefined}
                  onSelect={(date) => setFormData({ ...formData, end_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                  disabled={(date) => formData.start_date ? date < parseISO(formData.start_date) : false}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      <ManpowerLimitInput
        startDate={formData.start_date}
        endDate={formData.end_date}
        monthlyLimits={formData.month_wise_manpower || []}
        onChange={(limits) => setFormData({ ...formData, month_wise_manpower: limits })}
        readOnly={readOnly}
      />
    </div>
  );
}