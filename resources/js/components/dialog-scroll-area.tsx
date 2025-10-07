import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';

interface DialogScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function DialogScrollArea({ children, className = '', style }: DialogScrollAreaProps) {
  return (
    <ScrollArea
      className={`h-[80vh] max-h-[80vh] rounded-md ${className}`}
      style={style}
      type="auto"
    >
      <div className="px-0 py-0 pr-4">{children}</div>
    </ScrollArea>
  );
}
