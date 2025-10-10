import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 

interface ProgrammerAvatarProps {
    imageUrl: string;
    name: string;
    initials: string;
}

/**
 * A component to display a programmer's avatar and name.
 */
export function ProgrammerAvatar({ imageUrl, name, initials }: ProgrammerAvatarProps) {
    return (
        // Added a hover effect for better interaction feedback
        <div className="flex flex-col items-center space-y-2 p-4 transition-transform duration-300 hover:scale-[1.05] cursor-pointer">
            <Avatar className="h-24 w-24 border-4 border-primary/50 shadow-lg"> {/* Increased shadow for depth */}
                <AvatarImage src={imageUrl} alt={`Avatar of ${name}`} />
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                {name}
            </p>
        </div>
    );
}

// Data List is exported from here
export const programmers = [
    { id: 1, name: 'Kawtsun', imageUrl: 'img/programmers/kita.jpg', initials: 'KA' },
    { id: 2, name: 'Ra hee', imageUrl: 'img/programmers/ryo.jpg', initials: 'RA' },
    { id: 3, name: 'WinRar', imageUrl: 'img/programmers/bocchi.jpeg', initials: 'WI' },
    { id: 4, name: 'Nics', imageUrl: 'img/programmers/nijika.jpg', initials: 'NI' },
];