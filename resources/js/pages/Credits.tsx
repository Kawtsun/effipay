// resources/js/Pages/Credits.tsx

import { Item } from '@/components/ui/item';
import AppLayout from '@/layouts/app-layout';
import React from 'react';
// Import your layout component here if you use one

export default function Credits() {
    return (
        // Your page content goes here
        <AppLayout>
                <Item>
                    <h1>Made by the Kessoku Band</h1>
                    <img src="/img/kessoku band.jpg" alt="Kessoku Band" className="h-150 w-150 object-contain bg-white rounded-full p-1" />
                </Item>
        </AppLayout>
    );
}