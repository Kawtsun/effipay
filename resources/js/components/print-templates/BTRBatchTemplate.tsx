import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import BTRBox from './BTRBox';
import { Employees } from '@/types';

interface BTRBatchTemplateProps {
  btrs: Array<{
    employee: Employees;
    leaveDatesMap: Record<string, string>;
    employeeName: string;
    role?: string;
    payPeriod?: string;
    records?: any[];
    totalHours?: number | string;
    tardiness?: number | string;
    undertime?: number | string;
    overtime?: number | string;
    absences?: number | string;
  }>;
}

const BTRBatchTemplate: React.FC<BTRBatchTemplateProps> = ({ btrs }) => {
  return (
    <Document>
      {btrs.map((btr, idx) => (
        <Page key={idx} size="A4">
          <BTRBox
            employee={btr.employee}
            leaveDatesMap={btr.leaveDatesMap}
            employeeName={btr.employeeName}
            role={btr.role}
            payPeriod={btr.payPeriod}
            records={btr.records}
            totalHours={btr.totalHours}
            tardiness={btr.tardiness}
            undertime={btr.undertime}
            overtime={btr.overtime}
            absences={btr.absences}
          />
        </Page>
      ))}
    </Document>
  );
};

export default BTRBatchTemplate;