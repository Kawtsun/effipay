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

// This type should be expanded as we add more fields to the form
type EmployeeFormData = {
    first_name: string;
    middle_name: string;
    last_name: string;
    roles: string;
    employee_types: Record<string, string>; // Holds type for each role
    employee_status: string;
    college_program: string;
    // ... more fields
};

interface EmploymentDetailsFormProps {
    form: UseFormReturn<EmployeeFormData>;
    salaryDefaults: any;
}

// Defines the available employee types for each role
const roleTypeMappings = {
  administrator: ['Regular', 'Provisionary', 'Retired'],
  'college instructor': ['Full Time', 'Part Time', 'Provisionary', 'Retired'],
  'basic education instructor': ['Full Time', 'Part Time', 'Provisionary', 'Retired'],
  others: ['Part Time'],
};

export function EmploymentDetailsForm({ form, salaryDefaults }: EmploymentDetailsFormProps) {
    const { data, setData, errors } = form;

    // Local UI state for each checkbox
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isCollege, setIsCollege] = React.useState(false);
    const [isBasicEdu, setIsBasicEdu] = React.useState(false);
    const [isOthers, setIsOthers] = React.useState(false);
    const [othersRoleText, setOthersRoleText] = React.useState('');
    const [collegeProgram, setCollegeProgram] = React.useState('');
    
    // State to manage which role's type selector is currently visible
    const [currentTypeIndex, setCurrentTypeIndex] = React.useState(0);

    // Effect to sync roles and initialize/cleanup employee_types object
    React.useEffect(() => {
        // Use the function form of setData to get the latest state without causing a dependency loop
        setData(currentData => {
            const newRoles: string[] = [];
            const newEmployeeTypes: Record<string, string> = {};

            if (isAdmin) {
                newRoles.push('administrator');
                newEmployeeTypes.administrator = currentData.employee_types.administrator || roleTypeMappings.administrator[0];
            }
            if (isCollege) {
                newRoles.push('college instructor');
                newEmployeeTypes['college instructor'] = currentData.employee_types['college instructor'] || roleTypeMappings['college instructor'][0];
            }
            if (isBasicEdu) {
                newRoles.push('basic education instructor');
                newEmployeeTypes['basic education instructor'] = currentData.employee_types['basic education instructor'] || roleTypeMappings['basic education instructor'][0];
            }
            if (isOthers && othersRoleText.trim()) {
                const otherRoleKey = othersRoleText.trim().toLowerCase();
                newRoles.push(otherRoleKey);
                newEmployeeTypes[otherRoleKey] = currentData.employee_types[otherRoleKey] || roleTypeMappings.others[0];
            }
            
            // Reset index if it goes out of bounds
            if (currentTypeIndex >= newRoles.length) {
                setCurrentTypeIndex(Math.max(0, newRoles.length - 1));
            }

            return {
                ...currentData,
                roles: newRoles.join(', '),
                employee_types: newEmployeeTypes
            };
        });

    }, [isAdmin, isCollege, isBasicEdu, isOthers, othersRoleText, setData]);
    
    // Effect to sync college program with the main form data
    React.useEffect(() => {
        setData('college_program', collegeProgram);
    }, [collegeProgram, setData]);

    const availableStatuses = ['Active', 'Paid Leave', 'Maternity Leave', 'Sick Leave', 'Study Leave'];
    const selectedRoles = data.roles.split(',').map(r => r.trim()).filter(Boolean);
    
    // Get the key and label for the currently visible role
    const visibleRoleKey = selectedRoles[currentTypeIndex] ?? '';
    const visibleRoleLabel = visibleRoleKey === othersRoleText.trim().toLowerCase() ? othersRoleText.trim() : visibleRoleKey;
    
    // Safely get the options for the current role
    let visibleRoleOptions: string[] = [];
    if (visibleRoleKey in roleTypeMappings) {
        visibleRoleOptions = roleTypeMappings[visibleRoleKey as keyof typeof roleTypeMappings];
    } else if (isOthers && visibleRoleKey === othersRoleText.trim().toLowerCase()) {
        visibleRoleOptions = roleTypeMappings.others;
    }

    return (
        <Card className="w-full border-gray-200 shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full"><Briefcase className="h-6 w-6 text-primary" /></div>
                    <div>
                        <CardTitle>Employment Details</CardTitle>
                        <CardDescription>Specify the employee's roles, their employment types, and status.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Employee Roles Section */}
                <div className="space-y-4">
                    <Label className="font-semibold">Employee Roles</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2"><Checkbox id="role-admin" checked={isAdmin} onCheckedChange={(c) => setIsAdmin(!!c)} /><Label htmlFor="role-admin" className="cursor-pointer font-normal">Administrator</Label></div>
                        <div className="flex items-center gap-2"><Checkbox id="role-college" checked={isCollege} onCheckedChange={(c) => setIsCollege(!!c)} /><Label htmlFor="role-college" className="cursor-pointer font-normal">College Instructor</Label></div>
                        <div className="flex items-center gap-2"><Checkbox id="role-basicedu" checked={isBasicEdu} onCheckedChange={(c) => setIsBasicEdu(!!c)} /><Label htmlFor="role-basicedu" className="cursor-pointer font-normal">Basic Education Instructor</Label></div>
                        <div className="flex items-center gap-2"><Checkbox id="role-others" checked={isOthers} onCheckedChange={(c) => setIsOthers(!!c)} /><Label htmlFor="role-others" className="cursor-pointer font-normal">Others</Label></div>
                    </div>
                    <div className="pl-6 space-y-4 pt-2">
                        {isOthers && <Input type="text" placeholder="Please specify other role" value={othersRoleText} onChange={e => setOthersRoleText(e.target.value)} />}
                        {isCollege && (
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">College Department</Label>
                                <CollegeProgramScrollArea><EmployeeCollegeRadioDepartment value={collegeProgram} onChange={setCollegeProgram} /></CollegeProgramScrollArea>
                            </div>
                        )}
                    </div>
                </div>

                {/* Employee Type and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                    {/* Left Column: Employee Type (Cycling) */}
                    <div className="flex flex-col gap-2">
                        {selectedRoles.length > 0 ? (
                            <>
                                <Label htmlFor={`type-${visibleRoleKey}`} className="font-semibold capitalize">
                                    {visibleRoleLabel} Type
                                </Label>
                                <div className="flex items-center gap-2">
                                    {selectedRoles.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="size-8 shrink-0"
                                            onClick={() => setCurrentTypeIndex(prev => prev - 1)}
                                            disabled={currentTypeIndex === 0}
                                        >
                                            <span className="sr-only">Previous Role</span>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <EmployeeType
                                        value={data.employee_types[visibleRoleKey] || ''}
                                        onChange={val => setData('employee_types', { ...data.employee_types, [visibleRoleKey]: val })}
                                        types={visibleRoleOptions.map(opt => ({ value: opt, label: opt }))}
                                    />
                                    {selectedRoles.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="size-8 shrink-0"
                                            onClick={() => setCurrentTypeIndex(prev => prev + 1)}
                                            disabled={currentTypeIndex === selectedRoles.length - 1}
                                        >
                                            <span className="sr-only">Next Role</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                {selectedRoles.length > 1 && (
                                    <div className="text-center text-sm text-muted-foreground tabular-nums font-medium mt-2">
                                        Role {currentTypeIndex + 1} of {selectedRoles.length}
                                    </div>
                                )}
                            </>
                        ) : (
                             <div className="flex flex-col gap-2">
                                <Label className="font-semibold text-muted-foreground">Employee Type</Label>
                                <Input disabled placeholder="Select a role first" />
                            </div>
                        )}
                    </div>
                    
                    {/* Right Column: Employee Status */}
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

