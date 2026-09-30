import { format } from "date-fns";
import { BookingTape } from "./BookingTape";
import { stackBookingEntries } from "../../utils/tapeChartLayout";

export const CalendarRateRow = ({ row, days, onBookingClick }) => {
  const lanes = stackBookingEntries(row.entries);
  return (
    <div className="flex border-b border-slate-100 dark:border-slate-800">
      <div className="sticky left-0 z-10 flex w-[280px] shrink-0 items-center border-r border-slate-100 dark:border-slate-800 bg-card px-3 py-2">
        <span className="truncate pl-6 text-xs font-medium text-foreground" title={row.title}>{row.title}</span>
      </div>
      <div className="relative shrink-0">
        <div className="flex h-0 overflow-hidden" aria-hidden="true">
          {days.map((day) => <span key={format(day, "yyyy-MM-dd")} className="w-[76px] shrink-0" />)}
        </div>
        <div className="pointer-events-none absolute inset-0 flex" aria-hidden="true">
          {days.map((day) => (
            <span
              key={format(day, "yyyy-MM-dd")}
              className={`w-[76px] shrink-0 border-r border-slate-100/80 dark:border-slate-800/80 ${[0, 6].includes(day.getDay()) ? "bg-muted/70" : "bg-card"}`}
            />
          ))}
        </div>
        <div className="relative py-1">
          {lanes.length ? lanes.map((lane, laneIndex) => {
            let cursor = 0;
            return (
              <div key={laneIndex} className="flex h-9 items-center">
                {lane.map((entry) => {
                  const spacerCount = entry.startIndex - cursor;
                  cursor = entry.endIndex;
                  return (
                    <div key={entry.id} className="flex shrink-0">
                      {Array.from({ length: spacerCount }, (_, index) => (
                        <span key={index} className="w-[76px] shrink-0" aria-hidden="true" />
                      ))}
                      <BookingTape entry={entry} onClick={onBookingClick} />
                    </div>
                  );
                })}
              </div>
            );
          }) : <div className="h-12" />}
        </div>
      </div>
    </div>
  );
};
