import * as React from "react";
import { Employees } from "@/types";
import { toast } from "sonner";
import { useEmployeePayroll } from "@/hooks/useEmployeePayroll";

// Types copied from current Report View Dialog for parity
export interface PayrollData {
  id: number;
  employee_id: number;
  month: string;
  payroll_date: string;
  base_salary: number;
  college_rate?: number;
  honorarium?: number;
  overtime?: number;
  sss: number;
  philhealth: number;
  pag_ibig: number;
  withholding_tax: number;
  tardiness?: number;
  undertime?: number;
  absences?: number;
  gross_pay: number;
  adjustments?: number | null;
  sss_salary_loan?: number;
  sss_calamity_loan?: number;
  pagibig_multi_loan?: number;
  pagibig_calamity_loan?: number;
  peraa_con?: number;
  tuition?: number;
  china_bank?: number;
  tea?: number;
  salary_loan?: number;
  calamity_loan?: number;
  multipurpose_loan?: number;
  total_deductions: number;
  net_pay: number;
  rate_per_hour?: number;
  overtime_count_weekdays?: number;
  overtime_count_weekends?: number;
}

export interface MonthlyPayrollData {
  payrolls: PayrollData[];
  month: string;
}

export type AdjustmentType = "add" | "deduct" | null;

export interface ReportDataRenderProps {
  // Month controls
  selectedMonth: string;
  pendingMonth: string;
  availableMonths: string[];
  handleMonthChange: (month: string) => void;
  setSelectedMonth: React.Dispatch<React.SetStateAction<string>>;
  setPendingMonth: React.Dispatch<React.SetStateAction<string>>;

  // Data
  monthlyPayrollData: MonthlyPayrollData | null;
  selectedPayroll: PayrollData | null;
  hasPayroll: boolean;
  isCollegeInstructorPayroll: boolean;

  // Computed helpers
  getSummaryCardAmount: (type: "tardiness" | "undertime" | "overtime" | "absences") => string;
  getSummaryCardHours: (type: "tardiness" | "undertime" | "overtime" | "absences") => string;

  // Earnings block data for UI
  earnings: {
    base_salary?: number | null;
    college_rate?: number | null;
    honorarium?: number | null;
    total_hours?: number | null;
  };

  // Loading flags
  loading: boolean;     // true while backend fetch or min skeleton
  minLoading: boolean;  // min skeleton hold flag

  // Other adjustments
  otherAdjustments: number | null;
  lastAdjustmentType: AdjustmentType;
}

