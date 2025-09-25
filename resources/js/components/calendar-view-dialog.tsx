import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import React, { useState, useEffect } from 'react';
import { TimeKeepingCalendar } from './timekeeping-calendar';
import { Button } from './ui/button';




interface CalendarViewDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CalendarViewDialog({ open, onClose }: CalendarViewDialogProps) {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [markedDates, setMarkedDates] = useState<string[]>([]);
  const [originalDates, setOriginalDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch saved dates when dialog opens
  useEffect(() => {
    async function fetchMarkedDates() {
      if (!open) return;
      setLoading(true);
      try {
        const res = await fetch("/observances");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const loaded = data.map((obs: { date: string }) => obs.date);
            setMarkedDates([...loaded]);
            setOriginalDates([...loaded]);
          }
        }
      } catch (e) {
        // ignore fetch errors
      } finally {
        setLoading(false);
      }
    }
    fetchMarkedDates();
  }, [open]);


  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl w-[600px] min-h-[500px] max-h-[700px]">
        <DialogHeader>
          <DialogTitle>Calendar View</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-full">
          <div className="flex-1 flex items-center justify-center">
            {loading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : (
              <TimeKeepingCalendar
                value={selectedDate}
                onChange={setSelectedDate}
                markedDates={markedDates}
                setMarkedDates={setMarkedDates}
                originalDates={originalDates}
                setOriginalDates={setOriginalDates}
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
