import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-4">
            <AppLogoIcon className="h-18 w-18 rounded-full object-cover" />
            <div className="ml-1 grid flex-1 text-left">
                <span className="mb-0.5 leading-tight font-semibold text-sm">Effipay</span>
                {/* <span className="text-xs leading-tight font-medium text-muted-foreground">Payroll Management System</span> */}
            </div>
        </div>
    );
}
