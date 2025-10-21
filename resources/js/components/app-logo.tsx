import AppLogoIcon from './app-logo-icon';

import { useSidebar } from '@/components/ui/sidebar';

export default function AppLogo() {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';
    return (
        <div
            className={`flex items-center transition-all duration-200 ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-4 px-2 py-2'}`}
        >
            <AppLogoIcon
                className={`rounded-full object-cover transition-all duration-200 ${isCollapsed ? 'h-12 w-12' : 'h-18 w-18'}`}
            />
            {!isCollapsed && (
                <div className="ml-1 grid flex-1 text-left">
                    <span className="mb-0.5 leading-tight font-semibold text-sm">Effipay</span>
                </div>
            )}
        </div>
    );
}
