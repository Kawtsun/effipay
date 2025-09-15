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
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Custom font registration (optional)
// Font.register({ family: 'Roboto', src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxM.woff2' });

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006400',
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 2,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  table: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tableCol: {
    width: '50%',
    padding: 2,
  },
  tableHeader: {
    fontWeight: 'bold',
    fontSize: 11,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  cell: {
    width: '50%',
    padding: 2,
  },
  total: {
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 6,
  },
  netPay: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#006400',
    marginTop: 8,
  },
});

interface PayslipEarnings {
  monthlySalary?: string;
  numHours?: string;
  ratePerHour?: string;
  collegeGSP?: string;
  honorarium?: string;
  tardinessHours?: string;
  tardiness?: string;
  undertimeHours?: string;
  undertime?: string;
  absencesHours?: string;
  absences?: string;
  overtime?: string;
  overload?: string;
  adjustment?: string;
}

interface PayslipDeductions {
  sss?: string;
  sssLoan?: string;
  pagibig?: string;
  philhealth?: string;
  withholdingTax?: string;
  // Add more fields as needed
}


interface PayslipTemplateProps {
  employeeName?: string;
  role?: string;
  payPeriod?: string;
  earnings?: PayslipEarnings;
  deductions?: PayslipDeductions;
  // otherDeductions?: PayslipOtherDeductions;
  totalEarnings?: string;
  totalDeductions?: string;
  netPay?: string;
  netPay1530?: string;
}

const PayslipTemplate: React.FC<PayslipTemplateProps> = ({
  employeeName = '-',
  role = '-',
  payPeriod = 'May 1-31, 2025',
  earnings = {},
  deductions = {},
  // otherDeductions = {},
  totalEarnings = '19,376.15',
  totalDeductions = '5,107.83',
  netPay = '14,268.32',
  netPay1530 = '7,134.16',
}) => {
  // Format pay period: 'YYYY-MM' or 'YYYY-MM-DD' to 'Month 1-30, Year'
  const formatPayPeriod = (period: string) => {
    const match = period.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (match) {
      const year = match[1];
      const month = match[2];
      const monthName = new Date(`${year}-${month}-01`).toLocaleString('default', { month: 'long' });
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      return `${monthName} 1-${lastDay}, ${year}`;
    }
    return period;
  };
  // Format role: capitalize each word and add space after commas
  const formatRole = (roleStr: string) => {
    if (!roleStr || roleStr === '-') return '-';
    return roleStr
      .split(',')
      .map(r => r.trim().replace(/\b\w/g, c => c.toUpperCase()))
      .join(', ');
  };

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>TOMAS CLAUDIO COLLEGES</Text>
        <Text style={styles.subtitle}>Higher Education Pioneer in Eastern Rizal</Text>
        <Text style={styles.subtitle}>Taghangin, Morong, Rizal Philippines</Text>
        <Text style={styles.subtitle}>Tel. Nos.: (02) 234-5566</Text>
      </View>
      <View style={styles.section}>
        <Text>Employee Name: {employeeName}</Text>
  <Text>Pay Period: {formatPayPeriod(payPeriod)}</Text>
      </View>
      <View style={styles.section}>
        <Text>Job Title: {formatRole(role)}</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableCol}>
          <Text style={styles.tableHeader}>EARNINGS</Text>
          <View style={styles.tableRow}><Text style={styles.cell}>Monthly Salary</Text><Text style={styles.cell}>{formatWithCommas(Number(earnings.monthlySalary) || 0)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>No. of Hours</Text><Text style={styles.cell}>{formatWithCommas(Number(earnings.numHours) || 0)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Rate Per Hour</Text><Text style={styles.cell}>{formatWithCommas(Number(earnings.ratePerHour) || 0)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>College/GSP</Text><Text style={styles.cell}>{earnings.collegeGSP || '-'}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Honorarium</Text><Text style={styles.cell}>{formatWithCommas(Number(earnings.honorarium) || 0)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Tardiness</Text><Text style={styles.cell}>{formatWithCommas(Number(earnings.tardinessHours) || 0)} {earnings.tardiness ? `/ ${formatWithCommas(Number(earnings.tardiness) || 0)}` : ''}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Undertime</Text><Text style={styles.cell}>{formatWithCommas(Number(earnings.undertimeHours) || 0)} {earnings.undertime ? `/ ${formatWithCommas(Number(earnings.undertime) || 0)}` : ''}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Absences</Text><Text style={styles.cell}>{formatWithCommas(Number(earnings.absencesHours) || 0)} {earnings.absences ? `/ ${formatWithCommas(Number(earnings.absences) || 0)}` : ''}</Text></View>
          <Text style={{ ...styles.tableHeader, marginTop: 6 }}>Other Earnings:</Text>
          <View style={styles.tableRow}><Text style={styles.cell}>Overtime</Text><Text style={styles.cell}>{formatWithCommas(Number(earnings.overtime) || 0)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Overload</Text><Text style={styles.cell}>{formatWithCommas(Number(earnings.overload) || 0)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Other: Adjustment</Text><Text style={styles.cell}>{formatWithCommas(Number(earnings.adjustment) || 0)}</Text></View>
          <Text style={styles.total}>TOTAL: {formatWithCommas(Number(totalEarnings) || 0)}</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableHeader}>DEDUCTIONS</Text>
          <View style={styles.tableRow}><Text style={styles.cell}>SSS Contribution</Text><Text style={styles.cell}>{formatWithCommas(Number(deductions.sss) || 0)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>SSS Salary Loan</Text><Text style={styles.cell}>{formatWithCommas(Number(deductions.sssLoan) || 0)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Pag-ibig Contribution</Text><Text style={styles.cell}>{formatWithCommas(Number(deductions.pagibig) || 0)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Philhealth</Text><Text style={styles.cell}>{formatWithCommas(Number(deductions.philhealth) || 0)}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Withholding Tax</Text><Text style={styles.cell}>{formatWithCommas(Number(deductions.withholdingTax) || 0)}</Text></View>
          {/* Add more deductions fields as needed */}
          <Text style={styles.total}>TOTAL: {formatWithCommas(Number(totalDeductions) || 0)}</Text>
        </View>
      </View>
      <View style={styles.section}>
  <Text style={styles.netPay}>NET PAY: {formatWithCommas(Number(netPay) || 0)}</Text>
  <Text>(Net Pay for 15 & 30): {formatWithCommas(Number(netPay1530) || 0)}</Text>
      </View>
    </Page>
  </Document>
);
}

export default PayslipTemplate;