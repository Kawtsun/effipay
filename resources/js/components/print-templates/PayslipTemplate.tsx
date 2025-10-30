// Format numbers with commas and 2 decimal places
function formatWithCommas(value: string | number): string {
  let num = 0;
  if (value === null || value === undefined || value === '') {
    num = 0;
  } else {
    if (typeof value === 'string') {
      // Remove commas before converting to number
      num = Number(value.replace(/,/g, ''));
    } else {
      num = value;
    }
    if (isNaN(num)) num = 0;
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 35,
    height: 35,
    marginRight: 12,
    objectFit: 'contain',
  },
  headerTextCol: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#028102',
    textAlign: 'left',
    fontFamily: 'Helvetica',
    marginTop: 6,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 8,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Times-Italic',
    color: '#4CA64C',
  },
  payslipBox: {
    borderWidth: 1,
    borderColor: '#333',
    // borderRadius: 6,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
  },
});

interface EarningsProps {
  monthlySalary?: number | string;
  numHours?: number | string;
  ratePerHour?: number | string;
  collegeGSP?: number | string;
  honorarium?: number | string;
  tardiness?: number | string;
  tardinessAmount?: number | string;
  undertime?: number | string;
  undertimeAmount?: number | string;
  absences?: number | string;
  absencesAmount?: number | string;
  overtime_pay_total?: number | string;
  overtime_hours?: number | string;
  overtime?: number | string;
  overload?: number | string;
  adjustment?: number | string;
  gross_pay?: number | string;
  net_pay?: number | string;
  overtime_count_weekdays?: number | string;
  overtime_count_weekends?: number | string;
}

  interface DeductionsProps {
    sss?: string | number;
    sssSalaryLoan?: string | number;
    sssCalamityLoan?: string | number;
    pagibig?: string | number;
    pagibigMultiLoan?: string | number;
    pagibigCalamityLoan?: string | number;
    philhealth?: string | number;
    peraaCon?: string | number;
    withholdingTax?: string | number;
    tuition?: string | number;
    chinaBank?: string | number;
    tea?: string | number;
  }

interface PayslipTemplateProps {
  payPeriod?: string; // 'YYYY-MM' or 'YYYY-MM-DD'
  employeeName?: string;
  jobTitle?: string;
  role?: string;
  earnings?: EarningsProps;
  deductions?: DeductionsProps;
  totalDeductions?: string | number;
  totalHours?: number;
  collegeRate?: number | string;
}

const getPayPeriodString = (period?: string) => {
  const date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  if (period) {
    const match = period.match(/^(\d{4})-(\d{2})/);
    if (match) {
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
    }
  }
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
  const lastDay = new Date(year, month, 0).getDate();
  return `Pay Period: ${monthName} 1-${lastDay}, ${year}`;
};

