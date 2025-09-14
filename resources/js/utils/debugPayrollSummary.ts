// TEMP DEBUG: Log the payroll data used for summary cards
export function debugPayrollSummary(selectedPayroll, grossPay, totalDeductions, netPay, perPayroll) {
    // eslint-disable-next-line no-console
    console.log('DEBUG Payroll Summary:', {
        selectedPayroll,
        grossPay,
        totalDeductions,
        netPay,
        perPayroll
    });
}
