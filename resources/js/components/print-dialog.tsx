import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface PrintDialogProps {
    open: boolean;
    onClose: () => void;
    employee: any;
}

export default function PrintDialog({ open, onClose, employee }: PrintDialogProps) {
    const [selected, setSelected] = useState({ payslip: true, btr: false });

    const handleChange = (key: 'payslip' | 'btr') => {
        setSelected(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                        <DialogContent style={{ maxWidth: 340, padding: '1.5rem' }}>
                            <DialogHeader>
                                <DialogTitle>Print Employee Report</DialogTitle>
                            </DialogHeader>
                            <div className="mb-4 text-sm text-muted-foreground">
                                What would you like to print for <span className="font-semibold">{employee?.last_name}, {employee?.first_name}</span>?
                            </div>
                            <div className="flex flex-col gap-2 mb-4">
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selected.payslip}
                                        onCheckedChange={() => handleChange('payslip')}
                                        className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                                    />
                                    Payslip
                                </label>
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selected.btr}
                                        onCheckedChange={() => handleChange('btr')}
                                        className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                                    />
                                    Biometric Time Record (BTR)
                                </label>
                            </div>
                            <DialogFooter>
                                <Button onClick={onClose} variant="secondary">Cancel</Button>
                                <Button disabled={!selected.payslip && !selected.btr}>Print Selected</Button>
                            </DialogFooter>
                        </DialogContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Dialog>
    );
}
