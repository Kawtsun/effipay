import * as React from "react";
import { Employees } from "@/types";
import { toast } from "sonner";
import { useEmployeePayroll } from "@/hooks/useEmployeePayroll";
import { useTimekeepingComputed } from "@/hooks/useTimekeepingComputed";

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
  overtime_count_observances?: number;
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
    overtime_count_observances?: number;
    tardiness?: number;
    undertime?: number;
    absences?: number;
    college_rate?: number;
    total_hours?: number;
  }
  const { summary: timekeepingSummary } = useEmployeePayroll(employee?.id ?? null, pendingMonth, employee ?? undefined) as {
    summary?: EmployeePayrollSummary | null;
  };

  // Use the same computed metrics as Timekeeping view to ensure parity
  const { computed: tkComputed } = useTimekeepingComputed(employee, pendingMonth);

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

  // Derive a corrected Gross Pay for multi-role with College Instructor so the card reflects the new rule
  const adjustedSelectedPayroll = React.useMemo(() => {
    if (!selectedPayroll) return null;
    try {
      const rolesStr = String(employee?.roles ?? '').toLowerCase();
      const tokens = rolesStr.split(/[\,\n]+/).map(s => s.trim()).filter(Boolean);
      const hasCollege = rolesStr.includes('college instructor');
      const isCollegeOnly = hasCollege && (tokens.length > 0 ? tokens.every(t => t.includes('college instructor')) : true);
      const isCollegeMulti = hasCollege && !isCollegeOnly;

      if (!isCollegeMulti) return selectedPayroll; // keep original for non-multi cases

      // Resolve numbers
      const baseSalary = Number(selectedPayroll.base_salary ?? employee?.base_salary ?? 0) || 0;
      const honorarium = Number(selectedPayroll.honorarium ?? employee?.honorarium ?? 0) || 0;
      const collegeRate = Number(selectedPayroll.college_rate ?? timekeepingSummary?.college_rate ?? 0) || 0;
      const collegeHours = Number(timekeepingSummary?.total_hours ?? NaN);
      const t = Number((tkComputed?.tardiness ?? timekeepingSummary?.tardiness) ?? 0) || 0;
      const u = Number((tkComputed?.undertime ?? timekeepingSummary?.undertime) ?? 0) || 0;
      const a = Number((tkComputed?.absences ?? timekeepingSummary?.absences) ?? 0) || 0;

      // Non-college hourly rate for deductions and OT
      const nonCollegeRate = (() => {
        const rSum = Number(timekeepingSummary?.rate_per_hour ?? NaN);
        if (Number.isFinite(rSum) && rSum > 0) return Number(rSum.toFixed(2));
        const rSP = Number((selectedPayroll as any)?.rate_per_hour ?? NaN);
        if (Number.isFinite(rSP) && rSP > 0) return Number(rSP.toFixed(2));
        const rTK = Number(tkComputed?.rate_per_hour ?? NaN);
        return Number.isFinite(rTK) && rTK > 0 ? Number(rTK.toFixed(2)) : 0;
      })();

      // Overtime pay using the same rule as summary cards
      const weekdayOT = Number(tkComputed?.overtime_count_weekdays ?? timekeepingSummary?.overtime_count_weekdays ?? 0) || 0;
      const weekendOT = Number(tkComputed?.overtime_count_weekends ?? timekeepingSummary?.overtime_count_weekends ?? 0) || 0;
      const observanceOT = Number(tkComputed?.overtime_count_observances ?? timekeepingSummary?.overtime_count_observances ?? 0) || 0;
      const overtimePay = (nonCollegeRate * 0.25 * weekdayOT) + (nonCollegeRate * 0.30 * weekendOT) + (nonCollegeRate * 2.0 * observanceOT);

      const collegeGsp = (Number.isFinite(collegeHours) && collegeHours > 0 && collegeRate > 0) ? collegeRate * collegeHours : 0;
      const deductions = nonCollegeRate * (t + u + a);
      const derivedGross = Number((baseSalary + collegeGsp + overtimePay - deductions + honorarium).toFixed(2));

      return { ...selectedPayroll, gross_pay: derivedGross };
    } catch {
      return selectedPayroll;
    }
  }, [selectedPayroll, employee, tkComputed, timekeepingSummary]);

  // Helper used by the dialog to compute the monetary values for summary cards
  // Sync rule: Prefer Timekeeping summary (hours and rate) so the Report matches the Timekeeping view.
  const getSummaryCardAmount = React.useCallback((type: "tardiness" | "undertime" | "overtime" | "absences") => {
    const tk = (tkComputed || timekeepingSummary) as (EmployeePayrollSummary | null | undefined);
    const payroll = selectedPayroll;

    // Resolve hourly rate for monetary conversions
    // IMPORTANT: Overtime must use the base-salary derived rate_per_hour, never the college rate.
    const baseRatePerHour = (() => {
      const rSum = Number(timekeepingSummary?.rate_per_hour ?? NaN);
      if (Number.isFinite(rSum) && rSum > 0) return Number(rSum.toFixed(2));
      const rPH = Number(payroll?.rate_per_hour ?? NaN);
      if (Number.isFinite(rPH) && rPH > 0) return Number(rPH.toFixed(2));
      // final fallback: if tkComputed provided a non-college rate (rare), use it
      const rTK = Number(tkComputed?.rate_per_hour ?? NaN);
      return Number.isFinite(rTK) && rTK > 0 ? Number(rTK.toFixed(2)) : 0;
    })();

    if (type === "overtime") {
      const weekdayOT = Number.isFinite(Number(tk?.overtime_count_weekdays))
        ? Number(Number(tk?.overtime_count_weekdays).toFixed(2))
        : Number(Number(payroll?.overtime_count_weekdays ?? 0).toFixed(2));
      const weekendOT = Number.isFinite(Number(tk?.overtime_count_weekends))
        ? Number(Number(tk?.overtime_count_weekends).toFixed(2))
        : Number(Number(payroll?.overtime_count_weekends ?? 0).toFixed(2));
      const observanceOT = Number.isFinite(Number(tk?.overtime_count_observances))
        ? Number(Number(tk?.overtime_count_observances).toFixed(2))
        : Number(Number(payroll?.overtime_count_observances ?? 0).toFixed(2));
      const weekdayPay = baseRatePerHour * 0.25 * weekdayOT;
      const weekendPay = baseRatePerHour * 0.30 * weekendOT;
      const observancePay = baseRatePerHour * 2.00 * observanceOT; // double pay
      const overtimePay = weekdayPay + weekendPay + observancePay;
      return `₱${overtimePay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const hours = (() => {
      if (tk) {
        switch (type) {
          case "tardiness": return Number(Number(tk.tardiness ?? 0).toFixed(2));
          case "undertime": return Number(Number(tk.undertime ?? 0).toFixed(2));
          case "absences": return Number(Number(tk.absences ?? 0).toFixed(2));
        }
      }
      if (payroll) {
        switch (type) {
          case "tardiness": return Number(Number(payroll.tardiness ?? 0).toFixed(2));
          case "undertime": return Number(Number(payroll.undertime ?? 0).toFixed(2));
          case "absences": return Number(Number(payroll.absences ?? 0).toFixed(2));
        }
      }
      return 0;
    })();
    const amount = baseRatePerHour * hours;
    return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [isCollegeInstructorPayroll, selectedPayroll, timekeepingSummary, tkComputed]);

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
    const tk = (tkComputed || timekeepingSummary) as (EmployeePayrollSummary | null | undefined);
    // Prefer TK hours
    if (type === "overtime") {
      const weekdayOT = Number(tk?.overtime_count_weekdays ?? NaN);
      const weekendOT = Number(tk?.overtime_count_weekends ?? NaN);
      const observanceOT = Number(tk?.overtime_count_observances ?? NaN);
      if (Number.isFinite(weekdayOT) || Number.isFinite(weekendOT) || Number.isFinite(observanceOT)) {
        const w = Number.isFinite(weekdayOT) ? Number(weekdayOT.toFixed(2)) : 0;
        const e = Number.isFinite(weekendOT) ? Number(weekendOT.toFixed(2)) : 0;
        const o = Number.isFinite(observanceOT) ? Number(observanceOT.toFixed(2)) : 0;
        return `${(w + e + o).toFixed(2)} hr(s)`;
      }
      const wP = Number(selectedPayroll?.overtime_count_weekdays ?? NaN);
      const eP = Number(selectedPayroll?.overtime_count_weekends ?? NaN);
      const oP = Number(selectedPayroll?.overtime_count_observances ?? NaN);
      const total = (Number.isFinite(wP) ? Number(wP.toFixed(2)) : 0)
        + (Number.isFinite(eP) ? Number(eP.toFixed(2)) : 0)
        + (Number.isFinite(oP) ? Number(oP.toFixed(2)) : 0);
      return `${total.toFixed(2)} hr(s)`;
    }
    const vTK = tk ? (() => {
      switch (type) {
        case "tardiness": return Number(tk.tardiness ?? NaN);
        case "undertime": return Number(tk.undertime ?? NaN);
        case "absences": return Number(tk.absences ?? NaN);
        default: return NaN;
      }
    })() : NaN;
    if (Number.isFinite(vTK)) return `${Number(vTK).toFixed(2)} hr(s)`;
    const vP = (() => {
      switch (type) {
        case "tardiness": return Number(selectedPayroll?.tardiness ?? NaN);
        case "undertime": return Number(selectedPayroll?.undertime ?? NaN);
        case "absences": return Number(selectedPayroll?.absences ?? NaN);
        default: return NaN;
      }
    })();
    return Number.isFinite(vP) ? `${Number(vP).toFixed(2)} hr(s)` : "-";
  }, [selectedPayroll, timekeepingSummary, tkComputed]);


  return (
    <>{children({
      selectedMonth,
      pendingMonth,
      availableMonths,
      handleMonthChange,
      setSelectedMonth,
      setPendingMonth,
      monthlyPayrollData,
  selectedPayroll: adjustedSelectedPayroll,
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