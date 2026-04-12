import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlatformBadge } from "@/components/PlatformBadge";
import { SyncBadge } from "@/components/SyncBadge";
import { getAdminStats, getAllBookings } from "../queries";
import {
  ArrowRight,
  TrendingUp,
  User,
  Building2,
  Globe,
  RefreshCw,
  Coins,
  Users,
  CalendarCheck,
  Loader2,
} from "lucide-react";

const PLATFORMS = [
  { key: "klook",   label: "Klook",       color: "#22c55e" },
  { key: "booking", label: "Booking.com", color: "#3b82f6" },
  { key: "agoda",   label: "Agoda",       color: "#8b5cf6" },
];

const StatCard = ({ icon: Icon, gradient, shadow, label, value }) => (
  <div className="glass-card rounded-2xl p-5 group hover:bg-white/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold leading-none tracking-tight text-foreground/90">{value}</p>
    <p className="text-xs text-muted-foreground/70 font-medium mt-1">{label}</p>
  </div>
);

export const AdminOverviewPage = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, bookingsData] = await Promise.all([
          getAdminStats(),
          getAllBookings(),
        ]);
        setStats(statsData);
        setBookings(bookingsData);
      } catch (err) {
        console.error("Failed to load admin overview:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        <span className="ml-2 text-sm text-muted-foreground">Loading overview...</span>
      </div>
    );
  }

  const totalCommission = bookings.reduce((sum, b) => sum + (b.commission_amount || 0), 0);

  const platformCounts = PLATFORMS.map((p) => {
    const count = bookings.filter((b) => b.platform === p.key).length;
    return { ...p, count, pct: bookings.length ? Math.round((count / bookings.length) * 100) : 0 };
  });

  return (
    <>
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <StatCard icon={Building2} gradient="from-blue-400 to-indigo-500" shadow="shadow-blue-500/20" label="Total Properties" value={stats?.totalProperties ?? 0} />
        <StatCard icon={CalendarCheck} gradient="from-green-400 to-emerald-500" shadow="shadow-green-500/20" label="Total Bookings" value={stats?.totalBookings ?? 0} />
        <StatCard icon={Coins} gradient="from-amber-400 to-orange-500" shadow="shadow-amber-500/20" label="Total Commission" value={`₱${totalCommission.toLocaleString()}`} />
        <StatCard icon={Users} gradient="from-violet-400 to-purple-500" shadow="shadow-violet-500/20" label="Active Owners" value={stats?.totalOwners ?? 0} />
      </div>

      {/* BOTTOM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">

        {/* RECENT BOOKINGS */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/20">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground/85">Recent Bookings</h3>
            </div>
            <Link
              to="/admin/bookings"
              className="text-xs text-green-600/80 font-medium hover:text-green-700 transition-colors flex items-center gap-1 group"
            >
              View all
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/15">
            <div className="grid grid-cols-[1fr_1fr_0.8fr_auto_auto] gap-3 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Guest</div>
              <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Property</div>
              <div className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Owner</div>
              <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Platform</div>
              <div className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Sync</div>
            </div>

            {bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground/60">No bookings yet</p>
              </div>
            ) : (
              bookings.slice(0, 8).map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-[1fr_1fr_0.8fr_auto_auto] gap-3 px-5 py-3.5 items-center hover:bg-white/20 transition-colors duration-200 cursor-default"
                >
                  <span className="text-sm font-medium text-foreground/85">{b.guest_name}</span>
                  <span className="text-sm text-muted-foreground/70">{b.properties?.name || "—"}</span>
                  <span className="text-sm text-muted-foreground/70">{b.properties?.owner_name || "—"}</span>
                  <PlatformBadge platform={b.platform} />
                  <SyncBadge sync={b.sync_status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* PLATFORM BREAKDOWN */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Globe className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground/85">Platform Breakdown</h3>
            </div>

            <div className="space-y-3.5">
              {platformCounts.map((p) => (
                <div key={p.key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground/70 font-medium">{p.label}</span>
                    <span className="font-semibold text-foreground/80">{p.count} <span className="text-muted-foreground/50 font-normal">bookings</span></span>
                  </div>
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${p.pct}%`, background: `linear-gradient(90deg, ${p.color}aa, ${p.color})` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
              <span className="text-xs text-muted-foreground/60">Total</span>
              <span className="text-sm font-bold text-foreground/80">{bookings.length} bookings</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
