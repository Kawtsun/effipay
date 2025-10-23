import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
    interface Window {
        Inertia?: any;
    }
}
//can delete this file if not needed