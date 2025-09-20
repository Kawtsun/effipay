

import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';

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
    justifyContent: 'center', // Center the row horizontally
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
    textAlign: 'center',
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
});


interface BiometricTimeRecordTemplateProps {
  employeeName?: string;
  payPeriod?: string; // 'YYYY-MM' or 'YYYY-MM-DD'
}

const getPayPeriodString = (period?: string) => {
  const date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  if (period) {
    const match = period.match(/^\d{4}-(\d{2})/);
    if (match) {
      year = parseInt(period.substring(0, 4), 10);
      month = parseInt(match[1], 10);
    }
  }
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
  const lastDay = new Date(year, month, 0).getDate();
  return `${monthName} 1-${lastDay}, ${year}`;
};

const BiometricTimeRecordTemplate: React.FC<BiometricTimeRecordTemplateProps> = ({ employeeName = '-', payPeriod }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Centered Header Row */}
      <View style={styles.headerRow}>
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
      {/* Employee Name and Period Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 10 }}>
        {/* Employee Name (left) */}
        <View style={{ flex: 1 }}>
          <Text>
            Employee Name: <Text style={{ fontWeight: 'bold' }}>{employeeName || '-'}</Text>
          </Text>
        </View>
        {/* Period (right) */}
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text>
            Period: <Text style={{ fontWeight: 'bold' }}>{getPayPeriodString(payPeriod)}</Text>
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default BiometricTimeRecordTemplate;
