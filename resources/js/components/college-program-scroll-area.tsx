import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';

interface CollegeProgramScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function CollegeProgramScrollArea({ children, className = '', style }: CollegeProgramScrollAreaProps) {
  return (
    <ScrollArea
      className={`h-40 max-h-40 rounded-md border p-2 ${className}`}
      style={style}
      type="always"
    >
      <div className="px-3 py-2 pr-4">{children}</div>
    </ScrollArea>
  );
}
