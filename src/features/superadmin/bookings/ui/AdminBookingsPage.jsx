import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformBadge } from "@/components/PlatformBadge";
import { SyncBadge } from "@/components/SyncBadge";
import { getAllBookings, getAllOwners, getAllProperties } from "../queries";
import {
  User,
  Building2,
  Globe,
  RefreshCw,
  CalendarDays,
  CalendarCheck,
  Coins,
  Users,
  Loader2,
} from "lucide-react";

export const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [owners, setOwners] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [platformFilter, setPlatformFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [syncFilter, setSyncFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const [bookingsData, ownersData, propsData] = await Promise.all([
          getAllBookings(),
          getAllOwners(),
          getAllProperties(),
        ]);
        setBookings(bookingsData);
        setOwners(ownersData);
        setProperties(propsData);
      } catch (err) {
        console.error("Failed to load bookings:", err);
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
        <span className="ml-2 text-sm text-muted-foreground">Loading bookings...</span>
      </div>
    );
  }

  const filtered = bookings.filter((b) =>
    (platformFilter === "all" || b.platform === platformFilter) &&
    (propertyFilter === "all" || b.property_id === propertyFilter) &&
    (ownerFilter === "all" || b.properties?.user_id === ownerFilter) &&
    (syncFilter === "all" || b.sync_status === syncFilter)
  );

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) : "—";

  return (
    <>
      {/* FILTERS */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="h-9 text-xs w-36 glass-filter-btn rounded-xl border-0">
            <SelectValue placeholder="Platform: All" />
          </SelectTrigger>
          <SelectContent className="glass-dropdown rounded-xl border-white/30">
            <SelectItem value="all" className="text-xs rounded-lg">Platform: All</SelectItem>
            <SelectItem value="klook" className="text-xs rounded-lg">Klook</SelectItem>
            <SelectItem value="booking" className="text-xs rounded-lg">Booking.com</SelectItem>
            <SelectItem value="agoda" className="text-xs rounded-lg">Agoda</SelectItem>
          </SelectContent>
        </Select>

        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger className="h-9 text-xs w-44 glass-filter-btn rounded-xl border-0">
            <SelectValue placeholder="Property: All" />
          </SelectTrigger>
          <SelectContent className="glass-dropdown rounded-xl border-white/30">
            <SelectItem value="all" className="text-xs rounded-lg">Property: All</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs rounded-lg">{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="h-9 text-xs w-44 glass-filter-btn rounded-xl border-0">
            <SelectValue placeholder="Owner: All" />
          </SelectTrigger>
          <SelectContent className="glass-dropdown rounded-xl border-white/30">
            <SelectItem value="all" className="text-xs rounded-lg">Owner: All</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o.id} value={o.id} className="text-xs rounded-lg">
                {o.full_name || o.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={syncFilter} onValueChange={setSyncFilter}>
          <SelectTrigger className="h-9 text-xs w-36 glass-filter-btn rounded-xl border-0">
            <SelectValue placeholder="Sync: All" />
          </SelectTrigger>
          <SelectContent className="glass-dropdown rounded-xl border-white/30">
            <SelectItem value="all" className="text-xs rounded-lg">Sync: All</SelectItem>
            <SelectItem value="synced" className="text-xs rounded-lg">Synced</SelectItem>
            <SelectItem value="pending" className="text-xs rounded-lg">Pending</SelectItem>
            <SelectItem value="failed" className="text-xs rounded-lg">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* BOOKINGS TABLE */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2 border-b border-white/20">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
            <CalendarCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-foreground/85">All Bookings</h3>
          <span className="text-xs text-muted-foreground/60 ml-1">({filtered.length})</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-12 h-12 rounded-full bg-green-100/60 flex items-center justify-center mb-3">
              <CalendarCheck className="w-6 h-6 text-green-500/60" />
            </div>
            <p className="text-sm font-medium text-foreground/60 mb-1">No bookings found</p>
            <p className="text-xs text-muted-foreground/60">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="divide-y divide-white/15 min-w-[900px]">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_0.8fr_0.6fr_0.6fr_0.6fr_0.6fr_auto_auto] gap-3 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Guest</div>
                <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Property</div>
                <div className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Owner</div>
                <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Platform</div>
                <div className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> Check-in</div>
                <div className="flex items-center gap-1.5">Check-out</div>
                <div className="flex items-center gap-1.5"><Coins className="w-3 h-3" /> Commission</div>
                <div className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Sync</div>
                <div>Booked</div>
              </div>

              {/* Rows */}
              {filtered.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-[1fr_1fr_0.8fr_0.6fr_0.6fr_0.6fr_0.6fr_auto_auto] gap-3 px-5 py-3.5 items-center hover:bg-white/20 transition-colors duration-200 cursor-default"
                >
                  <span className="text-sm font-medium text-foreground/85">{b.guest_name}</span>
                  <span className="text-sm text-muted-foreground/70">{b.properties?.name || "—"}</span>
                  <span className="text-sm text-muted-foreground/70">{b.properties?.owner_name || "—"}</span>
                  <PlatformBadge platform={b.platform} />
                  <span className="text-xs text-muted-foreground/70">{formatDate(b.check_in)}</span>
                  <span className="text-xs text-muted-foreground/70">{formatDate(b.check_out)}</span>
                  <span className="text-sm font-semibold text-green-600">₱{(b.commission_amount || 0).toLocaleString()}</span>
                  <SyncBadge sync={b.sync_status} />
                  <span className="text-xs text-muted-foreground/60">{formatDate(b.booked_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
