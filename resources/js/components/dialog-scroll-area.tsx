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
      className={`h-[80vh] max-h-[80vh] rounded-md bg-white dark:bg-gray-950 ${className}`}
      style={style}
      type="always"
    >
      <div className="px-0 py-0 pr-2">{children}</div>
    </ScrollArea>
  );
}
