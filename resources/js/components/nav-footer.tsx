import { NavItem } from '@/types';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Link } from '@inertiajs/react';
// Import LucideIcon type for accurate type assertion
import { type LucideIcon } from 'lucide-react'; 

interface NavFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    items: NavItem[];
}

export function NavFooter({ items, className, ...props }: NavFooterProps) {
    return (
        <div className={cn("flex flex-col space-y-1", className)} {...props}>
            {items.map((item) => {
                const isExternal = item.href.startsWith('http');
                const Component = isExternal ? 'a' : Link;

                // --- FIX APPLIED HERE ---
                // Assert item.icon as a valid component type (LucideIcon).
                // TypeScript now trusts that if it exists, it can be rendered.
                const IconComponent = item.icon as LucideIcon;
                // --- END FIX ---

                return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton size="lg" asChild>
                            <Component 
                                href={item.href} 
                                target={isExternal ? '_blank' : undefined} 
                                rel={isExternal ? 'noopener noreferrer' : undefined}
                            >
                                {/* Use the asserted IconComponent variable */}
                                {IconComponent && <IconComponent className="size-5 shrink-0" />} 
                                <span>{item.title}</span>
                            </Component>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </div>
    );
}