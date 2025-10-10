import React, { useMemo } from 'react';
import { Copyright } from 'lucide-react'; 

// The component is simplified and no longer needs the isCollapsed prop or its interface.

export function SidebarCopyrightFooter() {
    // Get the current year dynamically, adjusted for Manila time
    const currentYear = useMemo(() => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            // Current time is 2025 in Manila, so the year will be 2025.
            timeZone: 'Asia/Manila' 
        };
        try {
            return new Intl.DateTimeFormat('en-PH', options).format(now);
        } catch (e) {
            return now.getFullYear().toString();
        }
    }, []);

    // This will render, e.g., "2025 Kessoku Band. All Rights Reserved."
    const fullCopyrightText = `${currentYear} Kessoku Band. All Rights Reserved.`;

    return (
        // Minimal padding (px-2, py-3) and border to fit the space
        <div className="mt-auto px-2 py-3 border-t border-gray-200 dark:border-gray-800">
            {/* Simple static div, ensures the icon and text are on one line */}
            <div
                // Use the smallest font and enforce no wrapping
                className="flex items-center justify-start text-[10px] text-muted-foreground whitespace-nowrap" 
            >
                {/* LUCIDE ICON USAGE - inline and vertically centered */}
                <Copyright className="h-3 w-3 mr-1.5" /> 
                <span>{fullCopyrightText}</span>
            </div>
        </div>
    );
}