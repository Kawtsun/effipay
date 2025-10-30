import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import React from 'react';

interface OthersRole {
  value: string;
  label: string;
}

interface OthersRolesRadioProps {
  value: string;
  onChange: (val: string) => void;
  roles: OthersRole[];
  disabledOptions?: string[];
  className?: string;
}

export default function OthersRolesRadio({ 
  value, 
  onChange, 
  roles, 
  disabledOptions = [], 
  className 
}: OthersRolesRadioProps) {
  if (roles.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No custom roles available
      </div>
    );
  }

  return (
    <RadioGroup value={value} onValueChange={onChange} className={className}>
      {roles.map((role) => (
        <label key={role.value} className="flex items-center gap-2 text-xs select-none cursor-pointer">
          <RadioGroupItem value={role.value} disabled={disabledOptions.includes(role.value)} />
          <span className="capitalize">{role.label}</span>
        </label>
      ))}
    </RadioGroup>
  );
}
