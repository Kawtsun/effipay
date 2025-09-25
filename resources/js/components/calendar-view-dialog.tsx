import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { TimeKeepingCalendar } from './timekeeping-calendar';
import { Button } from './ui/button';




interface CalendarViewDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CalendarViewDialog({ open, onClose }: CalendarViewDialogProps) {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  // Store both date and is_automated for each observance
  const [markedDates, setMarkedDates] = useState<string[]>([]);
  const [originalDates, setOriginalDates] = useState<string[]>([]);
  const [automatedDates, setAutomatedDates] = useState<string[]>([]); // Dates that are automated
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Save handler for markedDates
  const handleSave = async () => {
    function normalizeToManila(dateStr: string) {
      const date = new Date(dateStr);
      const manila = new Date(date.getTime() + (8 * 60 - date.getTimezoneOffset()) * 60000);
      return manila.toISOString().slice(0, 10);
    }
    function uniqueSorted(arr: string[]) {
      return Array.from(new Set(arr)).sort();
    }
    const localDates = uniqueSorted(markedDates.map(normalizeToManila));
    const localOriginal = uniqueSorted((originalDates || []).map(normalizeToManila));
    const addedDates = localDates.filter((d: string) => !localOriginal.includes(d));
    const removedDates = localOriginal.filter((d: string) => !localDates.includes(d));
    if (addedDates.length === 0 && removedDates.length === 0) {
      toast.info("No changes to save.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/observances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name=csrf-token]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ add: addedDates, remove: removedDates }),
      });
        if (res.ok) {
          let msg = '';
          if (addedDates.length > 0 && removedDates.length > 0) {
            msg = `Saved: ${addedDates.length} date${addedDates.length > 1 ? 's' : ''} added, ${removedDates.length} date${removedDates.length > 1 ? 's' : ''} removed.`;
          } else if (addedDates.length > 0) {
            msg = `Saved: ${addedDates.length} holiday/suspension date${addedDates.length > 1 ? 's' : ''} added.`;
          } else if (removedDates.length > 0) {
            msg = `Saved: ${removedDates.length} holiday/suspension date${removedDates.length > 1 ? 's' : ''} removed.`;
          }
          if (msg) toast.success(msg);
          setOriginalDates([...localDates]);
          setMarkedDates([...localDates]);
        } else {
          toast.error("Failed to save dates.");
        }
    } catch (e) {
      toast.error("Failed to save dates.");
    } finally {
      setSaving(false);
    }
  };

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
            // Track which dates are automated
            const autoDates = data.filter((obs: { is_automated?: boolean }) => obs.is_automated).map((obs: { date: string }) => obs.date);
            setAutomatedDates(autoDates);
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
            <div className="mb-2">
              <p className="text-sm text-muted-foreground font-normal leading-relaxed">
                Select or unselect dates to mark <span className="font-semibold">official holidays</span> or <span className="font-semibold">class/work suspensions</span>. <span className="font-medium">Click <span className="underline">Save</span> to apply your changes.</span>
              </p>
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
                        automatedDates={automatedDates}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
