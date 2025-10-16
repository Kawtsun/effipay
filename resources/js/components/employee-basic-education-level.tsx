import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import React from 'react';

const BASIC_EDU_LEVELS = [
    { value: 'Elementary', label: 'Elementary' },
    { value: 'High School', label: 'High School' },
    { value: 'Senior High School', label: 'Senior High School' },
];

interface EmployeeBasicEducationLevelProps {
    value: string;
    onChange: (val: string) => void;
    className?: string;
}

export default function EmployeeBasicEducationLevel({ value, onChange, className }: EmployeeBasicEducationLevelProps) {
    return (
        <RadioGroup value={value} onValueChange={onChange} className={className}>
            {BASIC_EDU_LEVELS.map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={level.value} id={`edu-level-${level.value}`} />
                    <Label htmlFor={`edu-level-${level.value}`} className="font-normal cursor-pointer">{level.label}</Label>
                </div>
            ))}
        </RadioGroup>
    )
}
