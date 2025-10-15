import { usePage } from '@inertiajs/react';
import { CalendarCarousel } from "./calendar-carousel";
import DialogScrollArea from "./dialog-scroll-area";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { TimeKeepingCalendar } from './timekeeping-calendar';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AddEventModal from './add-event-modal';




interface CalendarViewDialogProps {
  open: boolean;
  onClose: () => void;
  // optional callback when the Add Event button is clicked
  onAddEvent?: (date: string) => void;
}

export function CalendarViewDialog({ open, onClose, onAddEvent }: CalendarViewDialogProps) {
  const { csrfToken } = usePage().props as { csrfToken: string };
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  // Store both date and is_automated for each observance
  const [markedDates, setMarkedDates] = useState<string[]>([]);
  const [originalDates, setOriginalDates] = useState<string[]>([]);
  const [automatedDates, setAutomatedDates] = useState<string[]>([]); // Dates that are automated
  const [observances, setObservances] = useState<{ date: string, label?: string, type?: string, start_time?: string }[]>([]);
  const [serverObservances, setServerObservances] = useState<{ date: string, label?: string, type?: string, start_time?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userSelectedDate, setUserSelectedDate] = useState<string | undefined>(undefined);

  // Refetch observances when markedDates changes and dialog is open
  useEffect(() => {
    if (!open) return;
    async function refetchObservances() {
      try {
        const res = await fetch("/observances");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const normalized = data.map((obs: { date: string, label?: string, type?: string, start_time?: string }) => ({
              date: (obs.date || '').slice(0,10),
              label: obs.label,
              type: obs.type,
              start_time: obs.start_time,
            }));
            const map = new Map(normalized.map(o => [o.date, o]));
            const uniq = Array.from(map.values());
            setObservances(uniq);
            setServerObservances(uniq);
          }
        }
      } catch {}
    }
    refetchObservances();
  }, [markedDates, open]);

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
  const localDates = Array.from(new Set(markedDates.map(d => (d || '').slice(0,10)))).sort();
  const localOriginal = Array.from(new Set((originalDates || []).map(d => (d || '').slice(0,10)))).sort();
  const addedDates = localDates.filter((d: string) => !localOriginal.includes(d));
    const removedDates = localOriginal.filter((d: string) => !localDates.includes(d));
    // find updates on unchanged dates
    const serverMap = new Map(serverObservances.map(o => [o.date.slice(0,10), o]));
    const currentMap = new Map(observances.map(o => [o.date.slice(0,10), o]));
    const intersection = localDates.filter(d => localOriginal.includes(d));
    const updates: { date: string; label?: string; type?: string; start_time?: string }[] = [];
    for (const d of intersection) {
      const prev = serverMap.get(d);
      const curr = currentMap.get(d);
      if (!curr) continue;
      if (!prev || prev.label !== curr.label || prev.type !== curr.type || (prev.start_time || '') !== (curr.start_time || '')) {
        updates.push({ date: d, label: curr.label, type: curr.type, start_time: curr.start_time });
      }
    }
    if (addedDates.length === 0 && removedDates.length === 0 && updates.length === 0) {
      toast.info("No changes to save.");
      return;
    }
    setSaving(true);
    try {
      // Build add objects with per-date metadata (if available in local observances)
      const addObjects = addedDates.map((d: string) => {
        const obs = observances.find(o => o.date && o.date.slice(0,10) === d.slice(0,10));
        if (obs) {
          return { date: d, label: obs.label, type: obs.type, start_time: obs.start_time };
        }
        return d;
      });

      const res = await fetch("/observances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name=csrf-token]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ add: [...addObjects, ...updates], remove: removedDates }),
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
            // Update local originals/marked and observances with server-returned created items
            const json = await res.json();
            const created = Array.isArray(json.added) ? json.added : [];
            // Normalize created observances to our local shape
            const createdLocal = created.map((c: any) => ({ date: c.date, label: c.label, type: c.type, start_time: c.start_time }));
            setObservances(prev => {
              const map = new Map(prev.map(p => [p.date.slice(0,10), { ...p, date: p.date.slice(0,10) }]));
              for (const c of createdLocal) map.set((c.date || '').slice(0,10), { ...c, date: (c.date || '').slice(0,10) });
              for (const u of updates) map.set((u.date || '').slice(0,10), { ...(map.get((u.date || '').slice(0,10)) || { date: (u.date || '').slice(0,10) }), ...u });
              return Array.from(map.values());
            });
            setServerObservances(prev => {
              const map = new Map(prev.map(p => [p.date.slice(0,10), { ...p, date: p.date.slice(0,10) }]));
              for (const c of createdLocal) map.set((c.date || '').slice(0,10), { ...c, date: (c.date || '').slice(0,10) });
              for (const u of updates) map.set((u.date || '').slice(0,10), { ...(map.get((u.date || '').slice(0,10)) || { date: (u.date || '').slice(0,10) }), ...u });
              return Array.from(map.values());
            });
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

  // When dialog opens, first fetch holidays, then fetch observances

  useEffect(() => {
    let isMounted = true;
    async function fetchHolidaysAndDates() {
      if (!open) return;
      setLoading(true);
      const minDelay = 500;
      const delayPromise = new Promise(res => setTimeout(res, minDelay));
      // First, trigger the backend to fetch holidays
      await fetch('/fetch-holidays', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'Content-Type': 'application/json',
        },
      });
      // Then, fetch the observances
      try {
        const res = await fetch("/observances");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) {
            const loaded = data.map((obs: { date: string }) => obs.date);
            setMarkedDates([...loaded]);
            setOriginalDates([...loaded]);
            // Track which dates are automated
            const autoDates = data.filter((obs: { is_automated?: boolean }) => obs.is_automated).map((obs: { date: string }) => obs.date);
            setAutomatedDates(autoDates);
            // Store all observance objects for carousel (including type/start_time)
            setObservances(data.map((obs: { date: string, label?: string, type?: string, start_time?: string }) => ({ date: obs.date, label: obs.label, type: obs.type, start_time: obs.start_time })));
          }
        }
      } finally {
        await delayPromise;
        if (isMounted) setLoading(false);
      }
    }
    fetchHolidaysAndDates();
    return () => { isMounted = false; };
  }, [open]);

  // Toggle selection: clicking the currently-selected date will clear selection
  const handleCalendarChange = (date?: string) => {
    if (!date) {
      setSelectedDate(undefined);
      return;
    }
    if (selectedDate === date) {
      setSelectedDate(undefined);
    } else {
      setSelectedDate(date);
    }
  };

  // If the selected date is no longer in markedDates (user removed it), clear the selection
  useEffect(() => {
    if (selectedDate && !markedDates.includes(selectedDate)) {
      setSelectedDate(undefined);
    }
  }, [markedDates, selectedDate]);

  // handle AddEvent confirm: add observance locally (will be persisted when Save is clicked)
  const handleAddEventConfirm = (payload: { date: string; type: string; label?: string; start_time?: string }) => {
    const { date, label, type, start_time } = payload;
    const key = (date || '').slice(0,10);
    // ensure it's marked
    if (!markedDates.map(d => d.slice(0,10)).includes(key)) {
      setMarkedDates(prev => Array.from(new Set([...prev.map(d => d.slice(0,10)), key])));
    }
    // upsert
    setObservances(prev => {
      const map = new Map(prev.map(p => [p.date.slice(0,10), { ...p, date: p.date.slice(0,10) }]));
      map.set(key, { date: key, label, type, start_time });
      return Array.from(map.values());
    });
    // Do not modify originalDates here; Save will persist changes to server and update originalDates
    setShowAddModal(false);
  };


  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-6xl w-full px-8 py-4 sm:px-12 sm:py-6 z-[100] h-[90vh] max-h-[90vh] flex flex-col min-h-0 select-none">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold mb-2">Calendar View</DialogTitle>
        </DialogHeader>
        <DialogScrollArea>
          <div className="space-y-8 text-base">
            <div className="border-b pb-6 mb-2">
              <h3 className="text-2xl font-extrabold mb-1">Observance Calendar</h3>
            </div>
            <div className="mb-20">
              <p className="text-sm text-muted-foreground font-normal leading-relaxed">
                Select or unselect dates to mark <span className="font-semibold">official holidays</span> or <span className="font-semibold">class/work suspensions</span>. <span className="font-medium">Click <span className="underline">Save</span> to apply your changes.</span>
              </p>
            </div>
            <div
              style={{
                width: 400,
                height: 430,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                margin: '0 auto',
                padding: 0,
              }}
            >
              {loading || automatedDates.length === 0 ? (
                // Centered loading spinner matching the employee table
                <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 320 }}>
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Total marked dates in the current year (show only after loading) */}
                  <motion.div
                    className="mb-2 mt-6 w-full flex justify-center"
                    key="marked-dates-label"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <span className="text-sm font-medium text-primary text-center">
                      {(() => {
                        const year = new Date().getFullYear();
                        const count = markedDates.filter(date => {
                          const d = new Date(date);
                          return d.getFullYear() === year;
                        }).length;
                        return (
                          <>
                            {`Total marked dates in ${year}: `}
                            <b className="font-bold">{count}</b>
                          </>
                        );
                      })()}
                    </span>
                  </motion.div>
                  <motion.div
                    key="calendar-content"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    {/* Calendar header and navigation should be at the top, grid below with fixed height */}
                    <div style={{ flex: '0 0 auto' }}>
                      {/* Optionally, you can move calendar header/navigation here if you control TimeKeepingCalendar */}
                    </div>
                    <div style={{ flex: '1 1 0', minHeight: 320, maxHeight: 340, height: 330, width: '100%' }}>
                      <TimeKeepingCalendar
                        value={selectedDate}
                        onChange={handleCalendarChange}
                        markedDates={markedDates}
                        setMarkedDates={setMarkedDates}
                        automatedDates={automatedDates}
                      />
                    </div>
                  </motion.div>
                  {/* Add Event button: visible when a date is selected */}
                  {selectedDate && markedDates.includes(selectedDate) && !automatedDates.includes(selectedDate) && !originalDates.includes(selectedDate) ? (
                    <motion.div
                      key="add-event-button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 8 }}
                    >
                      <Button onClick={() => {
                        // open the add event modal for the selected date
                        setUserSelectedDate(selectedDate);
                        setShowAddModal(true);
                        // debug toast to confirm click registered
                        toast.success(`Opening Add Event for ${selectedDate}`);
                      }}>
                        Add Event
                      </Button>
                    </motion.div>
                  ) : null}
                  {/* Carousel below the calendar, with animation and spacing */}
                  <motion.div
                    key="calendar-carousel"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
                  >
                    <CalendarCarousel
                      observances={observances}
                      onEdit={(obs) => {
                        const dateOnly = obs.date?.slice(0, 10) || obs.date;
                        setUserSelectedDate(dateOnly);
                        setShowAddModal(true);
                        // Prefill initial values for editing
                        setTimeout(() => {
                          // no-op: AddEventModal reads `initial` from props below
                        }, 0);
                      }}
                    />
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </DialogScrollArea>
  <AddEventModal
    open={showAddModal}
    date={userSelectedDate}
    onClose={() => setShowAddModal(false)}
    onConfirm={handleAddEventConfirm}
    initial={(() => {
      const d = userSelectedDate;
      if (!d) return undefined;
      const found = observances.find(o => o.date?.slice(0,10) === d);
      if (!found) return undefined;
      return { type: found.type, label: found.label, start_time: found.start_time };
    })()}
  />
        <DialogFooter className="flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
