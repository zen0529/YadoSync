import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlatformBadge } from "@/components/PlatformBadge";
import { SyncBadge } from "@/components/SyncBadge";
import { BOOKINGS, RESORTS } from "@/data/constants";
import { BOOKED_DATES, PARTIAL_DATES } from "../data/constants";

export const BookingsPage = () => {
  const [platform, setPlatform] = useState("all");
  const [resort, setResort]     = useState("all");

  const filtered = BOOKINGS.filter(b =>
    (platform === "all" || b.platform === platform) &&
    (resort   === "all" || b.resort   === resort)
  );

  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800 flex justify-between items-center mb-4">
        <span>2 bookings have pending sync — dates may not be blocked on all platforms yet.</span>
        <span className="text-green-600 font-semibold cursor-pointer hover:underline">Resolve now →</span>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        <Card className="border border-black/5 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-black/5">
            <CardTitle className="text-sm font-semibold">All Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  {["Guest","Resort","Dates","Platform","Sync"].map(h => (
                    <TableHead key={h} className="text-xs">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="text-xs font-medium">{b.guest}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.resort}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.dates}</TableCell>
                    <TableCell><PlatformBadge platform={b.platform} /></TableCell>
                    <TableCell><SyncBadge sync={b.sync} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border border-black/5 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-black/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Availability Calendar</CardTitle>
            <Select>
              <SelectTrigger className="h-7 text-xs w-36">
                <SelectValue placeholder="Coral Bay Resort" />
              </SelectTrigger>
              <SelectContent>
                {RESORTS.map(r => <SelectItem key={r.name} value={r.name} className="text-xs">{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold">April 2026</span>
              <div className="flex gap-3 text-[10px]">
                <span className="text-green-600 font-semibold">■ Booked</span>
                <span className="text-amber-500 font-semibold">■ Partial</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} className="text-center text-[9px] text-muted-foreground font-semibold uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {[...Array(3).fill(null), ...Array(30).fill(0).map((_,i)=>i+1), null].map((day,i) => {
                const booked  = BOOKED_DATES.includes(day);
                const partial = PARTIAL_DATES.includes(day);
                return (
                  <div key={i} className={`aspect-square flex items-center justify-center rounded text-[11px] cursor-pointer
                    ${booked  ? "bg-green-500 text-white font-semibold" :
                      partial ? "bg-amber-100 text-amber-600 font-semibold" :
                      day     ? "text-foreground hover:bg-green-50" : "text-muted-foreground/30"}`}>
                    {day || ""}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
