
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

interface BiometricTimeRecordTemplateProps {
  employeeName: string;
  payPeriod: string;
  records: Array<{ date: string; dayName: string; timeIn: string; timeOut: string }>;
}

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
  address: {
    fontSize: 10,
    marginBottom: 2,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'column',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    minHeight: 22,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 11,
    padding: 6,
    color: '#222',
    flex: 1,
    textAlign: 'left',
  },
  tableHeaderCellLeft: {
    borderTopLeftRadius: 8,
  },
  tableHeaderCellRight: {
    borderTopRightRadius: 8,
  },
  tableCell: {
    padding: 6,
    fontSize: 10,
    flex: 1,
    textAlign: 'left',
    color: '#222',
  },
  dateCell: {
    flex: 2,
  },
  evenRow: {
    backgroundColor: '#fafbfc',
  },
  oddRow: {
    backgroundColor: '#fff',
  },
});


const BiometricTimeRecordTemplate: React.FC<BiometricTimeRecordTemplateProps> = ({ employeeName, payPeriod, records }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Payslip header */}
      <View style={styles.header}>
        <Text style={styles.title}>TOMAS CLAUDIO COLLEGES</Text>
        <Text style={styles.subtitle}>Higher Education Pioneer in Eastern Rizal</Text>
        <Text style={styles.address}>Taghangin, Morong, Rizal Philippines</Text>
        <Text style={styles.address}>Tel. Nos.: (02) 234-5566</Text>
      </View>
      <View style={styles.section}>
        <Text>Employee Name: {employeeName}</Text>
        <Text>Period: {payPeriod}</Text>
      </View>
      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, styles.tableHeaderCellLeft, styles.dateCell]}>Date</Text>
          <Text style={styles.tableHeaderCell}>Time In</Text>
          <Text style={[styles.tableHeaderCell, styles.tableHeaderCellRight]}>Time Out</Text>
        </View>
        {records.map((rec, i) => (
          <View key={rec.date} style={[styles.tableRow, i % 2 === 0 ? styles.evenRow : styles.oddRow]}> 
            <Text style={[styles.tableCell, styles.dateCell]}>{rec.date} {rec.dayName ? `(${rec.dayName})` : ''}</Text>
            <Text style={styles.tableCell}>{rec.timeIn || '-'}</Text>
            <Text style={styles.tableCell}>{rec.timeOut || '-'}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default BiometricTimeRecordTemplate;
