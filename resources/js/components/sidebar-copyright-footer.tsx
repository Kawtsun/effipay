import React, { useMemo } from 'react';
import { Copyright } from 'lucide-react'; 
import { useSidebar } from '@/components/ui/sidebar'; // Assuming this import is correct

// Import the custom Tooltip components you provided
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'; 

export function SidebarCopyrightFooter() {
    // Correctly get the collapsed state from the sidebar context
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
    
    // The final text for the tooltip
    const fullCopyrightText = `${currentYear} Kessoku Band. All Rights Reserved.`;

    // The content for the expanded state (icon + text)
    const expandedContent = (
        <div 
            // Ensures icon and text are on a single line with small font
            className="flex items-center justify-start text-[10px] text-muted-foreground whitespace-nowrap" 
        >
            <Copyright className="h-3 w-3 mr-1.5" /> 
            <span>{fullCopyrightText}</span>
        </div>
    );

    // The content for the collapsed state (just the icon with tooltip)
    const collapsedContent = (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                {/* Icon is the trigger for the tooltip */}
                <div className="flex justify-center w-full cursor-pointer">
                    <Copyright className="h-4 w-4 text-muted-foreground/80" />
                </div>
            </TooltipTrigger>
            
            <TooltipContent 
                side="right" 
                align="center"
            >
                {/* Tooltip content: Icon and text combined on one line */}
                <span className="flex items-center whitespace-nowrap">
                    <Copyright className="h-3 w-3 mr-1" />
                    {fullCopyrightText}
                </span>
            </TooltipContent>
        </Tooltip>
    );

    return (
        <div className="mt-auto px-2 py-3 border-t border-gray-200 dark:border-gray-800">
            {isCollapsed ? (
                // Collapsed state: Show icon with Tooltip
                collapsedContent
            ) : (
                // Expanded state: Show full text inline
                expandedContent
            )}
        </div>
    );
}