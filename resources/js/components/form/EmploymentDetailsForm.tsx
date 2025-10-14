// Employment details form
import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { Briefcase, AlertTriangle, Asterisk } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmployeeType } from '@/components/employee-type';
import { EmployeeStatus } from '@/components/employee-status';
import CollegeProgramScrollArea from '@/components/college-program-scroll-area';
import EmployeeCollegeRadioDepartment from '@/components/employee-college-radio-department';

type EmployeeFormData = {
    roles: string;
    employee_types: Record<string, string>;
    employee_status: string;
    college_program: string;
    rate_per_hour?: string;
    base_salary?: string;
    honorarium?: string;
    college_work_hours?: string;
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

export function EmploymentDetailsForm({ form }: EmploymentDetailsFormProps) {
    const { data, setData, errors, clearErrors } = form;

    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isCollege, setIsCollege] = React.useState(false);
    const [isBasicEdu, setIsBasicEdu] = React.useState(false);
    const [isOthers, setIsOthers] = React.useState(false);
    const [othersRoleText, setOthersRoleText] = React.useState('');
    const [collegeProgram, setCollegeProgram] = React.useState('');

    // We only need to compute this once per render, so useMemo is fine
    const rolesArr = React.useMemo(() => data.roles.split(',').map(r => r.trim()).filter(Boolean), [data.roles]);

    // This effect initializes local state from form data and should only run on mount
    React.useEffect(() => {
        const currentRoles = data.roles.split(',').map(r => r.trim()).filter(Boolean);
        setIsAdmin(currentRoles.includes('administrator'));
        setIsCollege(currentRoles.includes('college instructor'));
        setIsBasicEdu(currentRoles.includes('basic education instructor'));

        // Find the custom role and set others state
        const customRole = currentRoles.find(r => !STANDARD_ROLES.includes(r));
        setIsOthers(!!customRole);
        setOthersRoleText(customRole || '');
        setCollegeProgram(data.college_program);

    }, []); // Empty dependency array ensures this only runs on mount

    // This effect updates form data based on local state (user interaction)
    React.useEffect(() => {
        const newRoles: string[] = [];
        if (isAdmin) newRoles.push('administrator');
        if (isCollege) newRoles.push('college instructor');
        if (isBasicEdu) newRoles.push('basic education instructor');
        if (isOthers && othersRoleText.trim()) {
            newRoles.push(othersRoleText.trim().toLowerCase());
        }

        const newRolesString = newRoles.join(', ');
        // Prevent infinite loop by only updating if the value has changed
        if (data.roles !== newRolesString) {
            setData('roles', newRolesString);
        }
    }, [isAdmin, isCollege, isBasicEdu, isOthers, othersRoleText, setData, data.roles]);

    // Update form data for college program
    React.useEffect(() => {
        if (data.college_program !== collegeProgram) {
            setData('college_program', collegeProgram);
        }
    }, [collegeProgram, data.college_program, setData]);

    // This effect handles renaming the custom role in employee_types to preserve the selection
    const customRole = React.useMemo(() => rolesArr.find(r => !STANDARD_ROLES.includes(r)), [rolesArr]);
    const prevCustomRoleRef = React.useRef<string | undefined>();

    React.useEffect(() => {
        const prevCustomRole = prevCustomRoleRef.current;
        if (customRole && prevCustomRole && customRole !== prevCustomRole) {
            if (data.employee_types[prevCustomRole]) {
                const newEmployeeTypes = { ...data.employee_types };
                newEmployeeTypes[customRole] = newEmployeeTypes[prevCustomRole];
                delete newEmployeeTypes[prevCustomRole];
                setData('employee_types', newEmployeeTypes);
            }
        }
        prevCustomRoleRef.current = customRole;
    }, [customRole, data.employee_types, setData]);


    // Update employee types when roles change
    React.useEffect(() => {
        const newEmployeeTypes: Record<string, string> = {};
        let shouldUpdate = false;
        rolesArr.forEach(role => {
            const mappingKey = STANDARD_ROLES.includes(role) ? role : 'others';
            // Use existing value if available, otherwise use default
            const defaultValue = roleTypeMappings[mappingKey as keyof typeof roleTypeMappings][0];
            newEmployeeTypes[role] = data.employee_types[role] || defaultValue;

            // Check if we need to update to a new default
            if (!data.employee_types[role]) {
                shouldUpdate = true;
            }
        });

        // Remove types for roles that no longer exist
        Object.keys(data.employee_types).forEach(oldRole => {
            if (!rolesArr.includes(oldRole)) {
                shouldUpdate = true;
            }
        });

        if (shouldUpdate || Object.keys(data.employee_types).length !== rolesArr.length) {
            setData('employee_types', newEmployeeTypes);
        }
    }, [rolesArr, data.employee_types, setData]);

    const availableStatuses = ['Active', 'Paid Leave', 'Maternity Leave', 'Sick Leave', 'Study Leave'];

    const ErrorDisplay = ({ field }: { field: keyof typeof errors }) => {
        if (!errors[field]) return null;
        return (
            <div className="mt-2 flex items-center rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="ml-1 h-4 w-4 shrink-0" />
                <p className="ml-2 text-xs font-medium">{errors[field]}</p>
            </div>
        );
    };

    return (
        <Card className="w-full shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 dark:bg-primary p-2 rounded-full"><Briefcase className="h-6 w-6 text-primary dark:text-primary-foreground" /></div>
                    <div>
                        <CardTitle>Employment Details</CardTitle>
                        <CardDescription>Specify roles, types, and status.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Label className="font-semibold flex items-center">
                        Employee Roles <Asterisk className="h-4 w-4 text-destructive ml-1" />
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2">
                            <Checkbox id="role-admin" checked={isAdmin} onCheckedChange={(c) => setIsAdmin(!!c)} />
                            <Label htmlFor="role-admin" className="cursor-pointer font-normal">Administrator</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="role-college"
                                checked={isCollege}
                                onCheckedChange={(c) => {
                                    const isChecked = !!c;
                                    setIsCollege(isChecked);
                                    if (!isChecked) {
                                        setData('college_work_hours', '');
                                        setData('college_program', '');
                                        setCollegeProgram('');
                                    }
                                }}
                            />
                            <Label htmlFor="role-college" className="cursor-pointer font-normal">College Instructor</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="role-basicedu" checked={isBasicEdu} onCheckedChange={(c) => setIsBasicEdu(!!c)} />
                            <Label htmlFor="role-basicedu" className="cursor-pointer font-normal">Basic Education</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="role-others" checked={isOthers} onCheckedChange={(c) => { setIsOthers(!!c); setOthersRoleText(''); }} />
                            <Label htmlFor="role-others" className="cursor-pointer font-normal">Others</Label>
                        </div>
                    </div>
                    <ErrorDisplay field="roles" />
                    <div className="pl-6 space-y-4 pt-2">
                        <AnimatePresence>
                            {isOthers && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-1 space-y-2">
                                        <Label htmlFor="other-role-input" className="font-semibold flex items-center">
                                            Specify Other Role <Asterisk className="h-4 w-4 text-destructive ml-1" />
                                        </Label>
                                        <Input id="other-role-input" type="text" placeholder="Specify other role" value={othersRoleText} onChange={e => setOthersRoleText(e.target.value)} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {isCollege && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-2">
                                        <Label className="text-sm font-semibold mb-2 block flex items-center">
                                            College Dept. <Asterisk className="h-4 w-4 text-destructive ml-1" />
                                        </Label>
                                        <CollegeProgramScrollArea>
                                            <EmployeeCollegeRadioDepartment
                                                value={collegeProgram}
                                                onChange={(value) => {
                                                    setCollegeProgram(value);
                                                    clearErrors('college_program');
                                                }}
                                            />
                                        </CollegeProgramScrollArea>
                                        <ErrorDisplay field="college_program" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                    <div className="flex flex-col gap-2">
                        {rolesArr.length > 0 ? (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {rolesArr.map((role) => {
                                        const isStandardRole = STANDARD_ROLES.includes(role);
                                        const roleLabel = isStandardRole ? role : othersRoleText || 'Others';
                                        const mappingKey = isStandardRole ? role : 'others';
                                        const options = roleTypeMappings[mappingKey as keyof typeof roleTypeMappings];
                                        const motionKey = isStandardRole ? role : 'others-role';

                                        return (
                                            <motion.div
                                                key={motionKey}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex flex-col gap-2 p-1">
                                                    <Label htmlFor={`type-${role}`} className="font-semibold capitalize flex items-center">
                                                        {roleLabel} Type <Asterisk className="h-4 w-4 text-destructive ml-1" />
                                                    </Label>
                                                    <EmployeeType
                                                        value={data.employee_types[role] || ''}
                                                        onChange={val => setData('employee_types', { ...data.employee_types, [role]: val })}
                                                        types={options.map(opt => ({ value: opt, label: opt }))}
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                                <ErrorDisplay field="employee_types" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Label className="font-semibold text-muted-foreground flex items-center">
                                    Employee Type <Asterisk className="h-4 w-4 text-destructive ml-1" />
                                </Label>
                                <Input disabled placeholder="Select a role first" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="employee_status" className="font-semibold flex items-center">
                            Employee Status <Asterisk className="h-4 w-4 text-destructive ml-1" />
                        </Label>
                        <EmployeeStatus
                            value={data.employee_status}
                            onChange={val => setData('employee_status', val)}
                            statuses={availableStatuses}
                            disabled={rolesArr.length === 0}
                        />
                        <ErrorDisplay field="employee_status" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}