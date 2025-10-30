import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';

interface FilterScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function FilterScrollArea({ children, className = '', style }: FilterScrollAreaProps) {
  return (
    <ScrollArea
      className={`h-[500px] max-h-[500px] rounded-md ${className}`}
      style={style}
      type="auto"
    >
      <div className="px-0 py-0 pr-4">{children}</div>
    </ScrollArea>
  );
}
