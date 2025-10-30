import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ListFilter, Calculator, Gift, PlusCircle, Pencil, Trash2, CalendarPlus, FileUp, Printer, Download, Settings2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ACTION_OPTIONS = [
  'All',
  'run payroll',
  'run 13th month pay',
  'created',
  'updated',
  'deleted',
  'add calendar event',
  'import timekeeping',
  'print payslip',
  'print btr',
  'export payroll ledger',
  'payroll adjustment',
] as const;

type ActionOption = typeof ACTION_OPTIONS[number];

export function AuditLogsActionFilter({
  value = 'All',
  onSelect,
  className,
}: {
  value?: string;
  onSelect: (value: ActionOption | string) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const LABELS: Record<string, string> = {
    All: 'All Actions',
    'run payroll': 'Run payroll',
    'run 13th month pay': 'Run 13th month pay',
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
    'add calendar event': 'Add calendar event',
    'import timekeeping': 'Import timekeeping',
    'print payslip': 'Print payslip',
    'print btr': 'Print BTR',
    'export payroll ledger': 'Export payroll ledger',
    'payroll adjustment': 'Payroll adjustment',
  };

  const displayLabel = (opt: string) => LABELS[opt] ?? opt;

  const label = value && value.toLowerCase() !== 'all' ? displayLabel(value) : 'Filter by Action';

  const renderIcon = (opt: string) => {
    const key = opt.toLowerCase();
    switch (key) {
      case 'all':
        return <ListFilter className="size-4 text-muted-foreground" />;
      case 'run payroll':
        return <Calculator className="size-4 text-muted-foreground" />;
      case 'run 13th month pay':
        return <Gift className="size-4 text-muted-foreground" />;
      case 'created':
        return <PlusCircle className="size-4 text-muted-foreground" />;
      case 'updated':
        return <Pencil className="size-4 text-muted-foreground" />;
      case 'deleted':
        return <Trash2 className="size-4 text-muted-foreground" />;
      case 'add calendar event':
        return <CalendarPlus className="size-4 text-muted-foreground" />;
      case 'import timekeeping':
        return <FileUp className="size-4 text-muted-foreground" />;
      case 'print payslip':
      case 'print btr':
        return <Printer className="size-4 text-muted-foreground" />;
      case 'export payroll ledger':
        return <Download className="size-4 text-muted-foreground" />;
      case 'payroll adjustment':
        return <Settings2 className="size-4 text-muted-foreground" />;
      default:
        return <ListFilter className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`gap-2 ${className ?? ''}`}>
          <ListFilter className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 overflow-hidden max-h-80">
        <Command>
          <CommandInput placeholder="Search Actions" />
          <ScrollArea className="h-48" type="always">
            <CommandList className="max-h-none overflow-y-visible pr-2">
              <CommandEmpty>No actions found.</CommandEmpty>
              <CommandGroup>
                {ACTION_OPTIONS.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={(val) => {
                      onSelect(val);
                      setOpen(false);
                    }}
                  >
                    {renderIcon(opt)}
                    <span className="text-sm">{displayLabel(opt)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default AuditLogsActionFilter;
