import * as React from "react";
import { useState } from "react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";

import { Button } from "./ui/button";
import { toast } from "sonner";




interface TimeKeepingCalendarProps {
  value?: string;
  onChange?: (date: string | undefined) => void;
  markedDates?: string[];
  setMarkedDates?: (dates: string[]) => void;
  originalDates?: string[];
  setOriginalDates?: (dates: string[]) => void;
}


export function TimeKeepingCalendar({ onChange, markedDates = [], setMarkedDates, originalDates = [], setOriginalDates }: TimeKeepingCalendarProps) {
  // Use only props for marked/original dates (fully controlled)
  const actualMarkedDates = markedDates;
  const actualSetMarkedDates = setMarkedDates;
  const actualOriginalDates = originalDates;
  const actualSetOriginalDates = setOriginalDates;

  // Format date as YYYY-MM-DD in local (Philippines) time
  function toDateString(d: Date) {
    // Convert to Asia/Manila timezone
    const offsetDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return offsetDate.toISOString().slice(0, 10);
  }

  function handleDayClick(day: Date) {
    const dayStr = toDateString(day);
    // Always convert all dates to YYYY-MM-DD before storing
    const normalizedMarked = markedDates.map(d => toDateString(new Date(d)));
    const alreadyMarked = normalizedMarked.includes(dayStr);
    let newDates;
    if (alreadyMarked) {
      newDates = normalizedMarked.filter((d) => d !== dayStr);
    } else {
      newDates = [...normalizedMarked, dayStr];
    }
    console.log('DEBUG handleDayClick newDates:', newDates);
    setMarkedDates(newDates);
    if (onChange) onChange(dayStr);
  }

  function arraysEqual(a?: string[], b?: string[]) {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((v, i) => v === sortedB[i]);
  }

  async function handleSave() {
    // Allow saving even if all dates are unmarked, so removed dates are processed
    // Convert all dates to local (Philippines) YYYY-MM-DD before saving
      // Normalize both arrays to YYYY-MM-DD Manila time before comparison
      function normalizeToManila(dateStr: string) {
        const date = new Date(dateStr);
        // Manila is UTC+8
        const manila = new Date(date.getTime() + (8 * 60 - date.getTimezoneOffset()) * 60000);
        return manila.toISOString().slice(0, 10);
      }
      function uniqueSorted(arr: string[]) {
        return Array.from(new Set(arr)).sort();
      }
      const localDates = uniqueSorted(actualMarkedDates.map(normalizeToManila));
      const localOriginal = uniqueSorted((actualOriginalDates || []).map(normalizeToManila));
      // Debug log
      console.log('DEBUG localDates:', localDates);
      console.log('DEBUG localOriginal:', localOriginal);
    // Find added and removed dates
    const addedDates = localDates.filter((d: string) => !localOriginal.includes(d));
    const removedDates = localOriginal.filter((d: string) => !localDates.includes(d));
    if (addedDates.length === 0 && removedDates.length === 0) {
      toast.info("No changes to save.");
      return;
    }
    const res = await fetch("/observances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name=\"csrf-token\"]')?.getAttribute('content') || '',
      },
      body: JSON.stringify({ add: addedDates, remove: removedDates }),
    });
    if (res.ok) {
      const msg = [];
      if (addedDates.length > 0) msg.push(`Added: ${addedDates.join(", ")}`);
      if (removedDates.length > 0) msg.push(`Removed: ${removedDates.join(", ")}`);
      toast.success(msg.join(" | "));
      setOriginalDates([...localDates]);
      setMarkedDates([...localDates]);
      if (onSaveSync) onSaveSync([...localDates]);
    } else {
      toast.error("Failed to save dates.");
    }
  }

  return (
    <div className="flex flex-col items-center py-4 gap-4">
      {/* Default calendar styling, no custom marked day size */}
      <ShadcnCalendar
        mode="multiple"
        selected={actualMarkedDates.map((d: string) => new Date(d))}
        onDayClick={handleDayClick}
        className="rounded-md border shadow"
      />
      <Button onClick={handleSave} className="mt-2">Save</Button>
    </div>
  );
}

