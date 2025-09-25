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
      <DialogContent className="max-w-6xl w-full px-8 py-4 sm:px-12 sm:py-6 z-[100] max-h-[90vh] flex flex-col min-h-0">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold mb-2">Calendar View</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto flex-1">
          <div className="space-y-8 text-base">
            <div className="border-b pb-6 mb-2">
              <h3 className="text-2xl font-extrabold mb-1">Observance Calendar</h3>
            </div>
            <div
              className="flex items-center justify-center"
              style={{ minHeight: 400, maxHeight: 500, height: 450, width: 420, margin: '0 auto', position: 'relative' }}
            >
              <div
                style={{
                  width: 400,
                  height: 430,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  margin: 'auto',
                  padding: 0,
                }}
              >
                {loading ? (
                  <div className="text-center text-muted-foreground">Loading...</div>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Calendar header and navigation should be at the top, grid below with fixed height */}
                    <div style={{ flex: '0 0 auto' }}>
                      {/* Optionally, you can move calendar header/navigation here if you control TimeKeepingCalendar */}
                    </div>
                    <div style={{ flex: '1 1 0', minHeight: 320, maxHeight: 340, height: 330, width: '100%' }}>
                      <TimeKeepingCalendar
                        value={selectedDate}
                        onChange={setSelectedDate}
                        markedDates={markedDates}
                        setMarkedDates={setMarkedDates}
                        originalDates={originalDates}
                        setOriginalDates={setOriginalDates}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
