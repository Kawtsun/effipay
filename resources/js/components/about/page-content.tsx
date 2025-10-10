import React from 'react';
import { motion } from 'framer-motion';
// Adjusted path based on your updated import: '@/components/about/page-content'
import { ProgrammerAvatar, programmers } from './programmer-avatar'; 

// Variants for a subtle fade-in and scale for individual items (more polished)
const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.6,
            delay: 0.1 + index * 0.08, // Subtle stagger for quick loading
            ease: [0.17, 0.55, 0.55, 1], // Custom easing for a smoother stop
        },
    }),
};

/**
 * Contains all the specific content and layout for the About page.
 */
export function PageContent() {
    return (
        <div className="p-4 sm:p-8">
            {/* The content container is now width-limited and center-aligned for better readability (UX) */}
            <div className='max-w-4xl mx-auto'> 
                {/* --- Hero Section --- */}
                <div className='pt-10 text-left'>
                    <motion.h1 
                        className='text-5xl sm:text-6xl font-extrabold mb-4 tracking-tight'
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
                    >
                        About This Project
                    </motion.h1>
                    <motion.p 
                        className='text-xl md:text-2xl mb-12 text-gray-500 dark:text-gray-400'
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } }}
                    >
                        A passion project built with the **spirit of teamwork and rock 'n' roll** by the Kessoku Band development team.
                    </motion.p>
                </div>

                {/* --- Team Section --- */}
                <div className="mt-12 mb-16">
                    <h2 className="text-3xl font-bold mb-10 text-center">
                        Meet the Developers
                    </h2>
                    
                    {/* Grid Layout improved for visual balance */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 justify-items-center">
                        {programmers.map((programmer, index) => (
                            // Use the improved itemVariants
                            <motion.div
                                key={programmer.id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                custom={index} // Pass the index for staggered delay
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
                {/* --- End Team Section --- */}

                {/* --- Project Origin Section --- */}
                <div className='mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-left'>
                    <motion.h2 
                        className="text-3xl font-bold mb-6"
                        initial="hidden"
                        animate="visible"
                        variants={itemVariants}
                        custom={5} // Delay this item after the programmers
                    >
                        Our Inspiration
                    </motion.h2>
                    <motion.img 
                        className='w-full max-h-96 object-cover rounded-lg shadow-xl mb-4' 
                        src="img/Kessoku Band.jpg" 
                        alt="Kessoku Band" 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1, transition: { duration: 0.6, delay: 0.6 } }}
                    />
                    <motion.p 
                        className='text-md mt-4 pb-10 text-gray-600 dark:text-gray-300'
                        initial="hidden"
                        animate="visible"
                        variants={itemVariants}
                        custom={6}
                    >
                        The entire project architecture and collaborative spirit were deeply inspired by the chemistry and dedication of the amazing **Kessoku Band**. Their pursuit of excellence motivates our code quality every day.
                    </motion.p>
                </div>
            </div>
        </div>
    );
}