import { PlatformBadge } from "@/components/PlatformBadge";
import { MetricCard } from "../../components/MetricCard";
import { EARNINGS_PER_RESORT, EARNINGS_PER_BOOKING } from "../data/constants";
import {
  User,
  Building2,
  Globe,
  Coins,
  TrendingUp,
} from "lucide-react";

export const EarningsPage = () => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
      <MetricCard label="Total Commission"    value="₱18,400" trend="March 2026"          sparkKey="earnings" />
      <MetricCard label="Bookings This Month" value="24"      trend="Across 6 resorts"     sparkKey="bookings" />
      <MetricCard label="Avg. Per Booking"    value="₱767"    trend="~10% commission rate" sparkKey="earnings" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Commission Per Booking */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2 border-b border-white/20">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
            <Coins className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-foreground/85">Commission Per Booking</h3>
        </div>

        <div className="divide-y divide-white/15">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Guest</div>
            <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Resort</div>
            <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Platform</div>
            <div className="flex items-center gap-1.5"><Coins className="w-3 h-3" /> Commission</div>
          </div>

          {/* Table Rows */}
          {EARNINGS_PER_BOOKING.map((e, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 px-5 py-3.5 items-center hover:bg-white/20 transition-colors duration-200"
            >
              <span className="text-sm font-medium text-foreground/85">{e.guest}</span>
              <span className="text-sm text-muted-foreground/70">{e.resort}</span>
              <PlatformBadge platform={e.platform} />
              <span className="text-sm font-semibold text-green-600">₱{e.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Per Resort */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2 border-b border-white/20">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-foreground/85">Commission Per Resort</h3>
        </div>

        <div className="px-5 py-3">
          {EARNINGS_PER_RESORT.map((e) => (
            <div key={e.resort} className="flex justify-between py-3 border-b border-white/15 last:border-0">
              <span className="text-sm text-foreground/70">{e.resort}</span>
              <span className="text-sm font-semibold text-foreground/85">₱{e.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between pt-4 mt-2 border-t-2 border-green-400/30">
            <strong className="text-sm text-foreground/80">Total</strong>
            <strong className="text-base text-green-600">₱18,400</strong>
          </div>
        </div>
      </div>
    </div>
  </>
);
