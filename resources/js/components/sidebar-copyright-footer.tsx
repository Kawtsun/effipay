import React, { useMemo, useRef, useEffect, useState } from 'react';
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

    // For collapsed: show tooltip on hover
    const [showTooltip, setShowTooltip] = useState(false);
    const iconRef = useRef<HTMLSpanElement>(null);
    const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });

    useEffect(() => {
        if (!isCollapsed) return;
        const icon = iconRef.current;
        if (!icon) return;
        const handleEnter = () => {
            const rect = icon.getBoundingClientRect();
            setTooltipPos({ left: rect.right + 8, top: rect.top + rect.height / 2 });
            setShowTooltip(true);
        };
        const handleLeave = () => setShowTooltip(false);
        icon.addEventListener('mouseenter', handleEnter);
        icon.addEventListener('mouseleave', handleLeave);
        return () => {
            icon.removeEventListener('mouseenter', handleEnter);
            icon.removeEventListener('mouseleave', handleLeave);
        };
    }, [isCollapsed]);

    return (
        <div className="mt-auto px-2 py-3 border-t border-gray-200 dark:border-gray-800">
            <div
                className={`flex items-center justify-center text-[10px] text-muted-foreground whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
                <span ref={iconRef} className={isCollapsed ? 'cursor-pointer relative' : ''}>
                    <Copyright className="h-4 w-4" />
                </span>
                {!isCollapsed && (
                    <span className="ml-1">{fullCopyrightText}</span>
                )}
                {/* Tooltip for collapsed state, absolutely positioned */}
                {isCollapsed && showTooltip && (
                    <div
                        style={{
                            position: 'fixed',
                            left: tooltipPos.left,
                            top: tooltipPos.top,
                            transform: 'translateY(-50%)',
                            zIndex: 99999,
                            background: 'var(--background, #fff)',
                            color: 'var(--muted-foreground, #888)',
                            borderRadius: 6,
                            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                            border: '1px solid #e5e7eb',
                            padding: '4px 10px',
                            fontSize: 10,
                            pointerEvents: 'none',
                            minWidth: 'max-content',
                        }}
                    >
                        {fullCopyrightText}
                    </div>
                )}
            </div>
        </div>
    );
}