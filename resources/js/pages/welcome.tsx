import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
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
                <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-0" />
                {/* Effipay Card */}
                <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-lg p-10 rounded-2xl border border-primary/30 shadow-2xl bg-white/80 dark:bg-neutral-900/90 backdrop-blur-lg">
                    <img src="/img/tcc_logo.png" alt="Tomas Claudio Colleges Logo" className="h-20 w-20 object-contain mb-5 mx-auto" />
                    <h1 className="text-4xl font-extrabold text-primary mb-3 text-center drop-shadow-lg tracking-tight">Effipay</h1>
                    <h2 className="text-xl font-semibold text-foreground mb-4 text-center">A Web-Based Payroll System</h2>
                    <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
                        Effipay is the official payroll system for Tomas Claudio Colleges, designed to streamline and secure payroll management for the institution.
                    </p>
                    <div className="w-full">
                        <Link href={route('login')}> 
                            <Button className="w-full h-10 ">Log in</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
