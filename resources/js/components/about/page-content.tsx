import React from 'react';
import { motion, Variants } from 'framer-motion'; 
import { AspectRatio } from '@/components/ui/aspect-ratio'; 
import { ProgrammerAvatar, programmers } from './programmer-avatar'; 
import { School, Briefcase } from 'lucide-react'; 

// Variants for a subtle fade-in and scale for individual items
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.6,
            delay: 0.1 + index * 0.12, 
            ease: [0.17, 0.55, 0.55, 1],
        },
    }),
};

/**
 * Contains all the specific content and layout for the About page.
 */
export function PageContent() {
    return (
        <div className="p-4 sm:p-12">
            <div className='max-w-5xl mx-auto'>
                {/* --- Hero Section --- */}
                <div className='pt-8 pb-12 text-left border-b border-border'>
                    <motion.h1 
                        className='text-5xl sm:text-6xl font-extrabold mb-4 tracking-tight text-foreground'
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
                    >
                        About The Project
                    </motion.h1>
                    <motion.p 
                        className='text-lg md:text-xl text-muted-foreground max-w-4xl'
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 } }}
                    >
                        A thesis system developed to solve a critical business need, built with the <strong className="font-semibold">spirit of teamwork and meticulous engineering</strong>.
                    </motion.p>
                </div>

                {/* --- Team Section --- */}
                <div className="my-16">
                    <h2 className="text-3xl font-bold mb-12 text-center text-foreground">
                        Developers
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 sm:gap-x-10 justify-items-center">
                        {programmers.map((programmer, index) => (
                            <motion.div
                                key={programmer.id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                custom={index}
                            >
                                <ProgrammerAvatar 
                                    name={programmer.name}
                                    imageUrl={programmer.imageUrl}
                                    initials={programmer.initials}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ------------------------------------------------------------------- */}
                {/* --- System Project Objective (Narrative Flow Implemented) --- */}
                {/* ------------------------------------------------------------------- */}
                <div className='mt-20 pt-12 border-t border-border text-left'>
                    <motion.h2 
                        className="text-3xl font-bold mb-8 text-foreground"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={5} 
                    >
                        System Project Objective
                    </motion.h2>
                    
                    <motion.p 
                        className='text-lg mt-4 mb-8 text-foreground'
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={6}
                    >
                        This system was developed <strong className="font-semibold">In Partial Fulfillment of the Requirements for the Degree Bachelor of Science in Computer Science</strong>.
                    </motion.p>
                    
                    {/* Unified Grid Layout for Context Boxes (Now focusing on narrative flow) */}
                    <div className='grid md:grid-cols-2 gap-6'>
                        
                        {/* 1. Academic Affiliation - Content in sentence form */}
                        <motion.div
                            className='p-6 bg-card border rounded-xl shadow-md transition-shadow hover:shadow-lg'
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.7 } }}
                        >
                            <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-foreground">
                                <School className="w-5 h-5 text-primary" />
                                Academic Affiliation
                            </h3>
                            <p className='text-base text-muted-foreground'>
                                This project is proudly affiliated with <strong className="font-semibold text-foreground">URS Morong Campus</strong>. Its successful completion serves as a core requirement, showcasing our team's ability to apply advanced theoretical knowledge to practical problem-solving in software development.
                            </p>
                        </motion.div>

                        {/* 2. Project Context/Client - Content in sentence form, neutral icon color */}
                        <motion.div
                            className='p-6 bg-card border rounded-xl shadow-md transition-shadow hover:shadow-lg'
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.8 } }}
                        >
                            <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-foreground">
                                <Briefcase className="w-5 h-5 text-primary" /> 
                                Client
                            </h3>
                            <p className='text-base text-muted-foreground'>
                                We partnered with <strong className="font-semibold text-foreground">Tomas Claudio Colleges</strong> to develop this <strong className="font-semibold text-foreground">Payroll System</strong>. The project directly addresses their need to replace an outdated, error-prone, <strong className="font-semibold text-foreground">Excel-based payroll system</strong> with a robust, modern, and automated solution.
                            </p>
                        </motion.div>
                    </div>


                    {/* Image Section: Aspect Ratio Implementation --- */}
                    <div className="mt-12 flex flex-col items-center">
                        <motion.div
                            className='w-full shadow-xl rounded-lg overflow-hidden'
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1, transition: { duration: 0.7, delay: 0.9 } }}
                        >
                            <AspectRatio ratio={16 / 9}>
                                <img 
                                    className='h-full w-full object-cover' 
                                    src="img/kessoku-band.jpg" 
                                    alt="System Architecture Diagram or Team Photo" 
                                />
                            </AspectRatio>
                        </motion.div>
                        
                        <motion.p 
                            className='text-sm text-muted-foreground mt-4 text-center max-w-2xl'
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 1.0 } }}
                        >
                            Made by Kessoku Band
                        </motion.p>
                    </div>
                </div>
            </div>
        </div>
    );
}