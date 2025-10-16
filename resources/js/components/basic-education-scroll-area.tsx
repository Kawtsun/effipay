import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';

interface BasicEducationScrollAreaProps {
    children: React.ReactNode;
    className?: string;
}

export default function BasicEducationScrollArea({ children, className }: BasicEducationScrollAreaProps) {
    return (
        <ScrollArea className={`h-auto max-h-48 rounded-md border p-4 ${className}`}>
            {children}
        </ScrollArea>
    );
}
