import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import React from 'react';

const COLLEGE_PROGRAMS = [
  { value: 'BSBA', label: 'Bachelor of Science in Business Administration' },
  { value: 'BSA', label: 'Bachelor of Science in Accountancy' },
  { value: 'COELA', label: 'College of Education and Liberal Arts' },
  { value: 'BSCRIM', label: 'Bachelor of Science in Criminology' },
  { value: 'BSCS', label: 'Bachelor of Science in Computer Science' },
  { value: 'JD', label: 'Juris Doctor' },
  { value: 'BSN', label: 'Bachelor of Science in Nursing' },
  { value: 'RLE', label: 'Related Learning Experience' },
  { value: 'CG', label: 'Career Guidance or Computer Graphics' },
  { value: 'BSPT', label: 'Bachelor of Science in Physical Therapy' },
  { value: 'GSP', label: 'Graduate Studies Programs' },
  { value: 'MBA', label: 'Master of Business Administration' },
];

interface EmployeeCollegeRadioDepartmentProps {
  value: string;
  onChange: (val: string) => void;
  disabledOptions?: string[];
  className?: string;
}

export default function EmployeeCollegeRadioDepartment({ value, onChange, disabledOptions = [], className }: EmployeeCollegeRadioDepartmentProps) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className={className}>
      {COLLEGE_PROGRAMS.map((prog) => (
        <label key={prog.value} className="flex items-center gap-2 text-xs select-none cursor-pointer">
          <RadioGroupItem value={prog.value} disabled={disabledOptions.includes(prog.value)} />
          <span>{prog.label} <span className="ml-1 text-muted-foreground">({prog.value})</span></span>
        </label>
      ))}
    </RadioGroup>
  );
} 