
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function CalendarCarousel({ observances = [] }: { observances: { date: string, label?: string }[] }) {
  // Helper to format date to Manila local time and readable string
  function formatManilaDate(dateStr: string) {
    if (!dateStr) return '';
    // Parse as local date (YYYY-MM-DD or ISO string)
    // If dateStr is only YYYY-MM-DD, treat as local date
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
  return (
    <Carousel
      opts={{ align: "start" }}
      className="w-full mt-6"
      style={{ width: '100%', maxWidth: '100%' }}
    >
      <CarouselContent className="w-full max-w-none flex">
        {observances.length === 0 ? (
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
          observances.map((obs) => (
            <CarouselItem key={obs.date + (obs.label || '')} className="basis-1/3 px-4">
              <div className="flex justify-center w-full">
                <Card className="w-full max-w-[340px]">
                  <CardContent className="flex flex-col items-center justify-center h-[160px] px-2 py-4 w-full">
                    <span className="text-sm font-bold mb-2 text-primary text-center tracking-wide break-words max-w-[280px] whitespace-pre-line" style={{ wordBreak: 'break-word' }}>
                      {formatManilaDate(obs.date)}
                    </span>
                    <span className="text-xs text-center text-muted-foreground font-medium break-words max-w-[260px] whitespace-pre-line" style={{ wordBreak: 'break-word' }}>
                      {obs.label || 'Holiday'}
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
  );
}
