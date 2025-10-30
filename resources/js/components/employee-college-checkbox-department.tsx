import { Checkbox } from '@/components/ui/checkbox';
import React from 'react';
import { Label } from './ui/label';

const COLLEGE_PROGRAMS = [
  { value: 'BSBA', label: 'Bachelor of Science in Business Administration' },
  { value: 'BSA', label: 'Bachelor of Science in Accountancy' },
  { value: 'COELA', label: 'College of Education and Liberal Arts' },
  { value: 'BSCRIM', label: 'Bachelor of Science in Criminology' },
  { value: 'BSCS', label: 'Bachelor of Science in Computer Science' },
  { value: 'JD', label: 'Juris Doctor' },
  { value: 'BSN', label: 'Bachelor of Science in Nursing' },
  { value: 'RLE', label: 'Related Learning Experience' },
  { value: 'CG', label: 'Career Guidance' },
  { value: 'BSPT', label: 'Bachelor of Science in Physical Therapy' },
  { value: 'GSP', label: 'Graduate Studies Programs' },
  { value: 'MBA', label: 'Master of Business Administration' },
];

interface EmployeeCollegeCheckboxDepartmentProps {
  value: string[];
  onChange: (val: string[]) => void;
  disabledOptions?: string[];
  className?: string;
}

export default function EmployeeCollegeCheckboxDepartment({ value, onChange, disabledOptions = [], className }: EmployeeCollegeCheckboxDepartmentProps) {
  const handleCheckedChange = (checked: boolean, progValue: string) => {
    if (checked) {
      onChange([...value, progValue]);
    } else {
      onChange(value.filter((v) => v !== progValue));
    }
  };

  return (
    <div className={className}>
      {COLLEGE_PROGRAMS.map((prog) => (
        <Label key={prog.value} className="flex items-center gap-2 text-sm font-normal select-none cursor-pointer mb-2">
          <Checkbox
            id={`college-dept-${prog.value}`}
            checked={value.includes(prog.value)}
            onCheckedChange={(c) => handleCheckedChange(!!c, prog.value)}
            disabled={disabledOptions.includes(prog.value)}
          />
          <span>{prog.label} <span className="ml-1 text-muted-foreground">({prog.value})</span></span>
        </Label>
      ))}
    </div>
  );
} 