// resources/js/Pages/Credits.tsx

import { Card } from '@/components/ui/card';
import { Item } from '@/components/ui/item';
import AppLayout from '@/layouts/app-layout';
import React from 'react';
// Import your layout component here if you use one

export default function Credits() {
    return (
        // Your page content goes here
        <AppLayout>
            <Card className='shadow-none border-none text-center'>
                <div className='pt-10'>
                    <h1 className='text-5xl'><b>Credits</b></h1><br />
                    <p className='text-3xl'>Made by the Kessoku Band</p><br />
                    <img className='' src="img/Kessoku Band.jpg" alt="Kessoku Band" />
                </div>
            </Card>
        </AppLayout>
    );
}