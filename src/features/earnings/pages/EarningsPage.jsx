import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlatformBadge } from "@/components/PlatformBadge";
import { MetricCard } from "@/features/dashboard/components/MetricCard";
import { EARNINGS_PER_RESORT, EARNINGS_PER_BOOKING } from "../data/constants";

export const EarningsPage = () => (
  <>
    <div className="grid grid-cols-3 gap-3 mb-4">
      <MetricCard label="Total Commission"    value="₱18,400" trend="March 2026"          sparkKey="earnings" />
      <MetricCard label="Bookings This Month" value="24"      trend="Across 6 resorts"     sparkKey="bookings" />
      <MetricCard label="Avg. Per Booking"    value="₱767"    trend="~10% commission rate" sparkKey="earnings" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Card className="border border-black/5 shadow-sm">
        <CardHeader className="py-3 px-4 border-b border-black/5">
          <CardTitle className="text-sm font-semibold">Commission Per Booking</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {["Guest","Resort","Platform","Commission"].map(h => (
                  <TableHead key={h} className="text-xs">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {EARNINGS_PER_BOOKING.map((e,i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{e.guest}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.resort}</TableCell>
                  <TableCell><PlatformBadge platform={e.platform} /></TableCell>
                  <TableCell className="text-xs font-semibold text-green-700">₱{e.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border border-black/5 shadow-sm">
        <CardHeader className="py-3 px-4 border-b border-black/5">
          <CardTitle className="text-sm font-semibold">Commission Per Resort</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-2">
          {EARNINGS_PER_RESORT.map(e => (
            <div key={e.resort} className="flex justify-between py-2.5 border-b border-black/5 last:border-0 text-sm">
              <span className="text-muted-foreground">{e.resort}</span>
              <span className="font-semibold">₱{e.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-1 border-t-2 border-green-200">
            <strong className="text-sm">Total</strong>
            <strong className="text-base text-green-600">₱18,400</strong>
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);
