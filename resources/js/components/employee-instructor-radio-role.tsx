import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import React from 'react';

interface EmployeeInstructorRadioRoleProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export default function EmployeeInstructorRadioRole({ value, onChange, className }: EmployeeInstructorRadioRoleProps) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-sm font-medium">Instructor</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
          <RadioGroupItem value="college instructor" />
          <span>College</span>
        </label>
        <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
          <RadioGroupItem value="basic education instructor" />
          <span>Basic Education</span>
        </label>
      </RadioGroup>
    </div>
  );
} 