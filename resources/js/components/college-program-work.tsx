import * as React from 'react';
import { Asterisk, CalendarDays } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { WorkDaysSelector, type WorkDayTime } from '@/components/work-days-selector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { SummaryBadge } from '@/components/summary-badge';

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
  const ordered = React.useMemo(() => programs.filter(p => selected.includes(p.value)), [programs, selected]);

  const ErrorDisplay = ({ field }: { field: keyof typeof errors }) => {
    if (!errors[field]) return null;
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{errors[field]}</AlertDescription>
      </Alert>
    );
  };

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full space-y-3"
      defaultValue={ordered.length > 0 ? ordered[0].value : undefined}
    >
      {ordered.map(({ value: code }) => {
        const hoursKey = `college_work_hours_by_program.${code}`;
        const daysKey = `college_work_days_by_program.${code}`;
        const hours = hoursByProgram[code] || '';
        const days = workDaysByProgram[code] || [];

        return (
          <AccordionItem value={code} key={code} className="border rounded-md bg-muted/20 dark:bg-muted/10">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex w-full items-center justify-between gap-3 text-base">
                <div className="flex items-center font-semibold">
                  {getLabel(code)}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">({code})</span>
                  <Asterisk className="h-4 w-4 text-destructive ml-2" />
                </div>
                <SummaryBadge icon={<CalendarDays size={12} />} className="mr-2">
                  {days.length > 0 ? `${days.length} day${days.length > 1 ? 's' : ''}/wk` : 'No days set'}
                </SummaryBadge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 px-3 pb-3">
              <motion.div
                key={`content-${code}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <div className="space-y-4">
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

                  {/* Conditionally show Work Hours only when days are selected */}
                  <AnimatePresence initial={false}>
                    {days.length > 0 && (
                      <motion.div
                        key={`hours-${code}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="space-y-4 px-4"
                      >
                        <Separator />
                        <Label htmlFor={`hours-${code}`} className="text-sm font-semibold flex items-center">
                          Work Hours <Asterisk className="h-4 w-4 text-destructive ml-1" />
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
