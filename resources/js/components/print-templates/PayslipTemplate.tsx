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
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 54,
    height: 54,
    marginRight: 12,
    objectFit: 'contain',
  },
  headerTextCol: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#028102',
    textAlign: 'left',
    fontFamily: 'Helvetica',
    marginTop: 6,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Times-Italic',
    color: '#4CA64C',
  },
});


interface PayslipTemplateProps {
  payPeriod?: string; // 'YYYY-MM' or 'YYYY-MM-DD'
  employeeName?: string;
  jobTitle?: string;
  role?: string;
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


const PayslipTemplate: React.FC<PayslipTemplateProps> = ({ payPeriod, employeeName = '-', role = '' }) => (
  <Document>
    <Page size="A4" style={styles.page}>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8 }}>
        {/* Earnings Column (focus here for now) */}
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Text style={{ fontWeight: 'bold' }}>EARNINGS</Text>
        </View>
        {/* Deductions Column (for future use) */}
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Text style={{ fontWeight: 'bold' }}>DEDUCTIONS</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default PayslipTemplate;