export function ReportDataProvider({
  employee,
  children,
}: {
  employee: Employees | null;
  children: (props: ReportDataRenderProps) => React.ReactNode;
}) {
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [pendingMonth, setPendingMonth] = React.useState<string>("");
  const [availableMonths, setAvailableMonths] = React.useState<string[]>([]);

  const [monthlyPayrollData, setMonthlyPayrollData] = React.useState<MonthlyPayrollData | null>(null);
  const [loadingPayroll, setLoadingPayroll] = React.useState(false);
  const [minLoading, setMinLoading] = React.useState(false);
  const minLoadingTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [otherAdjustments, setOtherAdjustments] = React.useState<number | null>(null);
  const [lastAdjustmentType, setLastAdjustmentType] = React.useState<AdjustmentType>(null);

  // Keep parity with the dialog: timekeeping summary to compute overtime fallback, etc.
  interface EmployeePayrollSummary {
    rate_per_hour?: number;
    overtime_count_weekdays?: number;
    overtime_count_weekends?: number;
    tardiness?: number;
    undertime?: number;
    absences?: number;
    college_rate?: number;
    total_hours?: number;
  }
  const { summary: timekeepingSummary } = useEmployeePayroll(employee?.id ?? null, pendingMonth) as {
    summary?: EmployeePayrollSummary | null;
  };

  // Fetch merged months from backend (payroll + timekeeping)
  const fetchAvailableMonths = React.useCallback(async () => {
    try {
      const response = await fetch("/payroll/all-available-months");
      const result = await response.json();
      if (result.success) {
        setAvailableMonths(result.months);
        if (result.months.length > 0 && !selectedMonth) {
          setSelectedMonth(result.months[0]);
          setPendingMonth(result.months[0]);
        } else if (result.months.length === 0) {
          toast.error("No available months to display.");
        }
      }
    } catch (error) {
      console.error("Error fetching available months:", error);
    }
  }, [selectedMonth]);

  React.useEffect(() => {
    if (employee) fetchAvailableMonths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  const fetchMonthlyPayrollData = React.useCallback(async () => {
    if (!employee || !pendingMonth) return;
    setLoadingPayroll(true);
    setMinLoading(true);
    if (minLoadingTimeout.current) clearTimeout(minLoadingTimeout.current);
    minLoadingTimeout.current = setTimeout(() => setMinLoading(false), 400);
    try {
      const url = typeof route === "function"
        ? route("payroll.employee.monthly", { employee_id: employee.id, month: pendingMonth })
        : `/payroll/employee/${employee.id}/monthly?month=${encodeURIComponent(pendingMonth)}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setMonthlyPayrollData(result as MonthlyPayrollData);
      } else {
        setMonthlyPayrollData(null);
        toast.error("No payroll data found for this month");
      }
    } catch (error) {
      console.error("Error fetching monthly payroll data:", error);
      setMonthlyPayrollData(null);
    } finally {
      setTimeout(() => setLoadingPayroll(false), 100);
    }
  }, [employee, pendingMonth]);

  React.useEffect(() => {
    if (employee && pendingMonth) {
      fetchMonthlyPayrollData();
    } else {
      setMonthlyPayrollData(null);
    }
  }, [employee, pendingMonth, fetchMonthlyPayrollData]);

  // Initialize other adjustments from the latest payroll within the month
  React.useEffect(() => {
    try {
      if (monthlyPayrollData && Array.isArray(monthlyPayrollData.payrolls) && monthlyPayrollData.payrolls.length > 0) {
        const latest = monthlyPayrollData.payrolls.reduce((latest, curr) => {
          return new Date(curr.payroll_date) > new Date(latest.payroll_date) ? curr : latest;
        }, monthlyPayrollData.payrolls[0]);
        setOtherAdjustments(latest.adjustments ?? null);
        if (typeof latest.adjustments === "number") {
          setLastAdjustmentType(latest.adjustments < 0 ? "deduct" : "add");
        }
      } else {
        setOtherAdjustments(null);
        setLastAdjustmentType(null);
      }
    } catch (err) {
      console.error("Error initializing other adjustments:", err);
    }
  }, [monthlyPayrollData]);

  // React to external payroll adjustments
  React.useEffect(() => {
    type PayrollAdjustedDetail = {
      payroll: PayrollData;
      adjustment?: { type: "add" | "deduct" };
    };
    function onAdjusted(e: Event) {
      try {
        const detail = (e as CustomEvent<PayrollAdjustedDetail>).detail;
        if (detail && detail.payroll && detail.payroll.employee_id === employee?.id && detail.payroll.month === pendingMonth) {
          setMonthlyPayrollData((prev) => {
            if (!prev) return prev;
            const existing = prev.payrolls || [];
            const updatedPayroll = detail.payroll;
            const idx = existing.findIndex((p) => p.id === updatedPayroll.id);
            const newPayrolls = existing.slice();
            if (idx >= 0) {
              newPayrolls[idx] = { ...newPayrolls[idx], ...updatedPayroll };
            } else {
              newPayrolls.push(updatedPayroll);
            }
            return { ...prev, payrolls: newPayrolls } as MonthlyPayrollData;
          });
          setOtherAdjustments(detail?.payroll?.adjustments ?? null);
          if (detail?.adjustment?.type) {
            setLastAdjustmentType(detail.adjustment.type === "deduct" ? "deduct" : "add");
          }
        } else if (detail?.payroll && detail.payroll.employee_id === employee?.id) {
          if (detail.payroll.month === pendingMonth) {
            setOtherAdjustments(detail.payroll.adjustments ?? null);
            if (detail.adjustment?.type) {
              setLastAdjustmentType(detail.adjustment.type === "deduct" ? "deduct" : "add");
            }
          }
        }
      } catch (err) {
        console.error("Error handling payroll.adjusted event", err);
      }
    }
    window.addEventListener("payroll.adjusted", onAdjusted as EventListener);
    return () => window.removeEventListener("payroll.adjusted", onAdjusted as EventListener);
  }, [employee, pendingMonth]);

  // Derived values
  const hasPayroll = !!(monthlyPayrollData && monthlyPayrollData.payrolls && monthlyPayrollData.payrolls.length > 0);
  const selectedPayroll: PayrollData | null = React.useMemo(() => {
    if (!hasPayroll) return null;
    return monthlyPayrollData!.payrolls.reduce((latest, curr) => {
      return new Date(curr.payroll_date) > new Date(latest.payroll_date) ? curr : latest;
    }, monthlyPayrollData!.payrolls[0]);
  }, [hasPayroll, monthlyPayrollData]);

  const isCollegeInstructorPayroll = React.useMemo(() => {
    return !!(employee && typeof employee.roles === "string" && employee.roles.toLowerCase().includes("college instructor"));
  }, [employee]);

  // Helper used by the dialog to compute the monetary values for summary cards
  const getSummaryCardAmount = React.useCallback((type: "tardiness" | "undertime" | "overtime" | "absences") => {
    if (!hasPayroll) return "-";
    // Overtime amount: prefer payroll counts and payroll rate; fallback to timekeeping when missing
    if (type === "overtime") {
      let weekdayOvertime = 0;
      let weekendOvertime = 0;
      let rate = 0;
      if (selectedPayroll) {
        weekdayOvertime = Number(Number(selectedPayroll.overtime_count_weekdays ?? 0).toFixed(2));
        weekendOvertime = Number(Number(selectedPayroll.overtime_count_weekends ?? 0).toFixed(2));
        rate = isCollegeInstructorPayroll
          ? Number(selectedPayroll.college_rate ?? 0)
          : Number(selectedPayroll.rate_per_hour ?? NaN);
      } else if (timekeepingSummary) {
        // Only fall back to timekeeping when payroll record is not present
        weekdayOvertime = Number(Number(timekeepingSummary.overtime_count_weekdays ?? 0).toFixed(2));
        weekendOvertime = Number(Number(timekeepingSummary.overtime_count_weekends ?? 0).toFixed(2));
      }
      if (!Number.isFinite(rate) || rate <= 0) {
        const rFromTK = Number((timekeepingSummary as EmployeePayrollSummary | undefined)?.rate_per_hour ?? NaN);
        if (Number.isFinite(rFromTK)) rate = rFromTK;
      }
      const rateRounded = Number(Number(rate || 0).toFixed(2));
      const weekdayPay = rateRounded * 0.25 * weekdayOvertime;
      const weekendPay = rateRounded * 0.30 * weekendOvertime;
      const overtimePay = weekdayPay + weekendPay;
      return `₱${overtimePay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Non-OT amounts: prefer hours from payroll table to stay consistent with processed payroll
    const hoursFromPayroll = (() => {
      if (!selectedPayroll) return 0;
      switch (type) {
        case "tardiness":
          return Number(selectedPayroll.tardiness ?? 0);
        case "undertime":
          return Number(selectedPayroll.undertime ?? 0);
        case "absences":
          return Number(selectedPayroll.absences ?? 0);
        default:
          return 0;
      }
    })();

    // Rate resolution: college uses payroll.college_rate; non-college prefer payroll.rate_per_hour then TK
    let rate = isCollegeInstructorPayroll
      ? Number(selectedPayroll?.college_rate ?? 0)
      : Number(selectedPayroll?.rate_per_hour ?? NaN);
    if (!Number.isFinite(rate)) {
      const rFromTK = Number((timekeepingSummary as EmployeePayrollSummary | undefined)?.rate_per_hour ?? NaN);
      if (Number.isFinite(rFromTK)) rate = rFromTK;
      else rate = 0;
    }

    const hoursRounded = Number(Number(hoursFromPayroll || 0).toFixed(2));
    const rateRounded = Number(Number(rate || 0).toFixed(2));
    const amount = hoursRounded * rateRounded;
    return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [hasPayroll, isCollegeInstructorPayroll, selectedPayroll, timekeepingSummary]);

  const handleMonthChange = (month: string) => {
    if (month !== selectedMonth) {
      setSelectedMonth(month);
      setPendingMonth(month);
    }
  };

  const loading = loadingPayroll || minLoading;

  // Earnings data used by UI (Earnings column in ReportCards)
  const earnings = React.useMemo(() => {
    const base_salary = selectedPayroll?.base_salary ?? null;
    // Use college_rate strictly from payroll table for UI display
    const college_rate = ((): number | null => {
      const pr = selectedPayroll?.college_rate;
      return typeof pr === 'number' ? pr : null;
    })();
    const honorarium = selectedPayroll?.honorarium ?? null;
    const total_hours = (timekeepingSummary && typeof timekeepingSummary.total_hours === 'number')
      ? timekeepingSummary.total_hours
      : null;
    return { base_salary, college_rate, honorarium, total_hours };
  }, [selectedPayroll, timekeepingSummary]);

  // Helper to return hour counts for the summary cards (used for hover swap in UI)
  const getSummaryCardHours = React.useCallback((type: "tardiness" | "undertime" | "overtime" | "absences") => {
    if (!hasPayroll) return "-";
    // Prefer payroll values for hours
    if (type === "overtime") {
      let weekdayOvertime = Number(selectedPayroll?.overtime_count_weekdays ?? 0);
      let weekendOvertime = Number(selectedPayroll?.overtime_count_weekends ?? 0);
      if ((weekdayOvertime + weekendOvertime) === 0 && timekeepingSummary) {
        weekdayOvertime = Number(timekeepingSummary.overtime_count_weekdays ?? 0);
        weekendOvertime = Number(timekeepingSummary.overtime_count_weekends ?? 0);
      }
      const total = (weekdayOvertime || 0) + (weekendOvertime || 0);
      return Number.isFinite(total) ? `${Number(total).toFixed(2)} hr(s)` : "-";
    }
    const value = (() => {
      switch (type) {
        case "tardiness":
          return Number(selectedPayroll?.tardiness ?? 0);
        case "undertime":
          return Number(selectedPayroll?.undertime ?? 0);
        case "absences":
          return Number(selectedPayroll?.absences ?? 0);
        default:
          return 0;
      }
    })();
    // Fallback to timekeeping summary only when payroll record is not present (not for zero values)
    if (!selectedPayroll && timekeepingSummary) {
      const s = timekeepingSummary as EmployeePayrollSummary;
      const v = (() => {
        switch (type) {
          case "tardiness":
            return Number(s.tardiness ?? NaN);
          case "undertime":
            return Number(s.undertime ?? NaN);
          case "absences":
            return Number(s.absences ?? NaN);
          default:
            return NaN;
        }
      })();
      if (Number.isFinite(v)) return `${v.toFixed(2)} hr(s)`;
    }
    return Number.isFinite(value) ? `${Number(value).toFixed(2)} hr(s)` : "-";
  }, [hasPayroll, selectedPayroll, timekeepingSummary]);

  return (
    <>{children({
      selectedMonth,
      pendingMonth,
      availableMonths,
      handleMonthChange,
      setSelectedMonth,
      setPendingMonth,
      monthlyPayrollData,
      selectedPayroll,
      hasPayroll,
      isCollegeInstructorPayroll,
      getSummaryCardAmount,
      getSummaryCardHours,
      earnings,
      loading,
      minLoading,
      otherAdjustments,
      lastAdjustmentType,
    })}</>
  );
}
