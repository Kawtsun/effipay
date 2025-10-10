import React, { useMemo } from 'react';
import { Copyright } from 'lucide-react'; 

// The component is simplified and no longer needs the isCollapsed prop or its interface.

import { useSidebar } from '@/components/ui/sidebar';

export function SidebarCopyrightFooter() {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';
    const currentYear = useMemo(() => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            timeZone: 'Asia/Manila'
        };
        try {
            return new Intl.DateTimeFormat('en-PH', options).format(now);
        } catch {
            return now.getFullYear().toString();
        }
    }, []);
    const fullCopyrightText = `${currentYear} Kessoku Band. All Rights Reserved.`;

    return (
        <div className="mt-auto px-2 py-3 border-t border-gray-200 dark:border-gray-800">
            <div
                className={`flex items-center justify-center text-[10px] text-muted-foreground whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
                <div className={
                    `relative flex items-center group ${isCollapsed ? 'cursor-pointer' : ''}`
                }>
                    <Copyright className="h-4 w-4" />
                    <span
                        className={`ml-1 transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 pointer-events-none group-hover:opacity-100 group-hover:w-auto group-hover:pointer-events-auto absolute left-full top-1/2 -translate-y-1/2 bg-background px-2 py-1 rounded shadow border border-gray-200 dark:border-gray-800 z-[9999]' : ''}`}
                        style={isCollapsed ? { minWidth: 'max-content' } : {}}
                    >
                        {fullCopyrightText}
                    </span>
                    {/* Only show text on hover when collapsed */}
                </div>
            </div>
        </div>
    );
}