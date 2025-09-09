// Calculates overtime pay for a given date and base amount
export function calculateOvertimePay(date: string, baseAmount: number): number {
    const dayOfWeek = new Date(date).getDay(); // 0 (Sun) - 6 (Sat)
    // Weekdays: 1 (Mon) - 5 (Fri), Weekends: 0 (Sun), 6 (Sat)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        return parseFloat((baseAmount * 0.25).toFixed(2));
    } else {
        return parseFloat((baseAmount * 0.30).toFixed(2));
    }
}
// Calculates rate per day (default: base salary)
export function calculateRatePerDay(baseSalary: number): number {
    // Formula: (baseSalary * 12) / 288
    return parseFloat(((baseSalary * 12) / 288).toFixed(2));
}

// Calculates rate per hour (base salary divided by work hours per day)
export function calculateRatePerHour(baseSalary: number, workHoursPerDay: number): number {
    // Formula: rate per day divided by 8
    const ratePerDay = calculateRatePerDay(baseSalary);
    return parseFloat((ratePerDay / 8).toFixed(2));
}
export function calculateSSS(base_salary: number): number {
        const brackets = [
            { min: 0, max: 5249.99, value: 250.00 },
            { min: 5250, max: 5749.99, value: 275.00 },
            { min: 5750, max: 6249.99, value: 300.00 },
            { min: 6250, max: 6749.99, value: 325.00 },
            { min: 6750, max: 7249.99, value: 350.00 },
            { min: 7250, max: 7749.99, value: 375.00 },
            { min: 7750, max: 8249.99, value: 400.00 },
            { min: 8250, max: 8749.99, value: 425.00 },
            { min: 8750, max: 9249.99, value: 450.00 },
            { min: 9250, max: 9749.99, value: 475.00 },
            { min: 9750, max: 10249.99, value: 500.00 },
            { min: 10250, max: 10749.99, value: 525.00 },
            { min: 10750, max: 11249.99, value: 550.00 },
            { min: 11250, max: 11749.99, value: 575.00 },
            { min: 11750, max: 12249.99, value: 600.00 },
            { min: 12250, max: 12749.99, value: 625.00 },
            { min: 12750, max: 13249.99, value: 650.00 },
            { min: 13250, max: 13749.99, value: 675.00 },
            { min: 13750, max: 14249.99, value: 700.00 },
            { min: 14250, max: 14749.99, value: 725.00 },
            { min: 14750, max: 15249.99, value: 750.00 },
            { min: 15250, max: 15749.99, value: 775.00 },
            { min: 15750, max: 16249.99, value: 800.00 },
            { min: 16250, max: 16749.99, value: 825.00 },
            { min: 16750, max: 17249.99, value: 850.00 },
            { min: 17250, max: 17749.99, value: 875.00 },
            { min: 17750, max: 18249.99, value: 900.00 },
            { min: 18250, max: 18749.99, value: 925.00 },
            { min: 18750, max: 19249.99, value: 950.00 },
            { min: 19250, max: 19749.99, value: 975.00 },
            { min: 19750, max: 20249.99, value: 1025.00 },
            { min: 20250, max: 20749.99, value: 1050.00 },
            { min: 20750, max: 21249.99, value: 1075.00 },
            { min: 21250, max: 21749.99, value: 1100.00 },
            { min: 21750, max: 22249.99, value: 1125.00 },
            { min: 22250, max: 22749.99, value: 1150.00 },
            { min: 22750, max: 23249.99, value: 1175.00 },
            { min: 23250, max: 23749.99, value: 1200.00 },
            { min: 23750, max: 24249.99, value: 1225.00 },
            { min: 24250, max: 24749.99, value: 1250.00 },
            { min: 24750, max: 25249.99, value: 1275.00 },
            { min: 25250, max: 25749.99, value: 1300.00 },
            { min: 25750, max: 26249.99, value: 1325.00 },
            { min: 26250, max: 26749.99, value: 1350.00 },
            { min: 26750, max: 27249.99, value: 1375.00 },
            { min: 27250, max: 27749.99, value: 1400.00 },
            { min: 27750, max: 28249.99, value: 1425.00 },
            { min: 28250, max: 28749.99, value: 1450.00 },
            { min: 28750, max: 29249.99, value: 1475.00 },
            { min: 29250, max: 29749.99, value: 1500.00 },
            { min: 29750, max: 30249.99, value: 1525.00 },
            { min: 30250, max: 30749.99, value: 1550.00 },
            { min: 30750, max: 31249.99, value: 1575.00 },
            { min: 31250, max: 31749.99, value: 1600.00 },
            { min: 31750, max: 32249.99, value: 1625.00 },
            { min: 32250, max: 32749.99, value: 1650.00 },
            { min: 32750, max: 33249.99, value: 1675.00 },
            { min: 33250, max: 33749.99, value: 1700.00 },
            { min: 33750, max: 34249.99, value: 1725.00 },
            { min: 34250, max: Infinity, value: 1750.00 },
        ];
        for (const b of brackets) {
            if (base_salary >= b.min && base_salary <= b.max) return parseFloat(b.value.toFixed(2));
        }
        return parseFloat((1750).toFixed(2));
}

export function calculatePhilHealth(baseSalary: number): number {
    return parseFloat(Math.max(250, Math.min(2500, (baseSalary * 0.05) / 2)).toFixed(2));
}

export function calculateWithholdingTax(baseSalary: number, sss: number, pagIbig: number, philhealth: number): number {
    const totalComp = baseSalary - (sss + pagIbig + philhealth);
    const brackets = [
        { min: 0, max: 20832, rate: 0, base: 0, excess: 0 },
        { min: 20833, max: 33332, rate: 0.15, base: 0, excess: 20833 },
        { min: 33333, max: 66666, rate: 0.20, base: 1875, excess: 33333 },
        { min: 66667, max: 166666, rate: 0.25, base: 8541.80, excess: 66667 },
        { min: 166667, max: 666666, rate: 0.30, base: 33541.80, excess: 166667 },
        { min: 666667, max: Infinity, rate: 0.35, base: 183541.80, excess: 666667 },
    ];
    for (const b of brackets) {
        if (totalComp >= b.min && totalComp <= b.max) {
            const tax = b.base + (totalComp - b.excess) * b.rate;
            return parseFloat(Math.max(0, tax).toFixed(2));
        }
    }
    return 0;
}
