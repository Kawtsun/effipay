// About page (Minor style adjustment)
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

const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut",
        },
    },
};


export default function About() { 
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="About" />
            <div className='p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Simplified Card: Focus on rounded corners and a subtle, single shadow */}
                    <Card className={`shadow-lg border bg-card rounded-xl overflow-hidden`}>
                        <PageContent />
                    </Card>
                </motion.div>
            </div>
        </AppLayout>
    );
}