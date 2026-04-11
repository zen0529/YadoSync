import { useState, useEffect } from "react";
import { PlatformBadge } from "@/components/PlatformBadge";
import { getAllBookings, getAllProperties } from "../queries";
import {
  Coins,
  TrendingUp,
  Building2,
  User,
  Globe,
  Loader2,
} from "lucide-react";

const PLATFORMS = [
  { key: "klook",   label: "Klook",       color: "#22c55e" },
  { key: "booking", label: "Booking.com", color: "#3b82f6" },
  { key: "agoda",   label: "Agoda",       color: "#8b5cf6" },
];

const StatCard = ({ icon: Icon, gradient, shadow, label, value, sub }) => (
  <div className="glass-card rounded-2xl p-5 group hover:bg-white/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold leading-none tracking-tight text-foreground/90">{value}</p>
    <p className="text-xs text-muted-foreground/70 font-medium mt-1">{label}</p>
    {sub && <p className="text-xs mt-1 font-medium text-green-600/80">{sub}</p>}
  </div>
);

export const AdminEarningsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [bookingsData, propsData] = await Promise.all([
          getAllBookings(),
          getAllProperties(),
        ]);
        setBookings(bookingsData);
        setProperties(propsData);
      } catch (err) {
        console.error("Failed to load earnings:", err);
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
        <span className="ml-2 text-sm text-muted-foreground">Loading earnings...</span>
      </div>
    );
  }

  const totalCommission = bookings.reduce((sum, b) => sum + (b.commission_amount || 0), 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const thisMonthCommission = bookings
    .filter((b) => b.booked_at && new Date(b.booked_at) >= startOfMonth)
    .reduce((sum, b) => sum + (b.commission_amount || 0), 0);

  const thisWeekCommission = bookings
    .filter((b) => b.booked_at && new Date(b.booked_at) >= startOfWeek)
    .reduce((sum, b) => sum + (b.commission_amount || 0), 0);

  // Group by property
  const perProperty = {};
  bookings.forEach((b) => {
    const key = b.property_id;
    if (!perProperty[key]) {
      perProperty[key] = {
        name: b.properties?.name || "Unknown",
        owner: b.properties?.owner_name || "—",
        bookings: 0,
        commission: 0,
      };
    }
    perProperty[key].bookings += 1;
    perProperty[key].commission += b.commission_amount || 0;
  });
  const propertyList = Object.values(perProperty).sort((a, b) => b.commission - a.commission);

  // Group by owner
  const perOwner = {};
  bookings.forEach((b) => {
    const key = b.properties?.user_id || "unknown";
    if (!perOwner[key]) {
      perOwner[key] = {
        name: b.properties?.owner_name || "Unknown",
        properties: new Set(),
        bookings: 0,
        commission: 0,
      };
    }
    perOwner[key].properties.add(b.property_id);
    perOwner[key].bookings += 1;
    perOwner[key].commission += b.commission_amount || 0;
  });
  const ownerList = Object.values(perOwner)
    .map((o) => ({ ...o, propertyCount: o.properties.size }))
    .sort((a, b) => b.commission - a.commission);

  // Platform breakdown
  const platformData = PLATFORMS.map((p) => {
    const commission = bookings
      .filter((b) => b.platform === p.key)
      .reduce((sum, b) => sum + (b.commission_amount || 0), 0);
    return { ...p, commission, pct: totalCommission ? Math.round((commission / totalCommission) * 100) : 0 };
  });

  return (
    <>
      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <StatCard icon={Coins} gradient="from-amber-400 to-orange-500" shadow="shadow-amber-500/20" label="Total Commission" value={`₱${totalCommission.toLocaleString()}`} sub="All time" />
        <StatCard icon={TrendingUp} gradient="from-green-400 to-emerald-500" shadow="shadow-green-500/20" label="This Month" value={`₱${thisMonthCommission.toLocaleString()}`} />
        <StatCard icon={TrendingUp} gradient="from-blue-400 to-indigo-500" shadow="shadow-blue-500/20" label="This Week" value={`₱${thisWeekCommission.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* COMMISSION PER PROPERTY */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2 border-b border-white/20">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground/85">Commission Per Property</h3>
          </div>

          <div className="divide-y divide-white/15">
            <div className="grid grid-cols-[1.2fr_0.8fr_0.5fr_0.6fr] gap-3 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Property</div>
              <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Owner</div>
              <div>Bookings</div>
              <div className="flex items-center gap-1.5"><Coins className="w-3 h-3" /> Commission</div>
            </div>

            {propertyList.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground/60">No data yet</p>
              </div>
            ) : (
              propertyList.map((p, i) => (
                <div key={i} className="grid grid-cols-[1.2fr_0.8fr_0.5fr_0.6fr] gap-3 px-5 py-3.5 items-center hover:bg-white/20 transition-colors duration-200">
                  <span className="text-sm font-medium text-foreground/85">{p.name}</span>
                  <span className="text-sm text-muted-foreground/70">{p.owner}</span>
                  <span className="text-sm text-center text-foreground/80">{p.bookings}</span>
                  <span className="text-sm font-semibold text-green-600">₱{p.commission.toLocaleString()}</span>
                </div>
              ))
            )}

            {propertyList.length > 0 && (
              <div className="grid grid-cols-[1.2fr_0.8fr_0.5fr_0.6fr] gap-3 px-5 py-3.5 items-center border-t-2 border-green-400/30">
                <strong className="text-sm text-foreground/80">Total</strong>
                <span />
                <span className="text-sm text-center font-medium text-foreground/80">{bookings.length}</span>
                <strong className="text-base text-green-600">₱{totalCommission.toLocaleString()}</strong>
              </div>
            )}
          </div>
        </div>

        {/* COMMISSION PER OWNER */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2 border-b border-white/20">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/20">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground/85">Commission Per Owner</h3>
          </div>

          <div className="divide-y divide-white/15">
            <div className="grid grid-cols-[1.2fr_0.6fr_0.5fr_0.6fr] gap-3 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Owner</div>
              <div>Properties</div>
              <div>Bookings</div>
              <div className="flex items-center gap-1.5"><Coins className="w-3 h-3" /> Commission</div>
            </div>

            {ownerList.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground/60">No data yet</p>
              </div>
            ) : (
              ownerList.map((o, i) => (
                <div key={i} className="grid grid-cols-[1.2fr_0.6fr_0.5fr_0.6fr] gap-3 px-5 py-3.5 items-center hover:bg-white/20 transition-colors duration-200">
                  <span className="text-sm font-medium text-foreground/85">{o.name}</span>
                  <span className="text-sm text-center text-foreground/80">{o.propertyCount}</span>
                  <span className="text-sm text-center text-foreground/80">{o.bookings}</span>
                  <span className="text-sm font-semibold text-green-600">₱{o.commission.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PLATFORM BREAKDOWN */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground/85">Commission Per Platform</h3>
          </div>

          <div className="space-y-3.5">
            {platformData.map((p) => (
              <div key={p.key}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground/70 font-medium">{p.label}</span>
                  <span className="font-semibold text-foreground/80">₱{p.commission.toLocaleString()} <span className="text-muted-foreground/50 font-normal">({p.pct}%)</span></span>
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
            <span className="text-sm font-bold text-green-600">₱{totalCommission.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </>
  );
};
