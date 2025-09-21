import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import BTRBox from './BTRBox';

interface BTRBatchTemplateProps {
  btrs: Array<{
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
