import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="relative min-h-svh w-full flex items-center justify-center overflow-hidden">
            {/* Background image */}
            <div
                className="fixed inset-0 w-full h-full z-0"
                style={{
                    backgroundImage: 'url(/img/tcc2.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.8,
                    pointerEvents: 'none',
                }}
            />
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/80 dark:bg-black/90 z-0" />
            {/* Card content */}
            <div className="relative z-10 flex min-h-svh flex-col items-center justify-center p-6 md:p-10 w-full">
                <div className="w-full max-w-xl p-10">
                    <Card className="rounded-2xl w-full">
                        <CardHeader className="pt-8 pb-0 text-center flex flex-col items-center w-full">
                            {/* TCC Logo inside the card, linking to welcome page */}
                            <Link href={route('home')} className="mb-4">
                                <img src="/img/tcc_logo.png" alt="Tomas Claudio Colleges Logo" className="h-20 w-20 object-contain mx-auto" />
                            </Link>
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="py-8 w-full">{children}</CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
