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
  tardiness?: string;
  absences?: string;
  // Add more fields as needed
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
          <View style={styles.tableRow}><Text style={styles.cell}>Monthly Salary</Text><Text style={styles.cell}>{earnings.monthlySalary || '23,481.30'}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Tardiness</Text><Text style={styles.cell}>{earnings.tardiness || '1,169.99'}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Absences</Text><Text style={styles.cell}>{earnings.absences || '2,935.16'}</Text></View>
          {/* Add more earnings fields as needed */}
          <Text style={styles.total}>TOTAL: {totalEarnings}</Text>
        </View>
        <View style={styles.tableCol}>
          <Text style={styles.tableHeader}>DEDUCTIONS</Text>
          <View style={styles.tableRow}><Text style={styles.cell}>SSS Contribution</Text><Text style={styles.cell}>{deductions.sss || '1,175.00'}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>SSS Salary Loan</Text><Text style={styles.cell}>{deductions.sssLoan || '1,845.80'}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Pag-ibig Contribution</Text><Text style={styles.cell}>{deductions.pagibig || '500.00'}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Philhealth</Text><Text style={styles.cell}>{deductions.philhealth || '587.03'}</Text></View>
          <View style={styles.tableRow}><Text style={styles.cell}>Withholding Tax</Text><Text style={styles.cell}>{deductions.withholdingTax || '1,000.00'}</Text></View>
          {/* Add more deductions fields as needed */}
          <Text style={styles.total}>TOTAL: {totalDeductions}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.netPay}>NET PAY: {netPay}</Text>
        <Text>(Net Pay for 15 & 30): {netPay1530}</Text>
      </View>
    </Page>
  </Document>
);
}

export default PayslipTemplate;