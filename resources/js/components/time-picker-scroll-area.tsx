import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';

interface TimePickerScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * TimePickerScrollArea
 * Custom scroll area for hours/minutes in time picker.
 */
export default function TimePickerScrollArea({ children, className = '', style }: TimePickerScrollAreaProps) {
  return (
    <ScrollArea
      className={`max-h-32 h-32 rounded-md bg-white dark:bg-gray-950 ${className}`}
      style={style}
      type="auto"
    >
      <div className="px-0 py-0 pr-4">{children}</div>
    </ScrollArea>
  );
}
