import { useState, useEffect } from "react";
import { calculateGrossPay } from "@/utils/salaryFormulas";

export interface PayrollSummary {
    tardiness: number;
    undertime: number;
    overtime: number;
    absences: number;
    base_salary: number;
    rate_per_day: number;
    rate_per_hour: number;
    overtime_pay_total: number;
    overtime_count_weekdays: number;
    overtime_count_weekends: number;
    gross_pay: number;
    college_rate?: number;
    total_hours?: number;
}

export function useEmployeePayroll(employeeId: number | string | null, month: string | null, employee?: any) {
    const [summary, setSummary] = useState<PayrollSummary | null>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (!employeeId || !month) {
            setSummary(null);
            return;
        }
        setLoading(true);
        fetch(
            route("timekeeping.employee.monthly-summary", {
                employee_id: employeeId,
                month,
            })
        )
            .then((response) => response.json())
            .then((result) => {
                if (result.success) {
                    // Determine if College Instructor
                    const isCollege = employee && typeof employee.roles === 'string' && employee.roles.toLowerCase().includes('college instructor');
                    // Try to get college_rate from employee, fallback to result.rate_per_hour if not present
                    let college_rate = undefined;
                    if (isCollege) {
                        if (employee && typeof employee.college_rate === 'number') {
                            college_rate = employee.college_rate;
                        } else if (typeof result.college_rate === 'number') {
                            college_rate = result.college_rate;
                        } else if (typeof result.college_rate === 'string' && result.college_rate !== '') {
                            college_rate = parseFloat(result.college_rate);
                        } else if (typeof result.rate_per_hour === 'number') {
                            college_rate = result.rate_per_hour;
                        }
                    }
                    let total_hours = undefined;
                    let overtime = Number(result.overtime ?? 0);
                    let absences = Number(result.absences ?? 0);
                    let undertime = Number(result.undertime ?? 0);
                    let tardiness = Number(result.tardiness ?? 0);
                    if (typeof result.total_hours === 'number') {
                        total_hours = result.total_hours;
                    } else if (typeof result.total_hours === 'string' && result.total_hours !== '') {
                        total_hours = parseFloat(result.total_hours);
                    } else if (!isNaN(overtime) && !isNaN(absences) && !isNaN(undertime) && !isNaN(tardiness)) {
                        total_hours = overtime + absences + undertime + tardiness;
                    }
                    // For College Instructor, use actual total_hours (actual hours worked) for gross pay calculation
                    const grossPay = isCollege
                        ? calculateGrossPay(
                            0, // baseSalary not used
                            Number(result.overtime_pay_total ?? 0),
                            college_rate ?? 0,
                            tardiness,
                            undertime,
                            absences,
                            { role: 'College Instructor', college_rate, totalHours: total_hours }
                        )
                        : calculateGrossPay(
                            Number(result.base_salary ?? 0),
                            Number(result.overtime_pay_total ?? 0),
                            Number(result.rate_per_hour ?? 0),
                            tardiness,
                            undertime,
                            absences
                        );
                    setSummary({
                        tardiness: result.tardiness ?? 0,
                        undertime: result.undertime ?? 0,
                        overtime: result.overtime ?? 0,
                        absences: result.absences ?? 0,
                        base_salary: result.base_salary ?? 0,
                        rate_per_day: result.rate_per_day ?? 0,
                        rate_per_hour: result.rate_per_hour ?? 0,
                        overtime_pay_total: result.overtime_pay_total ?? 0,
                        overtime_count_weekdays: result.overtime_count_weekdays ?? 0,
                        overtime_count_weekends: result.overtime_count_weekends ?? 0,
                        gross_pay: grossPay,
                        college_rate: isCollege ? college_rate : undefined,
                        total_hours,
                    });
                } else {
                    setSummary(null);
                }
            })
            .catch(() => setSummary(null))
            .finally(() => setLoading(false));
    }, [employeeId, month, employee]);
    return { summary, loading };
}
