import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import React, { useState } from 'react';
import TimeKeepingCalendar from './timekeeping-calendar';
import { Button } from './ui/button';

interface CalendarViewDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CalendarViewDialog({ open, onClose }: CalendarViewDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl w-[600px] min-h-[500px] max-h-[700px]">
        <DialogHeader>
          <DialogTitle>Calendar View</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <TimeKeepingCalendar value={selectedDate} onChange={setSelectedDate} />
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
