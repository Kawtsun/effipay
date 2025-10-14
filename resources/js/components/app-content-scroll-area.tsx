// app-content-scroll-area.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';

interface AppContentScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function AppContentScrollArea({ children, className = '', style }: AppContentScrollAreaProps) {
   return (
    <ScrollArea
      // 👇 REPLACE the classes with an explicit height calculation.
      // This will force it to the correct size.
      className={`h-[calc(100vh-158px)] w-full bg-transparent ${className}`}
      style={style}
      type="auto"
    >
      <div className="h-full px-0 py-0 pr-4">{children}</div>
    </ScrollArea>
  );
}