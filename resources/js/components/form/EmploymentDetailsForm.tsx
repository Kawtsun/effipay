import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmployeeStatus } from '@/components/employee-status';
import CollegeProgramScrollArea from '@/components/college-program-scroll-area';
import EmployeeCollegeRadioDepartment from '@/components/employee-college-radio-department';
import { EmployeeType } from '@/components/employee-type';

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

    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isCollege, setIsCollege] = React.useState(false);
    const [isBasicEdu, setIsBasicEdu] = React.useState(false);
    const [isOthers, setIsOthers] = React.useState(false);

    const [othersRoleText, setOthersRoleText] = React.useState('');
    const [collegeProgram, setCollegeProgram] = React.useState('');

    // Derived states from data.roles
    const rolesArr = React.useMemo(() => data.roles.split(',').map(r => r.trim()).filter(Boolean), [data.roles]);

    // This effect handles the role checkboxes from the form data
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

    // This effect syncs the local states back into the form data's roles string
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
    }, [isAdmin, isCollege, isBasicEdu, isOthers, othersRoleText, setData]);
    
    // Sync college program with form data
    React.useEffect(() => {
        setData('college_program', collegeProgram);
    }, [collegeProgram, setData]);
    
    // Initialize or clean up employee types when roles change
    React.useEffect(() => {
        const newEmployeeTypes: Record<string, string> = {};
        rolesArr.forEach(role => {
            const mappingKey = STANDARD_ROLES.includes(role) ? role : 'others';
            newEmployeeTypes[role] = data.employee_types[role] || roleTypeMappings[mappingKey as keyof typeof roleTypeMappings][0];
        });
        setData('employee_types', newEmployeeTypes);
    }, [data.roles]);

    const availableStatuses = ['Active', 'Paid Leave', 'Maternity Leave', 'Sick Leave', 'Study Leave'];
    const selectedRoles = data.roles.split(',').map(r => r.trim()).filter(Boolean);

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
                    <div className="pl-6 space-y-4 pt-2">
                        {isOthers && <Input type="text" placeholder="Specify other role" value={othersRoleText} onChange={e => setOthersRoleText(e.target.value)} />}
                        {isCollege && (
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">College Dept.</Label>
                                <CollegeProgramScrollArea>
                                    <EmployeeCollegeRadioDepartment value={collegeProgram} onChange={setCollegeProgram} />
                                </CollegeProgramScrollArea>
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
                                        <div key={role}>
                                            <Label htmlFor={`type-${role}`} className="font-semibold capitalize">
                                                {roleLabel} Type
                                            </Label>
                                            <EmployeeType
                                                value={data.employee_types[role] || ''}
                                                onChange={val => setData('employee_types', { ...data.employee_types, [role]: val })}
                                                types={options.map(opt => ({ value: opt, label: opt }))}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
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
                            disabled={selectedRoles.length === 0}
                        />
                        {errors.employee_status && <p className="text-sm text-red-600 mt-1">{errors.employee_status}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}