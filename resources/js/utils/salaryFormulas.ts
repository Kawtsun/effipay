// Centralized payroll formulas for reuse

export function calculatePhilHealth(baseSalary: number): number {
    return parseFloat(Math.max(250, Math.min(2500, (baseSalary * 0.05) / 2)).toFixed(2));
}

export function calculateWithholdingTax(baseSalary: number, sss: number, pagIbig: number, philhealth: number): number {
    const totalComp = baseSalary - (sss + pagIbig + philhealth);
    let tax = 0;
    if (totalComp <= 20832) {
        tax = 0;
    } else if (totalComp >= 20833 && totalComp <= 33332) {
        tax = (totalComp - 20833) * 0.15;
    } else if (totalComp >= 33333 && totalComp <= 66666) {
        tax = (totalComp - 33333) * 0.20 + 1875;
    } else if (totalComp >= 66667 && totalComp <= 166666) {
        tax = (totalComp - 66667) * 0.25 + 8541.80;
    } else if (totalComp >= 166667 && totalComp <= 666666) {
        tax = (totalComp - 166667) * 0.30 + 33541.80;
    } else if (totalComp >= 666667) {
        tax = (totalComp - 666667) * 0.35 + 183541.80;
    }
    return parseFloat(Math.max(0, tax).toFixed(2));
}
