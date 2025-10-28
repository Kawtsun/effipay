import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';

interface DialogScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function DialogScrollArea({ children, className = '', style }: DialogScrollAreaProps) {
  // Make the scroll area flexible to its container instead of forcing a fixed viewport height.
  // Parent should be a flex column and give this component the remaining height (flex-1 min-h-0).
  return (
    <ScrollArea
      className={`flex-1 min-h-0 rounded-md ${className}`}
      style={style}
      type="auto"
    >
      <div className="px-0 py-0 pr-4">{children}</div>
    </ScrollArea>
  );
}
