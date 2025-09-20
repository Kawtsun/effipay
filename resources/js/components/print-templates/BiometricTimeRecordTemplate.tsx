

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
    justifyContent: 'center',
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
  tableContainer: {
    marginTop: 12,
    marginBottom: 18, // leave space for labels below
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    minHeight: 120,
    maxHeight: 600, // ensure table doesn't take whole page
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    minHeight: 20,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 8,
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
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  evenRow: {
    backgroundColor: '#fafbfc',
  },
  oddRow: {
    backgroundColor: '#fff',
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
    flex: 1,
    textAlign: 'left',
    color: '#222',
    fontFamily: 'Helvetica',
  },
  dateCell: {
    flex: 2,
    // fontFamily: 'Courier',
    fontSize: 8,
  },
});


interface BiometricTimeRecordTemplateProps {
  employeeName?: string;
  payPeriod?: string; // 'YYYY-MM' or 'YYYY-MM-DD'
  records?: TimeRecord[];
  totalHours?: number | string;
  tardiness?: number | string;
  undertime?: number | string;
  overtime?: number | string;
  absences?: number | string;
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

// Helper for day name
function getDayName(dateStr: string) {
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
}

interface TimeRecord {
  date: string; // YYYY-MM-DD
  timeIn?: string | null;
  timeOut?: string | null;
  time_in?: string | null;
  time_out?: string | null;
  clock_in?: string | null;
  clock_out?: string | null;
}

interface TableProps {
  records: TimeRecord[];
  payPeriod?: string;
}

const normalizeDate = (date: string) => {
  // Always returns YYYY-MM-DD with leading zeros
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const TimekeepingTable: React.FC<TableProps> = ({ records, payPeriod }) => {
  // Generate days for the month
  const daysInMonth = payPeriod
    ? new Date(
        parseInt(payPeriod.split("-")[0]),
        parseInt(payPeriod.split("-")[1]),
        0
      ).getDate()
    : 0;
  const year = payPeriod ? payPeriod.split("-")[0] : "";
  const month = payPeriod ? payPeriod.split("-")[1] : "";
  // Map records by normalized date for quick lookup
  const recordMap: Record<string, TimeRecord> = {};
  records.forEach((rec) => {
    recordMap[normalizeDate(rec.date)] = rec;
  });
  return (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, styles.tableHeaderCellLeft, styles.dateCell]}>Date</Text>
        <Text style={styles.tableHeaderCell}>Time In</Text>
        <Text style={[styles.tableHeaderCell, styles.tableHeaderCellRight]}>Time Out</Text>
      </View>
      {Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dateStr = `${year}-${month.padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const rec = recordMap[dateStr];
        const isEven = i % 2 === 0;
        const dayName = getDayName(dateStr);
        return (
          <View key={dateStr} style={[styles.tableRow, isEven ? styles.evenRow : styles.oddRow]}> 
            <Text style={[styles.tableCell, styles.dateCell]}>{dateStr}{dayName ? ` (${dayName})` : ''}</Text>
            <Text style={styles.tableCell}>{rec?.timeIn || rec?.clock_in || rec?.time_in || "-"}</Text>
            <Text style={styles.tableCell}>{rec?.timeOut || rec?.clock_out || rec?.time_out || "-"}</Text>
          </View>
        );
      })}
    </View>
  );
};



// Format numbers with commas and 2 decimal places (copied from PayslipTemplate)
const formatWithCommas = (value: string | number): string => {
  let num = 0;
  if (value === null || value === undefined || value === '') {
    num = 0;
  } else {
    if (typeof value === 'string') {
      num = Number(value.replace(/,/g, ''));
    } else {
      num = value;
    }
    if (isNaN(num)) num = 0;
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper to get numeric value
const getNum = (v: string | number | undefined | null) => {
  if (v === undefined || v === null || v === '') return 0;
  if (typeof v === 'string') return Number(v.replace(/,/g, ''));
  return v;
};

const BiometricTimeRecordTemplate: React.FC<BiometricTimeRecordTemplateProps> = ({
  employeeName = '-',
  payPeriod,
  records = [],
  totalHours = 0,
  tardiness = 0,
  undertime = 0,
  overtime = 0,
  absences = 0,
}) => (
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8 }}>
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
      {/* Timekeeping Table */}
      <TimekeepingTable records={records} payPeriod={payPeriod} />
      {/* Summary Label */}
      <View style={{marginBottom: 2 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Summary:</Text>
      </View>
      {/* Summary Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 0, marginBottom: 0, fontSize: 8 }}>
        <Text style={{ flex: 1, textAlign: 'left' }}>
          TOTAL HOURS: <Text style={{ fontWeight: 'bold' }}>{formatWithCommas(getNum(totalHours))}</Text>
        </Text>
        <Text style={{ flex: 1, textAlign: 'center' }}>
          TARDINESS: <Text style={{ fontWeight: 'bold' }}>{formatWithCommas(getNum(tardiness))}</Text>
        </Text>
        <Text style={{ flex: 1, textAlign: 'center' }}>
          UNDERTIME: <Text style={{ fontWeight: 'bold' }}>{formatWithCommas(getNum(undertime))}</Text>
        </Text>
        <Text style={{ flex: 1, textAlign: 'center' }}>
          OVERTIME: <Text style={{ fontWeight: 'bold' }}>{formatWithCommas(getNum(overtime))}</Text>
        </Text>
        <Text style={{ flex: 1, textAlign: 'right' }}>
          ABSENCES: <Text style={{ fontWeight: 'bold' }}>{formatWithCommas(getNum(absences))}</Text>
        </Text>
      </View>
    </Page>
  </Document>
);

// ...existing code...
export default BiometricTimeRecordTemplate;
