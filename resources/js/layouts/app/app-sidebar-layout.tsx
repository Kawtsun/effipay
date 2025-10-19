// app-sidebar-layout.tsx
import { AppContent } from '@/components/app-content';
import AppContentScrollArea from '@/components/app-content-scroll-area';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import TccHeader from '@/components/tcc-header';
import { Toaster } from '@/components/ui/sonner';
import { type BreadcrumbItem } from '@/types';
import { StickySearchProvider } from '@/contexts/sticky-search';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <div className="min-h-screen w-full flex flex-col">
            {/* Fixed Header */}
            <TccHeader />
            {/* Main content below header */}
            <AppShell variant="sidebar">
                <div className="flex flex-1 pt-[94px]">
                    <AppSidebar />
                    {/* 👇 REMOVE overflow-hidden from here */}
                    <AppContent variant="sidebar">
                        <StickySearchProvider>
                            <AppSidebarHeader breadcrumbs={breadcrumbs} />
                            <AppContentScrollArea>
                                {children}
                            </AppContentScrollArea>
                        </StickySearchProvider>
                    </AppContent>
                    <Toaster richColors position={'top-right'} visibleToasts={5} />
                </div>

            </AppShell>
        </div>
    );
}