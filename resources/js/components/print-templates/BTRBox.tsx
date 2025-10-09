import React from 'react';
import { Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { Employees } from '@/types';

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
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    minHeight: 120,
    maxHeight: 600,
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
    fontSize: 8,
  },
});

const DAY_LABELS: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
};

const LEAVE_COLOR_MAP: Record<string, { bg: string; text: string; }> = {
    'Paid Leave': { bg: '#dcfce7', text: '#166534' },
    'Maternity Leave': { bg: '#dbeafe', text: '#1e40af' },
    'Sick Leave': { bg: '#ffedd5', text: '#9a3412' },
    'Study Leave': { bg: '#f3e8ff', text: '#6b21a8' },
    'DEFAULT': { bg: '#f3f4f6', text: '#1f2937' },
};

interface TimeRecord {
  date: string;
  timeIn?: string | null;
  timeOut?: string | null;
  time_in?: string | null;
  time_out?: string | null;
  clock_in?: string | null;
  clock_out?: string | null;
}

interface BTRBoxProps {
  employee: Employees | null;
  leaveDatesMap: Record<string, string>;
  employeeName?: string;
  role?: string;
  payPeriod?: string;
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
    const match = period.match(/^(\d{4})-(\d{2})/);
    if (match) {
      year = parseInt(period.substring(0, 4), 10);
      month = parseInt(match[1], 10);
    }
  }
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
  const lastDay = new Date(year, month, 0).getDate();
  return `${monthName} 1-${lastDay}, ${year}`;
};

function getDayName(dateStr: string) {
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
}

const normalizeDate = (date: string) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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

const getNum = (v: string | number | undefined | null) => {
  if (v === undefined || v === null || v === '') return 0;
  if (typeof v === 'string') return Number(v.replace(/,/g, ''));
  return v;
};

const BTRBox: React.FC<BTRBoxProps> = ({
  employee,
  leaveDatesMap,
  employeeName = '-',
  role = '',
  payPeriod,
  records = [],
  totalHours = 0,
  tardiness = 0,
  undertime = 0,
  overtime = 0,
  absences = 0,
}) => {
  const daysInMonth = payPeriod
    ? new Date(
        parseInt(payPeriod.split("-")[0]),
        parseInt(payPeriod.split("-")[1]),
        0
      ).getDate()
    : 0;
  const year = payPeriod ? payPeriod.split("-")[0] : "";
  const month = payPeriod ? payPeriod.split("-")[1] : "";
  const recordMap: Record<string, TimeRecord> = {};
  records.forEach((rec) => {
    recordMap[normalizeDate(rec.date)] = rec;
  });

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Image style={styles.logo} src="/img/tcc_logo2.jpg" />
        <View style={styles.headerTextCol}>
          <Text style={styles.title}>TOMAS CLAUDIO COLLEGES</Text>
          <Text style={styles.subtitle}>Higher Education Pioneer in Eastern Rizal</Text>
          <Text style={styles.subtitle}>Taghangin, Morong, Rizal Philippines</Text>
          <Text style={styles.subtitle}>Tel. Nos.: (02) 234-5566</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Text>
            Employee Name: <Text style={{ fontWeight: 'bold' }}>{employeeName || '-'}</Text>
          </Text>
          <Text style={{ marginTop: 4 }}>
            Job Title: <Text style={{ fontWeight: 'bold' }}>{(() => {
              const order = ['administrator', 'college instructor', 'basic education instructor'];
              const rolesArr = (role || '').split(',').map(r => r.trim()).filter(Boolean);
              const ordered = [
                ...order.filter(o => rolesArr.includes(o)),
                ...rolesArr.filter(r => !order.includes(r))
              ];
              return ordered.length > 0
                ? ordered.map(r => r.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(', ')
                : '-';
            })()}</Text>
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text>
            Period: <Text style={{ fontWeight: 'bold' }}>{getPayPeriodString(payPeriod)}</Text>
          </Text>
        </View>
      </View>
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
          
          const leaveType = leaveDatesMap[dateStr];
          const isLeaveDay = !!leaveType;

          const dayName = getDayName(dateStr);
          const workDays = employee?.work_days || [];
          const isWorkDay = workDays.some(workDay => DAY_LABELS[workDay.day] === dayName);
          const isPaidLeaveDay = isLeaveDay && isWorkDay;

          const colors = isLeaveDay ? (LEAVE_COLOR_MAP[leaveType] || LEAVE_COLOR_MAP.DEFAULT) : null;

          const rowStyle = [
              styles.tableRow,
              isLeaveDay && colors ? { backgroundColor: colors.bg } : (isEven ? styles.evenRow : styles.oddRow)
          ];
          
          const textStyle = isLeaveDay && colors ? { color: colors.text } : {};

          return (
            <View key={dateStr} style={rowStyle}>
              <Text style={[styles.tableCell, styles.dateCell, textStyle]}>
                  {`${dateStr}${dayName ? ` (${dayName})` : ''}`}
                  {isPaidLeaveDay && <Text style={{fontWeight: 'bold', fontSize: 6, textTransform: 'uppercase'}}>{` - ${leaveType}`}</Text>}
              </Text>
              <Text style={[styles.tableCell, textStyle]}>{rec?.timeIn || rec?.clock_in || rec?.time_in || (isPaidLeaveDay ? leaveType : "-")}</Text>
              <Text style={[styles.tableCell, textStyle]}>{rec?.timeOut || rec?.clock_out || rec?.time_out || (isPaidLeaveDay ? leaveType : "-")}</Text>
            </View>
          );
        })}
      </View>
      <View style={{marginBottom: 2 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 8 }}>Summary:</Text>
      </View>
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20, marginBottom: 0 }}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text>CONFORME:</Text>
            <View style={{ borderBottomWidth: 1, borderColor: '#222', minWidth: 120, marginLeft: 4, marginRight: 4 }}>
              <Text style={{ color: 'transparent' }}>{' '.repeat(32)}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'center', marginTop: 2, minWidth: 120, marginLeft: 60 }}>
            <Text style={{ fontSize: 7 }}>(Signature over Printed Name)</Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Text>VERIFIED:</Text>
            <View style={{ borderBottomWidth: 1, borderColor: '#222', minWidth: 120, marginLeft: 4, marginRight: 4 }}>
              <Text style={{ color: 'transparent' }}>{' '.repeat(32)}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'center', marginTop: 2, minWidth: 120, marginRight: 0 }}>
            <Text style={{ fontSize: 7 }}>(Signature over Printed Name)</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default BTRBox;