/* eslint-disable @typescript-eslint/no-explicit-any */
// Employment details form
import * as React from 'react';
import { Briefcase, AlertTriangle, Asterisk } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmployeeType } from '@/components/employee-type';
import { EmployeeStatus } from '@/components/employee-status';
import CollegeProgramScrollArea from '@/components/college-program-scroll-area';
import EmployeeCollegeCheckboxDepartment from '@/components/employee-college-checkbox-department';



interface EmploymentDetailsFormProps {
    form: any;
    salaryDefaults: unknown;
    resetToken?: number; // triggers UI reset from parent
}

const roleTypeMappings = {
    administrator: ['Regular', 'Provisionary', 'Retired'],
    'college instructor': ['Full Time', 'Part Time', 'Provisionary', 'Retired'],
    'basic education instructor': ['Full Time', 'Part Time', 'Provisionary', 'Retired'],
    others: ['Part Time'],
};

const STANDARD_ROLES = ['administrator', 'college instructor', 'basic education instructor'];

export function EmploymentDetailsForm({ form, resetToken }: EmploymentDetailsFormProps) {
    const { data, setData, errors, clearErrors } = form;

    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isCollege, setIsCollege] = React.useState(false);
    const [isBasicEdu, setIsBasicEdu] = React.useState(false);
    const [isOthers, setIsOthers] = React.useState(false);
    const [othersRoleText, setOthersRoleText] = React.useState('');
    const [collegePrograms, setCollegePrograms] = React.useState<string[]>([]);

    // We only need to compute this once per render, so useMemo is fine
    const rolesArr = React.useMemo(() => data.roles.split(',').map((r: string) => r.trim()).filter(Boolean), [data.roles]);

    // This effect initializes local state from form data
    // It needs to run when resetToken changes (for reset functionality) and when data.roles/data.college_program change (for edit page initialization)
    React.useEffect(() => {
        const currentRoles = data.roles.split(',').map((r: string) => r.trim()).filter(Boolean);
        setIsAdmin(currentRoles.includes('administrator'));
        setIsCollege(currentRoles.includes('college instructor'));
        setIsBasicEdu(currentRoles.includes('basic education instructor'));

        // Find the custom role and set others state
        const customRole = currentRoles.find((r: string) => !STANDARD_ROLES.includes(r));
        setIsOthers(!!customRole);
        setOthersRoleText(customRole || '');
        setCollegePrograms(data.college_program ? data.college_program.split(',').map((p: string) => p.trim()) : []);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetToken]); // run when resetToken changes and on mount to initialize from incoming form data

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
        const newCollegeProgramString = collegePrograms.join(', ');
        if (data.college_program !== newCollegeProgramString) {
            setData('college_program', newCollegeProgramString);
        }
    }, [collegePrograms, data.college_program, setData]);

    // This effect handles renaming the custom role in employee_types to preserve the selection
    const customRole = React.useMemo(() => rolesArr.find((r: string) => !STANDARD_ROLES.includes(r)), [rolesArr]);
    const prevCustomRoleRef = React.useRef<string | undefined>(undefined);

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
    rolesArr.forEach((role: string) => {
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
            <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    {errors[field]}
                </AlertDescription>
            </Alert>
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
                                        setCollegePrograms([]);
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
                                        <Label className="text-sm font-semibold mb-2 flex items-center">
                                            College Program <Asterisk className="h-4 w-4 text-destructive ml-1" />
                                        </Label>
                                        <CollegeProgramScrollArea>
                                            <EmployeeCollegeCheckboxDepartment
                                                value={collegePrograms}
                                                onChange={(value) => {
                                                    setCollegePrograms(value);
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
                                    {rolesArr.map((role: string) => {
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