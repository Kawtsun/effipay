import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EmployeeType } from '@/components/employee-type';
import { EmployeeStatus } from '@/components/employee-status';
import CollegeProgramScrollArea from '@/components/college-program-scroll-area';
import EmployeeCollegeRadioDepartment from '@/components/employee-college-radio-department';

type EmployeeFormData = {
    roles: string;
    employee_types: Record<string, string>;
    employee_status: string;
    college_program: string;
    [key: string]: any;
};

interface EmploymentDetailsFormProps {
    form: UseFormReturn<EmployeeFormData>;
    salaryDefaults: any;
}

const roleTypeMappings = {
  administrator: ['Regular', 'Provisionary', 'Retired'],
  'college instructor': ['Full Time', 'Part Time', 'Provisionary', 'Retired'],
  'basic education instructor': ['Full Time', 'Part Time', 'Provisionary', 'Retired'],
  others: ['Part Time'],
};

const STANDARD_ROLES = ['administrator', 'college instructor', 'basic education instructor'];

export function EmploymentDetailsForm({ form, salaryDefaults }: EmploymentDetailsFormProps) {
    const { data, setData, errors } = form;

    // --- REFACTORED STATE LOGIC ---
    // The checked status of the boxes is now derived directly from the form data.
    const rolesArr = React.useMemo(() => data.roles.split(',').map(r => r.trim()).filter(Boolean), [data.roles]);
    
    const isAdmin = React.useMemo(() => rolesArr.includes('administrator'), [rolesArr]);
    const isCollege = React.useMemo(() => rolesArr.includes('college instructor'), [rolesArr]);
    const isBasicEdu = React.useMemo(() => rolesArr.includes('basic education instructor'), [rolesArr]);
    
    // For "Others", we check if there's any role that isn't a standard one.
    const customRole = React.useMemo(() => rolesArr.find(r => !STANDARD_ROLES.includes(r)), [rolesArr]);
    const isOthers = !!customRole;

    // These states are for UI elements that are not part of the main form data string initially
    const [othersRoleText, setOthersRoleText] = React.useState(customRole || '');
    const [collegeProgram, setCollegeProgram] = React.useState(data.college_program || '');
    const [currentTypeIndex, setCurrentTypeIndex] = React.useState(0);

    // This handler directly manipulates the `roles` string in the form data.
    const handleRoleChange = (role: string, isChecked: boolean) => {
        const currentRoles = new Set(rolesArr);
        if (isChecked) {
            currentRoles.add(role);
        } else {
            currentRoles.delete(role);
        }
        setData('roles', Array.from(currentRoles).join(', '));
    };
    
    // Special handler for the 'Others' checkbox
    const handleOthersChange = (isChecked: boolean) => {
        const currentRoles = new Set(rolesArr);
        // Remove any existing custom role first
        if (customRole) {
            currentRoles.delete(customRole);
        }
        // If checking 'Others', add the text from the input field
        if (isChecked && othersRoleText.trim()) {
            currentRoles.add(othersRoleText.trim().toLowerCase());
        }
        // If unchecking, clear the text field
        if (!isChecked) {
            setOthersRoleText('');
        }
        setData('roles', Array.from(currentRoles).join(', '));
    };

    // Sync the 'Others' input text with the roles string
    React.useEffect(() => {
        // Only run this logic if the 'Others' checkbox is actually checked
        if (isOthers) {
            const currentRoles = new Set(rolesArr);
            // If there was a custom role, remove it before adding the new one
            if (customRole) {
                currentRoles.delete(customRole);
            }
            if (othersRoleText.trim()) {
                currentRoles.add(othersRoleText.trim().toLowerCase());
            }
            setData('roles', Array.from(currentRoles).join(', '));
        }
    }, [othersRoleText]); // Only depends on the text input
    
    // Sync college program state with form data
    React.useEffect(() => {
        setData('college_program', collegeProgram);
    }, [collegeProgram, setData]);
    
    // This effect now correctly initializes and cleans up employee_types when roles change
    React.useEffect(() => {
        const newEmployeeTypes: Record<string, string> = {};
        rolesArr.forEach(role => {
            const mappingKey = STANDARD_ROLES.includes(role) ? role : 'others';
            newEmployeeTypes[role] = data.employee_types[role] || roleTypeMappings[mappingKey as keyof typeof roleTypeMappings][0];
        });
        setData('employee_types', newEmployeeTypes);

        if (currentTypeIndex >= rolesArr.length) {
            setCurrentTypeIndex(Math.max(0, rolesArr.length - 1));
        }
    }, [data.roles]); // Depends only on the roles string from the form


    const availableStatuses = ['Active', 'Paid Leave', 'Maternity Leave', 'Sick Leave', 'Study Leave'];
    const visibleRoleKey = rolesArr[currentTypeIndex] ?? '';
    const visibleRoleLabel = visibleRoleKey;
    let visibleRoleOptions: string[] = [];
    if (STANDARD_ROLES.includes(visibleRoleKey)) {
        visibleRoleOptions = roleTypeMappings[visibleRoleKey as keyof typeof roleTypeMappings];
    } else if (visibleRoleKey) { // This handles custom roles
        visibleRoleOptions = roleTypeMappings.others;
    }

    return (
        <Card className="w-full border-gray-200 shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Employment Details</CardTitle>
                        <CardDescription>Specify roles, types, and status.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Label className="font-semibold">Employee Roles</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2">
                            <Checkbox id="role-admin" checked={isAdmin} onCheckedChange={(c) => handleRoleChange('administrator', !!c)} />
                            <Label htmlFor="role-admin" className="cursor-pointer font-normal">Administrator</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="role-college" checked={isCollege} onCheckedChange={(c) => handleRoleChange('college instructor', !!c)} />
                            <Label htmlFor="role-college" className="cursor-pointer font-normal">College Instructor</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="role-basicedu" checked={isBasicEdu} onCheckedChange={(c) => handleRoleChange('basic education instructor', !!c)} />
                            <Label htmlFor="role-basicedu" className="cursor-pointer font-normal">Basic Education</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="role-others" checked={isOthers} onCheckedChange={(c) => handleOthersChange(!!c)} />
                            <Label htmlFor="role-others" className="cursor-pointer font-normal">Others</Label>
                        </div>
                    </div>
                    <div className="pl-6 space-y-4 pt-2">
                        {isOthers && (
                            <Input
                                type="text"
                                placeholder="Specify other role"
                                value={othersRoleText}
                                onChange={e => setOthersRoleText(e.target.value)}
                            />
                        )}
                        {isCollege && (
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">College Dept.</Label>
                                <CollegeProgramScrollArea>
                                    <EmployeeCollegeRadioDepartment
                                        value={collegeProgram}
                                        onChange={setCollegeProgram}
                                    />
                                </CollegeProgramScrollArea>
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                    <div className="flex flex-col gap-2">
                        {rolesArr.length > 0 ? (
                            <>
                                <Label htmlFor={`type-${visibleRoleKey}`} className="font-semibold capitalize">{visibleRoleLabel} Type</Label>
                                <div className="flex items-center gap-2">
                                    {rolesArr.length > 1 && (
                                        <Button type="button" variant="outline" size="icon" className="size-8 shrink-0" onClick={() => setCurrentTypeIndex(p => p - 1)} disabled={currentTypeIndex === 0}>
                                            <span className="sr-only">Prev</span>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <EmployeeType
                                        value={data.employee_types[visibleRoleKey] || ''}
                                        onChange={val => setData('employee_types', { ...data.employee_types, [visibleRoleKey]: val })}
                                        types={visibleRoleOptions.map(opt => ({ value: opt, label: opt }))}
                                    />
                                    {rolesArr.length > 1 && (
                                        <Button type="button" variant="outline" size="icon" className="size-8 shrink-0" onClick={() => setCurrentTypeIndex(p => p + 1)} disabled={currentTypeIndex === rolesArr.length - 1}>
                                            <span className="sr-only">Next</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                {rolesArr.length > 1 && (
                                    <div className="text-center text-sm text-muted-foreground tabular-nums mt-2">
                                        Role {currentTypeIndex + 1} of {rolesArr.length}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Label className="font-semibold text-muted-foreground">Employee Type</Label>
                                <Input disabled placeholder="Select a role" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="employee_status" className="font-semibold">Employee Status</Label>
                        <EmployeeStatus
                            value={data.employee_status}
                            onChange={val => setData('employee_status', val)}
                            statuses={availableStatuses}
                            disabled={rolesArr.length === 0}
                        />
                        {errors.employee_status && <p className="text-sm text-red-600 mt-1">{errors.employee_status}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}