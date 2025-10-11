import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { Briefcase, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
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
    rate_per_hour?: string; // Add optional fields to type for clearErrors
    base_salary?: string;
    honorarium?: string;
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
    const { data, setData, errors, clearErrors } = form;

    // Your original state logic (unchanged)
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isCollege, setIsCollege] = React.useState(false);
    const [isBasicEdu, setIsBasicEdu] = React.useState(false);
    const [isOthers, setIsOthers] = React.useState(false);
    const [othersRoleText, setOthersRoleText] = React.useState('');
    const [collegeProgram, setCollegeProgram] = React.useState('');
    const [currentTypeIndex, setCurrentTypeIndex] = React.useState(0);

    const rolesArr = React.useMemo(() => data.roles.split(',').map(r => r.trim()).filter(Boolean), [data.roles]);

    // Your original useEffect hooks (unchanged, with error clearing added)
    React.useEffect(() => {
        const rolesArr = data.roles.split(',').map(r => r.trim()).filter(Boolean);
        setIsAdmin(rolesArr.includes('administrator'));
        setIsCollege(rolesArr.includes('college instructor'));
        setIsBasicEdu(rolesArr.includes('basic education instructor'));
        const customRole = rolesArr.find(r => !STANDARD_ROLES.includes(r));
        setIsOthers(!!customRole);
        if (customRole && customRole !== 'others') {
            setOthersRoleText(customRole);
        } else if (!customRole) {
            setOthersRoleText('');
        }
    }, [data.roles]);

    React.useEffect(() => {
        const newRoles: string[] = [];
        if (isAdmin) newRoles.push('administrator');
        if (isCollege) newRoles.push('college instructor');
        if (isBasicEdu) newRoles.push('basic education instructor');
        if (isOthers && othersRoleText.trim()) {
            newRoles.push(othersRoleText.trim().toLowerCase());
        } else if (isOthers) {
            newRoles.push('others');
        }
        setData('roles', newRoles.join(', '));

        const requiresBaseSalary = newRoles.includes('administrator') || newRoles.includes('basic education instructor');
        if (!requiresBaseSalary && errors.base_salary) {
            clearErrors('base_salary');
        }
        
        const requiresRatePerHour = newRoles.includes('college instructor');
        if (!requiresRatePerHour && errors.rate_per_hour) {
            clearErrors('rate_per_hour');
        }
        
        // --- THE FIX IS HERE ---
        // If the "Others" role is not present, clear any errors for 'honorarium'.
        const requiresHonorarium = newRoles.some(r => !STANDARD_ROLES.includes(r) && r !== 'others');
        if (!isOthers && errors.honorarium) {
            clearErrors('honorarium');
        }
        
    }, [isAdmin, isCollege, isBasicEdu, isOthers, othersRoleText, setData, errors, clearErrors]);

    React.useEffect(() => {
        setData('college_program', collegeProgram);
        if (collegeProgram && errors.college_program) {
            clearErrors('college_program');
        }
    }, [collegeProgram, setData, errors.college_program, clearErrors]);

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
    }, [data.roles]);

    const availableStatuses = ['Active', 'Paid Leave', 'Maternity Leave', 'Sick Leave', 'Study Leave'];
    const selectedRoles = data.roles.split(',').map(r => r.trim()).filter(Boolean);
    const visibleRoleKey = selectedRoles[currentTypeIndex] ?? '';
    const visibleRoleLabel = visibleRoleKey === othersRoleText.trim().toLowerCase() ? othersRoleText.trim() : visibleRoleKey;
    let visibleRoleOptions: string[] = [];
    if (STANDARD_ROLES.includes(visibleRoleKey)) {
        visibleRoleOptions = roleTypeMappings[visibleRoleKey as keyof typeof roleTypeMappings];
    } else if (visibleRoleKey) {
        visibleRoleOptions = roleTypeMappings.others;
    }
    
    const ErrorDisplay = ({ field }: { field: keyof typeof errors }) => {
        if (!errors[field]) return null;
        return (
            <div className="mt-2 flex items-center rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="ml-2 text-xs font-medium">{errors[field]}</p>
            </div>
        );
    };

    return (
        <Card className="w-full border-gray-200 shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full"><Briefcase className="h-6 w-6 text-primary" /></div>
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
                            <Checkbox id="role-admin" checked={isAdmin} onCheckedChange={(c) => setIsAdmin(!!c)} />
                            <Label htmlFor="role-admin" className="cursor-pointer font-normal">Administrator</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="role-college" checked={isCollege} onCheckedChange={(c) => setIsCollege(!!c)} />
                            <Label htmlFor="role-college" className="cursor-pointer font-normal">College Instructor</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="role-basicedu" checked={isBasicEdu} onCheckedChange={(c) => setIsBasicEdu(!!c)} />
                            <Label htmlFor="role-basicedu" className="cursor-pointer font-normal">Basic Education</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="role-others" checked={isOthers} onCheckedChange={(c) => setIsOthers(!!c)} />
                            <Label htmlFor="role-others" className="cursor-pointer font-normal">Others</Label>
                        </div>
                    </div>
                    <ErrorDisplay field="roles" />
                    <div className="pl-6 space-y-4 pt-2">
                        {isOthers && <Input type="text" placeholder="Specify other role" value={othersRoleText} onChange={e => setOthersRoleText(e.target.value)} />}
                        {isCollege && (
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">College Dept.</Label>
                                <CollegeProgramScrollArea><EmployeeCollegeRadioDepartment value={collegeProgram} onChange={setCollegeProgram} /></CollegeProgramScrollArea>
                                <ErrorDisplay field="college_program" />
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                    <div className="flex flex-col gap-2">
                        {selectedRoles.length > 0 ? (
                            <div className="space-y-4">
                                {selectedRoles.map((role) => {
                                    const roleLabel = STANDARD_ROLES.includes(role) ? role : othersRoleText || 'Others';
                                    const mappingKey = STANDARD_ROLES.includes(role) ? role : 'others';
                                    const options = roleTypeMappings[mappingKey as keyof typeof roleTypeMappings];

                                    return (
                                        <div key={role} className="flex flex-col gap-2">
                                            <Label htmlFor={`type-${role}`} className="font-semibold capitalize">{roleLabel} Type</Label>
                                            <EmployeeType
                                                value={data.employee_types[role] || ''}
                                                onChange={val => setData('employee_types', { ...data.employee_types, [role]: val })}
                                                types={options.map(opt => ({ value: opt, label: opt }))}
                                            />
                                        </div>
                                    );
                                })}
                                <ErrorDisplay field="employee_types" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Label className="font-semibold text-muted-foreground">Employee Type</Label>
                                <Input disabled placeholder="Select a role first" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="employee_status" className="font-semibold">Employee Status</Label>
                        <EmployeeStatus
                            value={data.employee_status}
                            onChange={val => setData('employee_status', val)}
                            statuses={availableStatuses}
                            disabled={selectedRoles.length === 0}
                        />
                        <ErrorDisplay field="employee_status" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}