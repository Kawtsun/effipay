import { AspectRatio } from '@/components/ui/aspect-ratio';
import { motion, Variants } from 'framer-motion';
import { Briefcase, School } from 'lucide-react';
import { ProgrammerAvatar, programmers } from './programmer-avatar';
import AppLogoIcon from '../app-logo-icon';

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
            <div className="mx-auto max-w-5xl">
                {/* --- Hero Section --- */}
                <div className="border-b border-border pt-12 pb-16 text-left">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex-1">
                            <motion.h1
                                className="mb-6 text-5xl font-extrabold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl"
                                style={{ letterSpacing: '-0.04em' }}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
                            >
                                About the Project
                            </motion.h1>
                            <motion.p
                                className="max-w-2xl text-lg font-light leading-relaxed text-zinc-600 md:text-xl md:leading-8"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 } }}
                            >
                                Welcome to <span className="font-semibold text-foreground">Effipay</span>, a dedicated payroll management system crafted in partnership with <span className="font-semibold text-foreground">Tomas Claudio Colleges</span> to address the unique needs of educational institutions.<br className="hidden md:block" />
                                <span className="block mt-4">Our mission is to streamline payroll from start to finish, providing a <span className="font-semibold text-foreground">secure</span>, <span className=" font-semibold text-foreground">reliable</span>, and <span className="font-semibold text-foreground">efficient</span> platform for managing employee compensation, tracking work days, and processing payments with confidence.</span>
                            </motion.p>
                        </div>
                        <div className="flex justify-center md:justify-end md:items-start md:ml-8">
                            <AppLogoIcon className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48" />
                        </div>
                    </div>
                </div>

                {/* --- Team Section --- */}
                <div className="my-24">
                    <h2 className="mb-14 text-center text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                        Meet the Developers
                    </h2>
                    <div className="grid grid-cols-2 justify-items-center gap-x-6 gap-y-12 sm:gap-x-10 md:grid-cols-4">
                        {programmers.map((programmer, index) => (
                            <motion.div key={programmer.id} variants={itemVariants} initial="hidden" animate="visible" custom={index}>
                                <ProgrammerAvatar name={programmer.name} imageUrl={programmer.imageUrl} initials={programmer.initials} fullName={programmer.fullName} />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ------------------------------------------------------------------- */}
                {/* --- System Project Objective (Narrative Flow Implemented) --- */}
                {/* ------------------------------------------------------------------- */}
                <div className="mt-28 border-t border-border pt-16 text-left">
                    <motion.h2
                        className="mb-10 text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl"
                        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={5}
                    >
                        Project Objective
                    </motion.h2>

                    <motion.p className="mt-2 mb-12 text-lg font-light leading-relaxed text-zinc-700 md:text-xl md:leading-8" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }} variants={itemVariants} initial="hidden" animate="visible" custom={6}>
                        Developed as our thesis project for the Bachelor of Science in Computer Science, this system demonstrates our commitment to bridging academic theory and real-world application. Our goal was to design and implement a robust solution tailored to a client's specific needs.
                    </motion.p>

                    {/* Unified Grid Layout for Context Boxes (Now focusing on narrative flow) */}
                    <div className="grid gap-10 md:grid-cols-2">
                        {/* 1. Academic Affiliation - Content in sentence form */}
                        <motion.div
                            className="rounded-2xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-lg flex flex-col gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.7 } }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
                                    <School className="h-6 w-6 text-primary" />
                                    Academic Affiliation
                                </h3>
                                <img src="/img/urs_logo.png" alt="URS Logo" className="w-10 h-10 rounded-full object-contain" />
                            </div>
                            <div className='space-y-2'>
                                <p className="text-base font-light leading-relaxed text-zinc-600">
                                    This system is a thesis project by students of the Bachelor of Science in Computer Science program at the <span className='font-semibold text-foreground'>University of Rizal System, Morong Campus</span>.
                                </p>
                                <p className="text-base font-light leading-relaxed text-zinc-600">
                                    It fulfills a core requirement of the BSCS curriculum, challenging us to apply our academic and technical skills to develop a solution for a real-world client.
                                </p>
                            </div>
                        </motion.div>

                        {/* 2. Project Context/Client - Content in sentence form, neutral icon color */}
                        <motion.div
                            className="rounded-2xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-lg flex flex-col gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.8 } }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
                                    <Briefcase className="h-6 w-6 text-primary" />
                                    Client
                                </h3>
                                <img src="/img/tcc_logo2.jpg" alt="Client Logo" className="w-10 h-10 rounded-full object-cover border border-border" />
                            </div>
                            <p className="text-base font-light leading-relaxed text-zinc-600">
                                Our client, <span className='font-semibold text-foreground'>Tomas Claudio Colleges</span>, required a modern solution for payroll management. Effipay was developed specifically for them, providing a web-based platform to automate complex calculations, reduce manual work, and ensure operational efficiency.
                            </p>
                        </motion.div>
                    </div>

                    {/* Image Section: Aspect Ratio Implementation --- */}
                    <div className="mt-16 flex flex-col items-center">
                        <motion.div
                            className="w-full overflow-hidden rounded-xl shadow-xl"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1, transition: { duration: 0.7, delay: 0.9 } }}
                        >
                            <AspectRatio ratio={16 / 9}>
                                <img className="h-full w-full object-cover" src="img/kessoku-band3.png" alt="Kessoku Band" />
                            </AspectRatio>
                        </motion.div>

                        <motion.p
                            className="mt-6 max-w-2xl text-center text-base italic text-zinc-500"
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
