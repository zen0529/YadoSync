import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformBadge } from "@/components/PlatformBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getAllProperties, getAllOwners } from "../queries";
import {
  Building2,
  MapPin,
  User,
  Globe,
  CalendarCheck,
  Percent,
  Loader2,
} from "lucide-react";

export const AdminPropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const [propsData, ownersData] = await Promise.all([
          getAllProperties(),
          getAllOwners(),
        ]);
        setProperties(propsData);
        setOwners(ownersData);
      } catch (err) {
        console.error("Failed to load properties:", err);
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
        <span className="ml-2 text-sm text-muted-foreground">Loading properties...</span>
      </div>
    );
  }

  const filtered = properties.filter((p) =>
    (statusFilter === "all" || p.status === statusFilter) &&
    (ownerFilter === "all" || p.userId === ownerFilter)
  );

  return (
    <>
      {/* FILTERS */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 text-xs w-36 glass-filter-btn rounded-xl border-0">
            <SelectValue placeholder="Status: All" />
          </SelectTrigger>
          <SelectContent className="glass-dropdown rounded-xl border-white/30">
            <SelectItem value="all" className="text-xs rounded-lg">Status: All</SelectItem>
            <SelectItem value="active" className="text-xs rounded-lg">Active</SelectItem>
            <SelectItem value="setup" className="text-xs rounded-lg">Setup</SelectItem>
            <SelectItem value="suspended" className="text-xs rounded-lg">Suspended</SelectItem>
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
      </div>

      {/* PROPERTIES TABLE */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2 border-b border-white/20">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-foreground/85">All Properties</h3>
          <span className="text-xs text-muted-foreground/60 ml-1">({filtered.length})</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-12 h-12 rounded-full bg-blue-100/60 flex items-center justify-center mb-3">
              <Building2 className="w-6 h-6 text-blue-500/60" />
            </div>
            <p className="text-sm font-medium text-foreground/60 mb-1">No properties found</p>
            <p className="text-xs text-muted-foreground/60">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="divide-y divide-white/15 min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-[1.2fr_0.8fr_1fr_0.8fr_auto_0.5fr_0.5fr_auto] gap-3 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Property</div>
                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Location</div>
                <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Owner</div>
                <div className="flex items-center gap-1.5">Email</div>
                <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Platforms</div>
                <div className="flex items-center gap-1.5"><CalendarCheck className="w-3 h-3" /> Bookings</div>
                <div className="flex items-center gap-1.5"><Percent className="w-3 h-3" /> Rate</div>
                <div>Status</div>
              </div>

              {/* Rows */}
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[1.2fr_0.8fr_1fr_0.8fr_auto_0.5fr_0.5fr_auto] gap-3 px-5 py-3.5 items-center hover:bg-white/20 transition-colors duration-200 cursor-default"
                >
                  <span className="text-sm font-medium text-foreground/85">{p.name}</span>
                  <span className="text-sm text-muted-foreground/70">{p.location}</span>
                  <span className="text-sm text-muted-foreground/70">{p.ownerName}</span>
                  <span className="text-xs text-muted-foreground/60 truncate">{p.ownerEmail}</span>
                  <div className="flex gap-1 flex-wrap">
                    {p.platforms.map((pl) => (
                      <PlatformBadge key={pl} platform={pl} />
                    ))}
                    {p.platforms.length === 0 && <span className="text-xs text-muted-foreground/50">None</span>}
                  </div>
                  <span className="text-sm text-center font-medium text-foreground/80">{p.bookingCount}</span>
                  <span className="text-sm text-center font-medium text-foreground/80">{p.commissionRate}%</span>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
