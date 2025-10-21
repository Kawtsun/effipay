import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { useStickySearch } from '@/contexts/sticky-search';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const sticky = useStickySearch();
    const [focused, setFocused] = React.useState(false);
    const showSticky = sticky.active && !sticky.sourceVisible;
    const [local, setLocal] = React.useState(sticky.term);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const userTyping = React.useRef(false);

    // Keep in sync with source search, but avoid clobbering while user is typing/focused
    React.useEffect(() => {
        if (focused || userTyping.current) return;
        setLocal(sticky.term);
    }, [sticky.term, focused]);

    // Use shared debounced trigger so pending searches survive header mount/unmount
    const debouncedTrigger = sticky.triggerSearchDebounced;

    const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        const value = local.trim();
        sticky.updateTerm(value);
        sticky.triggerSearch(value);
        inputRef.current?.blur();
    };

    // When sticky hides (main search visible), blur input and reset typing guard
    React.useEffect(() => {
        if (!showSticky) {
            if (document.activeElement === inputRef.current) {
                inputRef.current?.blur();
            }
            setFocused(false);
            userTyping.current = false;
        }
    }, [showSticky]);

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            {/* Sticky compact search when source is scrolled out of view */}
            <div className="ml-auto mr-2 md:mr-4 max-w-[20rem] w-full hidden md:block">
                <AnimatePresence initial={false}>
                    {showSticky && (
                        <motion.div
                            key="sticky-search"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            <form onSubmit={onSubmit} className="relative">
                                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                    <Search size={16} />
                                </div>
                                <Input
                                    ref={inputRef}
                                    value={local}
                                    onChange={(e) => {
                                        userTyping.current = true;
                                        const v = e.target.value;
                                        setLocal(v);
                                        sticky.updateTerm(v);
                                        debouncedTrigger(v.trim());
                                    }}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => {
                                        setFocused(false);
                                        // typing done, allow external sync again
                                        userTyping.current = false;
                                    }}
                                    placeholder={sticky.placeholder}
                                    className="pl-8 pr-10 w-full"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLocal('');
                                            sticky.updateTerm('');
                                            sticky.triggerSearch('');
                                        }}
                                        tabIndex={-1}
                                        className={`
                                          transition-all duration-200 ease-in-out
                                          ${local ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
                                          text-gray-500 dark:text-gray-400
                                        `}
                                        aria-label="Clear"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
}
