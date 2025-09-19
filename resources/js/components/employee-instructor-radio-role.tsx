import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import React from 'react';

interface EmployeeInstructorRadioRoleProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function EmployeeInstructorRadioRole({ value, onChange, className, disabled }: EmployeeInstructorRadioRoleProps) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className={className + ' flex flex-col gap-2'}>
      <label className={"flex items-center gap-2 text-sm select-none cursor-pointer" + (disabled ? ' opacity-50 pointer-events-none' : '')}>
        <RadioGroupItem value="college instructor" disabled={disabled} />
        <span>College</span>
      </label>
      <label className={"flex items-center gap-2 text-sm select-none cursor-pointer" + (disabled ? ' opacity-50 pointer-events-none' : '')}>
        <RadioGroupItem value="basic education instructor" disabled={disabled} />
        <span>Basic Education</span>
      </label>
    </RadioGroup>
  );
}