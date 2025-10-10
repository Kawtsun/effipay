import { Card } from '@/components/ui/card'; 
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import React from 'react';
import { type BreadcrumbItem } from '@/types';
import { motion } from 'framer-motion'; 

import { PageContent } from '@/components/about/page-content'; 


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'About',
        href: '/about',
    },
];

// Refined animation variants for a smoother, quicker initial fade
const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut", // Better easing for the main element
        },
    },
};


export default function About() { 
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="About" />
            <div className='p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'> {/* Use max-width for better desktop UX */}
                {/* Main page motion wrapper */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Improved Card styling for a modern look (subtle shadow and better background) */}
                    <Card className={`shadow-xl border bg-card text-card-foreground rounded-xl text-center overflow-hidden`}>
                        <PageContent />
                    </Card>
                </motion.div>
            </div>
        </AppLayout>
    );
}