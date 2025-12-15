import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MonthlyManpower } from '../../types/projects';
import { format, startOfMonth, addMonths, isBefore, isEqual } from 'date-fns';
import { dateFormatters } from "@/utils/formatters";
interface ManpowerLimitInputProps {
  startDate?: string;
  endDate?: string;
  monthlyLimits: MonthlyManpower[];
  onChange: (limits: MonthlyManpower[]) => void;
  readOnly?: boolean;
}
export default function ManpowerLimitInput({
  startDate,
  endDate,
  monthlyLimits,
  onChange,
  readOnly = false
}: ManpowerLimitInputProps) {
  const [months, setMonths] = useState<string[]>([]);
  useEffect(() => {
    if (startDate && endDate) {
      const start = startOfMonth(new Date(startDate));
      const end = startOfMonth(new Date(endDate));
      const monthList: string[] = [];
      let current = start;
      while (isBefore(current, end) || isEqual(current, end)) {
        monthList.push(format(current, 'yyyy-MM'));
        current = addMonths(current, 1);
      }
      setMonths(monthList);

      // Initialize limits for new months
      const updatedLimits = monthList.map(month => {
        const existing = monthlyLimits.find(l => l.month === month);
        return existing || {
          month,
          limit: 0
        };
      });
      onChange(updatedLimits);
    } else {
      setMonths([]);
      onChange([]);
    }
  }, [startDate, endDate]);
  const handleLimitChange = (month: string, value: string) => {
    const limit = parseFloat(value) || 0;
    const updatedLimits = monthlyLimits.map(l => l.month === month ? {
      ...l,
      limit
    } : l);
    onChange(updatedLimits);
  };
  if (months.length === 0) {
    return null;
  }
  return <div className="space-y-2">
      <Label className="text-base font-medium text-foreground">Monthly Manpower Limits</Label>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {months.map(month => {
        const limit = monthlyLimits.find(l => l.month === month)?.limit || 0;
        return <Card key={month} className="p-2 space-y-1.5 bg-card border border-border shadow-sm">
              <div className="text-xs font-semibold text-foreground rounded">
                {dateFormatters.formatMonthYear(month + '-01')}
              </div>
              <Input type="number" step="0.25" min="0" placeholder="0.0" value={limit || ''} onChange={e => handleLimitChange(month, e.target.value)} className="h-7 text-sm px-2 bg-background text-foreground border-input text-center mx-auto" disabled={readOnly} />
            </Card>;
      })}
      </div>
    </div>;
}