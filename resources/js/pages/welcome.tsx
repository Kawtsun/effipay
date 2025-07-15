import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function Welcome() {
    const [loading, setLoading] = useState(false);
    const handleProceed = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            window.location.href = route('login');
        }, 200); // Show loader for 200ms
    };
    return (
        <>
            <Head title="Welcome">
                {/* Removed custom font, using default font stack */}
            </Head>
            <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
                {/* Background image using imported asset */}
                <div
                    className="fixed inset-0 w-full h-full z-0"
                    style={{
                        backgroundImage: 'url(/img/tcc.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.8,
                        pointerEvents: 'none',
                    }}
                />
                {/* Overlay for extra contrast */}
                <div className="fixed inset-0 bg-black/80 dark:bg-black/90 z-0" />
                {/* Effipay Card using shadcn Card */}
                <Card className="relative z-10 w-full max-w-lg rounded-2xl border border-primary/30 shadow-2xl bg-white/80 dark:bg-neutral-900/90 backdrop-blur-lg p-0 select-none">
                    <CardHeader className="flex flex-col items-center pt-10 pb-0">
                        <AppLogoIcon className="h-30 w-30 rounded-full object-cover mx-auto" />
                        <h1 className="text-4xl font-extrabold text-primary mb-3 text-center drop-shadow-md tracking-tight">Effipay</h1>
                        <h2 className="text-xl font-semibold text-foreground mb-4 text-center drop-shadow-lg">A Web-Based Payroll Management System</h2>
                        <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
                            Effipay is the official payroll system for Tomas Claudio Colleges, designed to streamline and secure payroll management for the institution.
                        </p>
                    </CardHeader>
                    <CardContent className="w-full pb-10">
                        <div className="w-full">
                            <Button className="w-full h-10" onClick={handleProceed} disabled={loading}>
                                {loading && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                Proceed
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
