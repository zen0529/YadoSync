import { AlertTriangle } from "lucide-react";

export const BookingTape = ({ entry, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(entry)}
    className={`relative flex h-8 shrink-0 items-center overflow-hidden rounded-md p-0 text-left text-xs font-semibold shadow-sm ring-2 ring-inset ring-background hover:brightness-110 focus-visible:outline-2 focus-visible:outline-ring ${
      entry.status === "modified"
        ? "bg-destructive text-white"
        : "bg-primary text-primary-foreground"
    }`}
    title={`${entry.guest} · ${entry.checkIn} to ${entry.checkOut} · ${entry.platform}${entry.status === "modified" ? " · Review modification" : ""}`}
    aria-label={`${entry.guest}, ${entry.platform}, ${entry.checkIn} to ${entry.checkOut}${entry.status === "modified" ? ", modification needs review" : ""}`}
  >
    {Array.from({ length: entry.endIndex - entry.startIndex }, (_, index) => (
      <span key={index} className="w-[76px] shrink-0" aria-hidden="true" />
    ))}
    <span className="absolute inset-x-2 flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
      {entry.status === "modified" && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{entry.guest}</span>
      <span className="ml-auto shrink-0 font-normal">{entry.nights}n</span>
    </span>
  </button>
);
