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
    width: 40,
    height: 40,
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
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Times-Italic',
    color: '#4CA64C',
  },
});

const PayslipTemplate: React.FC = () => (
  <Document>
    <Page size="A4" style={styles.page}>
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
    </Page>
  </Document>
);

export default PayslipTemplate;