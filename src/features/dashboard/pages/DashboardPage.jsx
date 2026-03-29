import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlatformBadge } from "@/components/PlatformBadge";
import { SyncBadge } from "@/components/SyncBadge";
import { MetricCard } from "../components/MetricCard";
import { BOOKINGS } from "@/data/constants";
import { ACTIVITY_BARS } from "../data/constants";

export const DashboardPage = () => (
  <>
    <div className="grid grid-cols-4 gap-3 mb-4">
      <MetricCard label="Total Bookings"     value="24"      trend="↑ +3 this week"        sparkKey="bookings" />
      <MetricCard label="Active Resorts"     value="6"       trend="3 platforms connected"  sparkKey="resorts"  />
      <MetricCard label="Commission (March)" value="₱18,400" trend="↑ from ₱14,200"        sparkKey="earnings" />
      <MetricCard label="Pending Sync"       value="2"       trend="⚠ Needs attention" warn sparkKey="pending"  />
    </div>

    <div className="grid grid-cols-[1.5fr_1fr] gap-4">
      {/* Recent Bookings */}
      <Card className="border border-black/5 shadow-sm">
        <CardHeader className="py-3 px-4 border-b border-black/5 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recent Bookings</CardTitle>
          <Link to="/bookings" className="text-xs text-green-600 font-semibold hover:underline">View all →</Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Guest</TableHead>
                <TableHead className="text-xs">Resort</TableHead>
                <TableHead className="text-xs">Platform</TableHead>
                <TableHead className="text-xs">Sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BOOKINGS.slice(0,4).map(b => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs">{b.guest}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{b.resort}</TableCell>
                  <TableCell><PlatformBadge platform={b.platform} /></TableCell>
                  <TableCell><SyncBadge sync={b.sync} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Platform Breakdown + Activity */}
      <Card className="border border-black/5 shadow-sm">
        <CardHeader className="py-3 px-4 border-b border-black/5">
          <CardTitle className="text-sm font-semibold">Platform Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-3">
          {[{l:"Klook",n:10,pct:42,color:"#3aab4a"},{l:"Booking.com",n:9,pct:37,color:"#1d4ed8"},{l:"Agoda",n:5,pct:21,color:"#7c3aed"}].map(p => (
            <div key={p.l} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{p.l}</span><span className="font-semibold text-foreground">{p.n} bookings</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div className="h-full rounded-full" style={{ width:`${p.pct}%`, background:p.color }} />
              </div>
            </div>
          ))}
        </CardContent>
        <div className="px-4 py-2 border-t border-black/5 flex justify-between items-center">
          <span className="text-sm font-semibold">Activity</span>
          <span className="text-xs text-muted-foreground">March 2026</span>
        </div>
        <CardContent className="px-4 pb-3 pt-1">
          <div className="flex items-end gap-1.5 h-20 mb-1">
            {ACTIVITY_BARS.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm" style={{ height:`${h}%`, background:"#3aab4a", opacity: h >= 85 ? 1 : 0.55, minHeight:3 }} />
            ))}
          </div>
          <div className="flex justify-between">
            {["Mar 1","Mar 8","Mar 15","Mar 22","Mar 28"].map(l => (
              <span key={l} className="text-[9px] text-muted-foreground">{l}</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);
