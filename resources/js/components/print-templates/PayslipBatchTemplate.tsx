import React from 'react';
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import PayslipBox from './PayslipBox';

// Helper: chunk array into groups of n
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 24,
    paddingRight: 24,
    fontSize: 8,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  payslipStack: {
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  payslipHalf: {
    width: '100%',
    minHeight: 350,
    marginBottom: 12,
    padding: 0,
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  },
});

interface PayslipData {
  employeeName: string;
  role?: string;
  payPeriod?: string;
  earnings?: any;
  deductions?: any;
  totalDeductions?: string | number;
}

interface PayslipBatchTemplateProps {
  payslips: PayslipData[];
}

const PayslipBatchTemplate: React.FC<PayslipBatchTemplateProps> = ({ payslips }) => {
  // Pad payslips array if odd, so every page has 2 payslips
  const paddedPayslips = payslips.length % 2 === 1
    ? [...payslips, { employeeName: '', role: '', payPeriod: '', earnings: {}, deductions: {}, totalDeductions: '' }]
    : payslips;
  const payslipPairs = chunkArray(paddedPayslips, 2);
  return (
    <Document>
      {payslipPairs.map((pair, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page} wrap={false}>
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }} wrap={false}>
            {pair.map((data, idx) => (
              <View key={idx} style={styles.payslipHalf} wrap={false}>
                {/* Only render PayslipBox if employeeName is not empty, otherwise render an empty box for layout */}
                {data.employeeName ? (
                  <PayslipBox
                    employeeName={data.employeeName}
                    role={data.role}
                    payPeriod={data.payPeriod}
                    earnings={data.earnings}
                    deductions={data.deductions}
                    totalDeductions={data.totalDeductions}
                  />
                ) : null}
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default PayslipBatchTemplate;