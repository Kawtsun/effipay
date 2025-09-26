
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

export function CalendarCarousel({ observances = [] }: { observances: { date: string, label?: string, is_automated?: boolean }[] }) {
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
  function getFocusIndex() {
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
  }
  const [focusIndex, setFocusIndex] = useState(getFocusIndex());
  // Update focusIndex in real time if observances or date changes
  // Update focusIndex in real time if observances or date changes
  useEffect(() => {
    setFocusIndex(getFocusIndex());
  }, [sortedObservances]);
  useEffect(() => {
    const interval = setInterval(() => {
      setFocusIndex(getFocusIndex());
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [sortedObservances]);

  // Use setApi to get Embla API instance and scroll to focusIndex
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
          <CarouselContent className="flex" viewportWidth="850px">
            {sortedObservances.length === 0 ? (
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 flex justify-center">
                  <Card style={{ width: 360, minWidth: 360, maxWidth: 360 }}>
                    <CardContent className="flex flex-col items-center justify-center h-[220px]">
                      <span className="text-lg text-muted-foreground">No holidays</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ) : (
              sortedObservances.map((obs) => (
                <CarouselItem key={obs.date + (obs.label || '')} className="basis-1/3">
                  <div className="flex justify-center w-full">
                    <Card className="w-[320px]">
                      <CardContent className="flex flex-col items-center justify-center h-[160px] px-2 py-4 w-full">
                        <span className="text-base font-bold mb-2 text-primary text-center tracking-wide break-words max-w-[280px] whitespace-pre-line" style={{ wordBreak: 'break-word' }}>
                          {formatManilaDate(obs.date)}
                        </span>
                        <span className="text-sm text-center text-muted-foreground font-medium break-words max-w-[260px] whitespace-pre-line" style={{ wordBreak: 'break-word' }}>
                          {obs.label || 'Suspension/Holiday'}
                        </span>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </motion.div>
    </AnimatePresence>
  );
}
