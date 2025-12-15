import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { PendingChanges, MonthlyManpower } from '../types/projects';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PendingChangesDisplayProps {
  pendingChanges: PendingChanges;
  currentValues: {
    name: string;
    description?: string;
    customer_name?: string;
    tech_lead_id?: string;
    start_date?: string;
    end_date?: string;
    month_wise_manpower?: MonthlyManpower[];
  };
}

interface FieldChange {
  label: string;
  oldValue: string;
  newValue: string;
}

export default function PendingChangesDisplay({ pendingChanges, currentValues }: PendingChangesDisplayProps) {
  const [currentTechLeadName, setCurrentTechLeadName] = useState<string>('');
  const changes: FieldChange[] = [];

  // Fetch current tech lead name
  useEffect(() => {
    const fetchTechLeadName = async () => {
      if (!currentValues.tech_lead_id) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', currentValues.tech_lead_id)
        .single();
      setCurrentTechLeadName(data?.full_name || 'Unknown');
    };
    fetchTechLeadName();
  }, [currentValues.tech_lead_id]);

  // Compare fields and build changes list
  if (pendingChanges.name !== undefined && pendingChanges.name !== currentValues.name) {
    changes.push({
      label: 'Project Name',
      oldValue: pendingChanges.name || 'Not set',
      newValue: currentValues.name || 'Not set',
    });
  }

  if (pendingChanges.customer_name !== undefined && pendingChanges.customer_name !== currentValues.customer_name) {
    changes.push({
      label: 'Customer Name',
      oldValue: pendingChanges.customer_name || 'Not set',
      newValue: currentValues.customer_name || 'Not set',
    });
  }

  if (pendingChanges.description !== undefined && pendingChanges.description !== currentValues.description) {
    changes.push({
      label: 'Description',
      oldValue: pendingChanges.description || 'Not set',
      newValue: currentValues.description || 'Not set',
    });
  }

  if (pendingChanges.tech_lead_id !== undefined && pendingChanges.tech_lead_id !== currentValues.tech_lead_id) {
    changes.push({
      label: 'Project Owner',
      oldValue: pendingChanges.tech_lead_name || 'Not assigned',
      newValue: currentTechLeadName || 'Loading...',
    });
  }

  if (pendingChanges.start_date !== undefined && pendingChanges.start_date !== currentValues.start_date) {
    changes.push({
      label: 'Start Date',
      oldValue: pendingChanges.start_date || 'Not set',
      newValue: currentValues.start_date || 'Not set',
    });
  }

  if (pendingChanges.end_date !== undefined && pendingChanges.end_date !== currentValues.end_date) {
    changes.push({
      label: 'End Date',
      oldValue: pendingChanges.end_date || 'Not set',
      newValue: currentValues.end_date || 'Not set',
    });
  }

  // Compare month_wise_manpower
  const oldManpower = pendingChanges.month_wise_manpower || [];
  const newManpower = currentValues.month_wise_manpower || [];
  
  const manpowerChanged = JSON.stringify(oldManpower) !== JSON.stringify(newManpower);
  
  if (manpowerChanged && (oldManpower.length > 0 || newManpower.length > 0)) {
    // Find individual month changes
    const allMonths = new Set([
      ...oldManpower.map(m => m.month),
      ...newManpower.map(m => m.month)
    ]);
    
    allMonths.forEach(month => {
      const oldMonth = oldManpower.find(m => m.month === month);
      const newMonth = newManpower.find(m => m.month === month);
      
      if (oldMonth?.limit !== newMonth?.limit) {
        changes.push({
          label: `Manpower (${month})`,
          oldValue: oldMonth?.limit?.toString() || 'Not set',
          newValue: newMonth?.limit?.toString() || 'Not set',
        });
      }
    });
  }

  if (changes.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300">
          Pending Changes
        </Badge>
        <span className="text-sm text-muted-foreground">
          The following fields were updated and require approval:
        </span>
      </div>
      
      <div className="space-y-2">
        {changes.map((change, index) => (
          <div key={index} className="flex items-start gap-2 text-sm bg-background/50 rounded p-2">
            <Badge variant="secondary" className="shrink-0 text-xs">
              {change.label}
            </Badge>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-destructive line-through break-all">
                {change.oldValue.length > 100 ? `${change.oldValue.substring(0, 100)}...` : change.oldValue}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-green-600 dark:text-green-400 font-medium break-all">
                {change.newValue.length > 100 ? `${change.newValue.substring(0, 100)}...` : change.newValue}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}