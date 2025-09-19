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
}

export function useEmployeePayroll(employeeId: number | string | null, month: string | null) {
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
                    const grossPay = calculateGrossPay(
                        Number(result.base_salary ?? 0),
                        Number(result.overtime_pay_total ?? 0),
                        Number(result.rate_per_hour ?? 0),
                        Number(result.tardiness ?? 0),
                        Number(result.undertime ?? 0),
                        Number(result.absences ?? 0)
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
                    });
                } else {
                    setSummary(null);
                }
            })
            .catch(() => setSummary(null))
            .finally(() => setLoading(false));
    }, [employeeId, month]);
    return { summary, loading };
}
