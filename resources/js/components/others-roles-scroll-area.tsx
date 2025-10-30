import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';

interface OthersRolesScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function OthersRolesScrollArea({ children, className = '', style }: OthersRolesScrollAreaProps) {
  return (
    <ScrollArea
      className={`h-40 max-h-40 rounded-md border border-gray-200 dark:border-gray-700 ${className}`}
      style={style}
      type="always"
    >
      <div className="px-3 py-2 pr-4">{children}</div>
    </ScrollArea>
  );
}