const PayslipTemplate: React.FC<PayslipTemplateProps> = (props) => {
  const { payPeriod, employeeName = '-', role = '', earnings, deductions, totalDeductions, totalHours, collegeRate } = props;
  // Always show monthly salary value regardless of role
  const monthlySalary = earnings?.monthlySalary;
  const monthlySalaryValue: number | string | undefined = monthlySalary;
  // Helper to get numeric value
  const getNum = (v: string | number | undefined) => {
    if (v === undefined || v === null || v === '') return 0;
    if (typeof v === 'string') return Number(v.replace(/,/g, ''));
    return v;
  };
  // Calculate amounts if not provided
  const ratePerHour = getNum(earnings?.ratePerHour);
  const tardinessHours = getNum(earnings?.tardiness);
  const undertimeHours = getNum(earnings?.undertime);
  const absencesHours = getNum(earnings?.absences);
  const tardinessAmount = earnings?.tardinessAmount !== undefined && earnings?.tardinessAmount !== null && earnings?.tardinessAmount !== ''
    ? getNum(earnings?.tardinessAmount)
    : parseFloat((tardinessHours * ratePerHour).toFixed(2));
  const undertimeAmount = earnings?.undertimeAmount !== undefined && earnings?.undertimeAmount !== null && earnings?.undertimeAmount !== ''
    ? getNum(earnings?.undertimeAmount)
    : parseFloat((undertimeHours * ratePerHour).toFixed(2));
  const absencesAmount = earnings?.absencesAmount !== undefined && earnings?.absencesAmount !== null && earnings?.absencesAmount !== ''
    ? getNum(earnings?.absencesAmount)
    : parseFloat((absencesHours * ratePerHour).toFixed(2));
  // For college instructor ONLY: role string may contain multiple roles; enforce "college-only" rule
    const rolesTokens = (role || '').toLowerCase().split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
  const hasCollegeRole = rolesTokens.some(t => t.includes('college'));
  const isCollegeOnly = hasCollegeRole && (rolesTokens.length > 0 ? rolesTokens.every(t => t.includes('college')) : true);
  const displayNumHours = isCollegeOnly && typeof totalHours === 'number'
    ? totalHours.toFixed(2)
    : '-';
  const displayRatePerHour = isCollegeOnly && (typeof collegeRate === 'number' || (typeof collegeRate === 'string' && collegeRate !== ''))
    ? collegeRate
    : '-';
  // College/GSP value: for college instructor, numHours * ratePerHour
  let displayCollegeGSP: string | number = '-';
  if (isCollegeOnly && typeof totalHours === 'number' && getNum(collegeRate) > 0) {
    displayCollegeGSP = parseFloat((totalHours * getNum(collegeRate)).toFixed(2));
  }

  // Overtime and Overload logic (match timekeeping dialog: summary.overtime)
  let overtimeHours = undefined;
  if (earnings?.overtime !== undefined && earnings?.overtime !== null && earnings?.overtime !== '') {
    overtimeHours = getNum(earnings?.overtime);
  } else if (earnings?.overtime_hours !== undefined && earnings?.overtime_hours !== null && earnings?.overtime_hours !== '') {
    overtimeHours = getNum(earnings?.overtime_hours);
  }
  // Compute overtime using weekday/weekend formula for both college-only and non-college when counts are provided.
  let overtimeAmount = 0;
  const weekdayOvertime = getNum(earnings?.overtime_count_weekdays);
  const weekendOvertime = getNum(earnings?.overtime_count_weekends);
  if ((earnings?.overtime_count_weekdays !== undefined || earnings?.overtime_count_weekends !== undefined)) {
    // Use weighted OT formula consistent with Attendance/Report Cards
    const rate = isCollegeOnly ? getNum(collegeRate) : ratePerHour;
    if (rate > 0) {
      const weekdayPay = rate * 0.25 * (weekdayOvertime || 0);
      const weekendPay = rate * 0.30 * (weekendOvertime || 0);
      overtimeAmount = parseFloat((weekdayPay + weekendPay).toFixed(2));
    } else {
      overtimeAmount = 0;
    }
  } else if (earnings?.overtime_pay_total !== undefined && earnings?.overtime_pay_total !== null && getNum(earnings?.overtime_pay_total) > 0) {
    // Only use payroll OT when it's a positive value; otherwise compute fallback
    overtimeAmount = getNum(earnings?.overtime_pay_total);
  } else if (overtimeHours && ratePerHour > 0) {
    overtimeAmount = parseFloat((overtimeHours * ratePerHour).toFixed(2));
  } else {
    overtimeAmount = 0;
  }

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Payslip bordered box start - now includes header and employee info */}
      <View style={styles.payslipBox}>
        {/* Header Row */}
        <View style={{ ...styles.headerRow, justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              style={styles.logo}
              src="/img/tcc_logo2.jpg"
            />
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>TOMAS CLAUDIO COLLEGES</Text>
              <Text style={styles.subtitle}>Higher Education Pioneer in Eastern Rizal</Text>
              <Text style={styles.subtitle}>Taghangin, Morong, Rizal Philippines</Text>
              <Text style={styles.subtitle}>Tel. Nos.: (02) 234-5566</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end', minWidth: 140, marginBottom: 0 }}>
            {(() => {
              const payPeriodStr = getPayPeriodString(payPeriod);
              // payPeriodStr: 'Pay Period: September 1-30, 2025'
              const match = payPeriodStr.match(/^(Pay Period: )(.*)$/);
              if (match) {
                return (
                  <Text>
                    {match[1]}
                    <Text style={{ fontWeight: 'bold' }}>{match[2]}</Text>
                  </Text>
                );
              }
              return <Text>{payPeriodStr}</Text>;
            })()}
          </View>
        </View>

        {/* Employee Info Row (one line, job title aligned with pay period) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8 }}>
          {/* Employee Name (left) */}
          <View style={{ flex: 1 }}>
            <Text>
              Employee Name: <Text style={{ fontWeight: 'bold' }}>{employeeName || '-'}</Text>
            </Text>
          </View>
          {/* Job Title (right, aligned with pay period label) */}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text>
              Job Title: <Text style={{ fontWeight: 'bold' }}>{(() => {
                const order = ['administrator', 'college instructor', 'basic education instructor'];
                const rolesArr = (role || '').split(',').map(r => r.trim()).filter(Boolean);
                // Sort by order, then by original order for others
                const ordered = [
                  ...order.filter(o => rolesArr.includes(o)),
                  ...rolesArr.filter(r => !order.includes(r))
                ];
                return ordered
                  .map(r => r.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
                  .join(', ');
              })()}</Text>
            </Text>
          </View>
        </View>

        {/* Earnings and Deductions Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0, marginTop: 8 }}>
          {/* Earnings Column (focus here for now) */}
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={{ fontWeight: 'bold' }}>EARNINGS</Text>
          </View>
          {/* Deductions Column (for future use) */}
          <View style={{ flex: 1, paddingLeft: 32, alignItems: 'flex-start' }}>
            <Text style={{ fontWeight: 'bold' }}>DEDUCTIONS</Text>
          </View>
        </View>

        {/* Earnings and Deductions Content Row with gap */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
          {/* Earnings Column */}
          <View style={{ flex: 1, paddingRight: 32 }}>
            {/* Monthly Salary row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text>Monthly Salary</Text>
              <Text>{
                monthlySalaryValue === undefined || monthlySalaryValue === null || monthlySalaryValue === '' || Number(monthlySalaryValue) === 0
                  ? '-'
                  : formatWithCommas(monthlySalaryValue)
              }</Text>
            </View>
            {/* Indented sub-items: always show under Monthly Salary */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: 16, marginBottom: 2 }}>
              <Text>No. of hours</Text>
              <Text>{displayNumHours}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: 16, marginBottom: 2 }}>
              <Text>Rate Per Hour</Text>
              <Text>{displayRatePerHour}</Text>
            </View>
            {/* College/GSP row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text>College/GSP</Text>
              <Text>{displayCollegeGSP === '-' ? '-' : formatWithCommas(displayCollegeGSP)}</Text>
            </View>
            {/* Honorarium row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text>Honorarium</Text>
              <Text>{
                earnings?.honorarium === undefined || earnings?.honorarium === null || earnings?.honorarium === '' || Number(earnings?.honorarium) === 0
                  ? '-'
                  : formatWithCommas(earnings?.honorarium)
              }</Text>
            </View>

            {/* Less: No. of Hours section */}
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text>Less:  No. of Hours</Text>
            </View>
            {/* Tardiness row */}
            <View style={{ flexDirection: 'row', marginLeft: 16, marginBottom: 2 }}>
              <Text style={{ minWidth: 80 }}>Tardiness</Text>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <Text style={{ flex: 1, textAlign: 'right' }}>
                  {tardinessHours === 0 ? '-' : formatWithCommas(tardinessHours)}
                </Text>
                <Text style={{ flex: 1, textAlign: 'right' }}>
                  {tardinessAmount === 0 ? '-' : formatWithCommas(tardinessAmount)}
                </Text>
              </View>
            </View>
            {/* Undertime row */}
            <View style={{ flexDirection: 'row', marginLeft: 16, marginBottom: 2 }}>
              <Text style={{ minWidth: 80 }}>Undertime</Text>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <Text style={{ flex: 1, textAlign: 'right' }}>
                  {undertimeHours === 0 ? '-' : formatWithCommas(undertimeHours)}
                </Text>
                <Text style={{ flex: 1, textAlign: 'right' }}>
                  {undertimeAmount === 0 ? '-' : formatWithCommas(undertimeAmount)}
                </Text>
              </View>
            </View>
            {/* Absences row */}
            <View style={{ flexDirection: 'row', marginLeft: 16, marginBottom: 2 }}>
              <Text style={{ minWidth: 80 }}>Absences</Text>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <Text style={{ flex: 1, textAlign: 'right' }}>
                  {absencesHours === 0 ? '-' : formatWithCommas(absencesHours)}
                </Text>
                <Text style={{ flex: 1, textAlign: 'right' }}>
                  {absencesAmount === 0 ? '-' : formatWithCommas(absencesAmount)}
                </Text>
              </View>
            </View>

            {/* Other Earnings section */}
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ fontWeight: 'bold' }}>Other Earnings:</Text>
            </View>
            {/* Overtime row */}
            <View style={{ flexDirection: 'row', marginLeft: 16, marginBottom: 2 }}>
              <Text style={{ minWidth: 80 }}>Overtime</Text>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <Text style={{ flex: 1, textAlign: 'right' }}>
                  {overtimeHours === undefined || overtimeHours === null || overtimeHours === 0 ? '-' : formatWithCommas(overtimeHours)}
                </Text>
                <Text style={{ flex: 1, textAlign: 'right' }}>
                  {overtimeAmount === 0 ? '-' : formatWithCommas(overtimeAmount)}
                </Text>
              </View>
            </View>
            {/* Overload row */}
            <View style={{ flexDirection: 'row', marginLeft: 16, marginBottom: 2 }}>
              <Text style={{ minWidth: 80 }}>Overload</Text>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <Text style={{ flex: 1, textAlign: 'right' }}>-</Text>
                <Text style={{ flex: 1, textAlign: 'right' }}>-</Text>
              </View>
            </View>

            {/* Other: Adjustment row */}
            <View style={{ flexDirection: 'row', marginLeft: 0, marginBottom: 2 }}>
              <Text style={{ minWidth: 110}}>Other: Adjustment</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {earnings?.adjustment === undefined || earnings?.adjustment === null || earnings?.adjustment === '' || Number(earnings?.adjustment) === 0
                  ? '-'
                  : formatWithCommas(earnings?.adjustment)}
              </Text>
            </View>

            {/* TOTAL row */}
            <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 2 }}>
              <Text style={{ minWidth: 110, fontWeight: 'bold', textTransform: 'uppercase' }}>TOTAL:</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                {earnings?.gross_pay === undefined || earnings?.gross_pay === null || earnings?.gross_pay === '' || earnings?.gross_pay === 0 || earnings?.gross_pay === '0' || earnings?.gross_pay === '0.00' || Number(earnings?.gross_pay) === 0
                  ? '-'
                  : formatWithCommas(earnings?.gross_pay)}
              </Text>
            </View>

            {/* NET PAY row */}
            <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 2 }}>
              <Text style={{ minWidth: 110, fontWeight: 'bold', textTransform: 'uppercase' }}>NET PAY</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                {earnings?.net_pay === undefined || earnings?.net_pay === null || earnings?.net_pay === '' || earnings?.net_pay === 0 || earnings?.net_pay === '0' || earnings?.net_pay === '0.00' || Number(earnings?.net_pay) === 0
                  ? '-'
                  : formatWithCommas(earnings?.net_pay)}
              </Text>
            </View>
          </View>
          {/* Deductions Column */}
          <View style={{ flex: 1 }}>
            {/* SSS Contribution group */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
              <Text style={{ minWidth: 60 }}>SSS</Text>
              <Text style={{ minWidth: 80, marginLeft: 32 }}>Contribution</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.sss === undefined || deductions?.sss === null || deductions?.sss === '' || Number(deductions?.sss) === 0
                    ? '-'
                    : formatWithCommas(deductions?.sss)
                }
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
              <Text style={{ minWidth: 60 }} />
              <Text style={{ minWidth: 80, marginLeft: 32 }}>Salary Loan</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.sssSalaryLoan === undefined || deductions?.sssSalaryLoan === null || deductions?.sssSalaryLoan === '' || Number(deductions?.sssSalaryLoan) === 0
                    ? '-'
                    : formatWithCommas(deductions?.sssSalaryLoan)
                }
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
              <Text style={{ minWidth: 60 }} />
              <Text style={{ minWidth: 80, marginLeft: 32 }}>Calamity Loan</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.sssCalamityLoan === undefined || deductions?.sssCalamityLoan === null || deductions?.sssCalamityLoan === '' || Number(deductions?.sssCalamityLoan) === 0
                    ? '-'
                    : formatWithCommas(deductions?.sssCalamityLoan)
                }
              </Text>
            </View>

            {/* Pag-Ibig Contribution group */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2}}>
              <Text style={{ minWidth: 60 }}>Pag-Ibig</Text>
              <Text style={{ minWidth: 80, marginLeft: 32 }}>Contribution</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.pagibig === undefined || deductions?.pagibig === null || deductions?.pagibig === '' || Number(deductions?.pagibig) === 0
                    ? '-'
                    : formatWithCommas(deductions?.pagibig)
                }
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
              <Text style={{ minWidth: 60 }} />
              <Text style={{ minWidth: 80, marginLeft: 32 }}>Multi Purpose Loan</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.pagibigMultiLoan === undefined || deductions?.pagibigMultiLoan === null || deductions?.pagibigMultiLoan === '' || Number(deductions?.pagibigMultiLoan) === 0
                    ? '-'
                    : formatWithCommas(deductions?.pagibigMultiLoan)
                }
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
              <Text style={{ minWidth: 60 }} />
              <Text style={{ minWidth: 80, marginLeft: 32 }}>Calamity Loan</Text>
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.pagibigCalamityLoan === undefined || deductions?.pagibigCalamityLoan === null || deductions?.pagibigCalamityLoan === '' || Number(deductions?.pagibigCalamityLoan) === 0
                    ? '-'
                    : formatWithCommas(deductions?.pagibigCalamityLoan)
                }
              </Text>
            </View>
            {/* Philhealth row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
              <Text style={{ minWidth: 60 }}>Philhealth</Text>
              <Text style={{ minWidth: 80, marginLeft: 32 }} />
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.philhealth === undefined || deductions?.philhealth === null || deductions?.philhealth === '' || Number(deductions?.philhealth) === 0
                    ? '-'
                    : formatWithCommas(deductions?.philhealth)
                }
              </Text>
            </View>

            {/* PERAA Con. row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
              <Text style={{ minWidth: 60 }}>PERAA Con.</Text>
              <Text style={{ minWidth: 80, marginLeft: 32 }} />
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.peraaCon === undefined || deductions?.peraaCon === null || deductions?.peraaCon === '' || Number(deductions?.peraaCon) === 0
                    ? '-'
                    : formatWithCommas(deductions?.peraaCon)
                }
              </Text>
            </View>

            {/* Withholding Tax row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
              <Text style={{ minWidth: 60 }}>Withholding Tax</Text>
              <Text style={{ minWidth: 80, marginLeft: 32 }} />
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.withholdingTax === undefined || deductions?.withholdingTax === null || deductions?.withholdingTax === '' || Number(deductions?.withholdingTax) === 0
                    ? '-'
                    : formatWithCommas(deductions?.withholdingTax)
                }
              </Text>
            </View>
            {/* Other Deductions section */}
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ fontWeight: 'bold' }}>Other Deductions:</Text>
            </View>
            {/* Tuition row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
              <Text style={{ minWidth: 60 }}>Tuition</Text>
              <Text style={{ minWidth: 80, marginLeft: 32 }} />
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.tuition === undefined || deductions?.tuition === null || deductions?.tuition === '' || Number(deductions?.tuition) === 0
                    ? '-'
                    : formatWithCommas(deductions?.tuition)
                }
              </Text>
            </View>
            {/* China Bank row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
              <Text style={{ minWidth: 60 }}>China Bank</Text>
              <Text style={{ minWidth: 80, marginLeft: 32 }} />
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.chinaBank === undefined || deductions?.chinaBank === null || deductions?.chinaBank === '' || Number(deductions?.chinaBank) === 0
                    ? '-'
                    : formatWithCommas(deductions?.chinaBank)
                }
              </Text>
            </View>
            {/* TEA row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
              <Text style={{ minWidth: 60 }}>TEA</Text>
              <Text style={{ minWidth: 80, marginLeft: 32 }} />
              <Text style={{ flex: 1, textAlign: 'right' }}>
                {
                  deductions?.tea === undefined || deductions?.tea === null || deductions?.tea === '' || Number(deductions?.tea) === 0
                    ? '-'
                    : formatWithCommas(deductions?.tea)
                }
              </Text>
            </View>

            {/* TOTAL DEDUCTIONS row */}
            <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 2 }}>
              <Text style={{ minWidth: 110, fontWeight: 'bold', textTransform: 'uppercase' }}>TOTAL:</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                {
                  (typeof totalDeductions !== 'undefined' && totalDeductions !== null && totalDeductions !== '' && totalDeductions !== 0 && totalDeductions !== '0' && totalDeductions !== '0.00')
                    ? formatWithCommas(totalDeductions as string | number)
                    : '-'
                }
              </Text>
            </View>

            {/* Net Pay for 15 & 30 row */}
            <View style={{ flexDirection: 'row',  marginTop: 8, marginBottom: 2 }}>
              <Text style={{ minWidth: 110, fontWeight: 'bold'}}>(Net Pay for 15 & 30)</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                {
                  earnings?.net_pay !== undefined && earnings?.net_pay !== null && earnings?.net_pay !== '' && earnings?.net_pay !== 0 && earnings?.net_pay !== '0' && earnings?.net_pay !== '0.00' && !isNaN(Number(earnings?.net_pay))
                    ? formatWithCommas(Number(earnings.net_pay) / 2)
                    : '-'
                }
              </Text>
            </View>
          </View>
        </View>
      </View>
      {/* Payslip bordered box end */}
    </Page>
  </Document>
  );
}

export default PayslipTemplate;