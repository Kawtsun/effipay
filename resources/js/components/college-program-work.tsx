import * as React from 'react';
import { Asterisk } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { WorkDaysSelector, type WorkDayTime } from '@/components/work-days-selector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export type CollegeProgram = { value: string; label: string };

interface Props {
  programs: CollegeProgram[];
  selected: string[]; // program codes
  hoursByProgram: Record<string, string>;
  onChangeHours: (code: string, hours: string) => void;
  workDaysByProgram: Record<string, WorkDayTime[]>;
  onChangeWorkDays: (code: string, days: WorkDayTime[]) => void;
  errors?: Record<string, string>;
}

export default function CollegeProgramWork({
  programs,
  selected,
  hoursByProgram,
  onChangeHours,
  workDaysByProgram,
  onChangeWorkDays,
  errors = {},
}: Props) {
  const getLabel = React.useCallback((code: string) => programs.find(p => p.value === code)?.label || code, [programs]);

  const ErrorDisplay = ({ field }: { field: keyof typeof errors }) => {
    if (!errors[field]) return null;
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{errors[field]}</AlertDescription>
      </Alert>
    );
  };

  const ordered = programs.filter(p => selected.includes(p.value));

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue={ordered.length > 0 ? ordered[0].value : undefined}>
      {ordered.map(({ value: code }) => {
        const hoursKey = `college_work_hours_by_program.${code}`;
        const daysKey = `college_work_days_by_program.${code}`;
        const hours = hoursByProgram[code] || '';
        const days = workDaysByProgram[code] || [];

        return (
          <AccordionItem value={code} key={code}>
            <AccordionTrigger className="font-semibold text-base">
              <div className="flex items-center">
                {getLabel(code)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">({code})</span>
                <Asterisk className="h-4 w-4 text-destructive ml-2" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                {/* Work Hours Input */}
                <div className="space-y-2">
                  <Label htmlFor={`hours-${code}`} className="text-sm font-medium">
                    Work Hours
                  </Label>
                  <Input
                    id={`hours-${code}`}
                    type="number"
                    min="0"
                    placeholder="e.g., 12"
                    value={hours}
                    onChange={(e) => onChangeHours(code, e.target.value)}
                    className="w-full md:w-48"
                  />
                  <ErrorDisplay field={hoursKey as keyof typeof errors} />
                  <ErrorDisplay field={'college_work_hours_by_program' as keyof typeof errors} />
                </div>

                {/* Work Days Selector */}
                <div className="space-y-2">
                  <WorkDaysSelector
                    value={days}
                    onChange={(d: WorkDayTime[]) => onChangeWorkDays(code, d)}
                    selectedIndex={0}
                    onSelectIndex={() => {}}
                    showTimePickers={false}
                  />
                  <ErrorDisplay field={daysKey as keyof typeof errors} />
                  <ErrorDisplay field={'college_work_days_by_program' as keyof typeof errors} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
