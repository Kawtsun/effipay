
import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { OBSERVANCE_COLOR_MAP, OBSERVANCE_PRETTY } from './observance-colors';

type ObservanceItem = { date: string, label?: string, is_automated?: boolean, type?: string, start_time?: string };

export function CalendarCarousel({ observances = [], onEdit }: { observances: ObservanceItem[]; onEdit?: (obs: ObservanceItem) => void }) {
  function formatManilaDate(dateStr: string) {
    if (!dateStr) return '';
    let d;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      d = new Date(dateStr + 'T00:00:00+08:00');
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }

  const sortedObservances = [...observances].sort((a, b) => {
    const aDate = a.date.slice(0, 10);
    const bDate = b.date.slice(0, 10);
    return aDate.localeCompare(bDate);
  });

  // Find the index of the closest upcoming or current holiday (manual or auto)
  // Find the index of the date closest to today (past or future)
  const getFocusIndex = React.useCallback(() => {
    const now = new Date();
    let closestIdx = 0;
    let minAbsDiff = Infinity;
    for (let i = 0; i < sortedObservances.length; i++) {
      const obsDate = new Date(sortedObservances[i].date);
      const absDiff = Math.abs(obsDate.getTime() - now.getTime());
      if (absDiff < minAbsDiff) {
        minAbsDiff = absDiff;
        closestIdx = i;
      }
    }
    return closestIdx;
  }, [sortedObservances]);
  const [focusIndex, setFocusIndex] = useState(getFocusIndex());
  // Update focusIndex in real time if observances or date changes
  // Update focusIndex in real time if observances or date changes
  useEffect(() => {
    setFocusIndex(getFocusIndex());
  }, [getFocusIndex]);
  useEffect(() => {
    const interval = setInterval(() => {
      setFocusIndex(getFocusIndex());
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [getFocusIndex]);

  // Use setApi to get Embla API instance and scroll to focusIndex
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emblaApi, setEmblaApi] = useState<any>(null);
  useEffect(() => {
    if (emblaApi && sortedObservances.length > 0) {
      emblaApi.reInit();
      // Add a short delay for animation effect
      setTimeout(() => {
        emblaApi.scrollTo(focusIndex, false); // false = animate scroll
      }, 350); // 350ms matches dialog animation
    }
  }, [emblaApi, focusIndex, sortedObservances.length]);

  return (
    <AnimatePresence initial={false}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full flex justify-center mt-6"
      >
        <Carousel
          opts={{ align: "center" }}
          className=""
          containerWidth="850px"
          setApi={setEmblaApi}
        >
          <CarouselContent className="flex gap-1 overflow-visible" viewportWidth="850px">
              {sortedObservances.length === 0 ? (
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-3 flex justify-center overflow-visible">
                  <Card style={{ width: 360, minWidth: 360, maxWidth: 360 }}>
                    <CardContent className="flex flex-col items-center justify-center h-[220px]">
                      <span className="text-lg text-muted-foreground">No holidays</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ) : (
              sortedObservances.map((obs) => {
                const type = obs.type || 'DEFAULT';
                const colors = OBSERVANCE_COLOR_MAP[type] || OBSERVANCE_COLOR_MAP.DEFAULT;
                return (
                  <CarouselItem key={obs.date + (obs.label || '')} className="basis-1/3">
                    <div className="p-3 flex justify-center w-full overflow-visible">
                      <Card
                        role={onEdit ? 'button' : undefined}
                        tabIndex={onEdit ? 0 : -1}
                        title={onEdit ? 'Edit observance' : undefined}
                        onClick={(e) => { if (onEdit) { e.stopPropagation(); onEdit(obs); } }}
                        onKeyDown={(e) => { if (onEdit && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onEdit(obs); } }}
                        className={`relative w-[320px] rounded-2xl overflow-hidden ${colors.bg} ${colors.border || ''} ${colors.ring || ''} shadow-[0_0_0_1px_rgba(0,0,0,0.05)] ${onEdit ? 'cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all' : ''} hover:z-50 focus:outline-none`}
                      >
                        <div className={`absolute inset-0 pointer-events-none ${colors.grad || ''}`} />
                        <CardContent className={`relative flex flex-col items-center justify-center h-[160px] px-2 py-4 w-full ${colors.text}`}>
                          <span className="text-base font-bold mb-2 text-center tracking-wide break-words max-w-[280px] whitespace-pre-line" style={{ wordBreak: 'break-word' }}>
                            {formatManilaDate(obs.date)}
                          </span>
                          <span className="text-sm text-center text-muted-foreground font-medium break-words max-w-[260px] whitespace-pre-line" style={{ wordBreak: 'break-word' }}>
                            {obs.label || (obs.type ? (OBSERVANCE_PRETTY[obs.type] || obs.type.replace('-', ' ')) : 'Suspension/Holiday')}
                          </span>
                          {obs.start_time ? (
                            <span className="text-xs text-center text-muted-foreground mt-1">Starts at: {new Date(`1970-01-01T${obs.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                          ) : null}
                          {/* Badge removed to avoid redundancy */}
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                );
              })
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </motion.div>
    </AnimatePresence>
  );
}
