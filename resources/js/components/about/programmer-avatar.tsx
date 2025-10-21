import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 

interface ProgrammerAvatarProps {
    imageUrl: string;
    name: string;
    initials: string;
}

export function ProgrammerAvatar({ imageUrl, name, initials }: ProgrammerAvatarProps) {
    return (
        // Cleaned up hover effect: subtle lift only (no border)
        <div className="flex flex-col items-center space-y-3 transition-transform duration-300 hover:scale-[1.03] cursor-pointer">
            {/* Removed border-4 border-primary and simplified shadow */}
            <Avatar className="h-28 w-28 shadow-lg"> 
                <AvatarImage src={imageUrl} alt={`Avatar of ${name}`} />
                <AvatarFallback className="bg-muted text-foreground/50 font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center">
                {/* Removed 'Developer' text */}
                <p className="text-lg font-semibold text-foreground">{name}</p>
            </div>
        </div>
    );
}

// Data List (Reverted initials for a cleaner look)
export const programmers = [
    { id: 1, name: 'Kawtsun', imageUrl: 'img/programmers/kita.jpg', initials: 'KA' },
    { id: 2, name: 'Ra Hee', imageUrl: 'img/programmers/ryo.jpg', initials: 'RH' },
    { id: 3, name: 'WinRar', imageUrl: 'img/programmers/bocchi.jpeg', initials: 'WR' },
    { id: 4, name: 'Nix', imageUrl: 'img/programmers/nijika.jpg', initials: 'NI' },
];