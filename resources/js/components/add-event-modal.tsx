import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';
import { TimePicker } from './ui/time-picker';

interface AddEventModalProps {
  open: boolean;
  date?: string;
  dates?: string[];
  onClose: () => void;
  onConfirm: (payload: { date: string; type: string; label?: string; start_time?: string }) => void;
  initial?: { type?: string; label?: string; start_time?: string };
}

export default function AddEventModal({ open, date, dates, onClose, onConfirm, initial }: AddEventModalProps) {
  const [type, setType] = useState('whole-day');
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('09:00');

  useEffect(() => {
    if (open) {
      // Prefill with initial values when provided (editing)
      const initType = initial?.type ?? 'whole-day';
      setType(initType);
      setLabel(initial?.label ?? '');
      if (initial?.start_time) {
        // normalize to HH:MM
        setStartTime(initial.start_time.slice(0,5));
      } else if (initType === 'half-day') {
        setStartTime('09:00');
      }
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md w-full z-[12000]">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Date</label>
            <div className="mt-1 text-sm">{dates && dates.length > 1 ? `${dates.length} selected dates` : (date ?? '—')}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Type</label>
            <Select value={type} onValueChange={(v: string) => setType(v)}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whole-day">Whole-day suspension</SelectItem>
                <SelectItem value="half-day">Half-day suspension</SelectItem>
                <SelectItem value="rainy-day">Rainy day</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === 'other' ? (
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Label</label>
              <Input value={label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)} className="mt-1" />
            </div>
          ) : null}
          {type === 'half-day' ? (
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Start time</label>
              <div className="mt-1">
                <TimePicker value={startTime} onChange={setStartTime} placeholder="Select start time" />
              </div>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            const targetDates = dates && dates.length > 0 ? dates : (date ? [date] : []);
            if (targetDates.length === 0) return;
            const computedLabel = type === 'other' ? (label || 'Other') : (
              type === 'whole-day' ? 'Whole-day suspension' : type === 'half-day' ? 'Half-day suspension' : 'Rainy day'
            );
            for (const d of targetDates) {
              const payload = { date: d, type, label: computedLabel } as { date: string; type: string; label?: string; start_time?: string };
              if (type === 'half-day') payload.start_time = startTime;
              onConfirm(payload);
            }
            onClose();
          }}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
