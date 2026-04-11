import { Link } from "react-router-dom";
import { PlatformBadge } from "@/components/PlatformBadge";
import { SyncBadge } from "@/components/SyncBadge";
import { MetricCard } from "../components/MetricCard";
import { BOOKINGS } from "@/data/constants";
import { ACTIVITY_BARS } from "../data/constants";
import {
  ArrowRight,
  TrendingUp,
  User,
  Building2,
  Globe,
  RefreshCw,
} from "lucide-react";

const PLATFORMS = [
  { label: "Klook",       n: 10, pct: 42, color: "from-green-400 to-emerald-500", bg: "bg-green-500", bar: "#22c55e" },
  { label: "Booking.com", n: 9,  pct: 37, color: "from-blue-400 to-indigo-500",   bg: "bg-blue-500",  bar: "#3b82f6" },
  { label: "Agoda",       n: 5,  pct: 21, color: "from-violet-400 to-purple-500", bg: "bg-violet-500", bar: "#8b5cf6" },
];

export const DashboardPage = () => (
  <>
    {/* METRIC CARDS */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      <MetricCard label="Total Bookings"     value="24"      trend="↑ +3 this week"        sparkKey="bookings" />
      <MetricCard label="Active Resorts"     value="6"       trend="3 platforms connected"  sparkKey="resorts"  />
      <MetricCard label="Commission (March)" value="₱18,400" trend="↑ from ₱14,200"        sparkKey="earnings" />
      <MetricCard label="Pending Sync"       value="2"       trend="Needs attention" warn sparkKey="pending"  />
    </div>

    {/* BOTTOM GRID */}
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">

      {/* RECENT BOOKINGS — frosted glass */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground/85">Recent Bookings</h3>
          </div>
          <Link
            to="/dashboard/bookings"
            className="text-xs text-green-600/80 font-medium hover:text-green-700 transition-colors flex items-center gap-1 group"
          >
            View all
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Table */}
        <div className="divide-y divide-white/15">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Guest</div>
            <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Resort</div>
            <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Platform</div>
            <div className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Sync</div>
          </div>

          {/* Table Rows */}
          {BOOKINGS.slice(0, 4).map((b, i) => (
            <div
              key={b.id}
              className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-white/20 transition-colors duration-200 cursor-default"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-sm font-medium text-foreground/85">{b.guest}</span>
              <span className="text-sm text-muted-foreground/70">{b.resort}</span>
              <PlatformBadge platform={b.platform} />
              <SyncBadge sync={b.sync} />
            </div>
          ))}
        </div>
      </div>

      {/* PLATFORM BREAKDOWN + ACTIVITY — frosted glass */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Platform Breakdown */}
        <div className="px-5 py-4 border-b border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground/85">Platform Breakdown</h3>
          </div>

          <div className="space-y-3.5">
            {PLATFORMS.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground/70 font-medium">{p.label}</span>
                  <span className="font-semibold text-foreground/80">{p.n} <span className="text-muted-foreground/50 font-normal">bookings</span></span>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${p.pct}%`, background: `linear-gradient(90deg, ${p.bar}aa, ${p.bar})` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total indicator */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
            <span className="text-xs text-muted-foreground/60">Total</span>
            <span className="text-sm font-bold text-foreground/80">24 bookings</span>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="px-5 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/20">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground/85">Activity</h3>
            </div>
            <span className="text-[11px] text-muted-foreground/50 font-medium bg-white/25 px-2.5 py-1 rounded-full">
              March 2026
            </span>
          </div>

          <div className="flex items-end gap-1.5 h-24 mb-2 px-1">
            {ACTIVITY_BARS.map((h, i) => {
              const intensity = h / 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-md transition-all duration-300 hover:opacity-100 cursor-default group relative"
                  style={{
                    height: `${h}%`,
                    background: `linear-gradient(180deg, rgba(34,197,94,${0.3 + intensity * 0.6}) 0%, rgba(16,185,129,${0.2 + intensity * 0.5}) 100%)`,
                    minHeight: 4,
                  }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground/80 text-white text-[9px] font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
                    {h}%
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between px-1">
            {["Mar 1", "Mar 8", "Mar 15", "Mar 22", "Mar 28"].map((l) => (
              <span key={l} className="text-[9px] text-muted-foreground/40 font-medium">{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
);
