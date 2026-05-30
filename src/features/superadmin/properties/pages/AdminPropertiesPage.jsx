import React, { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/PlatformBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getAllProperties, getAllOwners } from "../channex";
import { getProperty } from "../supabase/getProperty";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  User,
  Globe,
  CalendarCheck,
  Percent,
  Loader2,
  FileText,
  Plus,
  Phone,
  Search,
  Edit
} from "lucide-react";
import { PropertyLedgerModal } from "../components/PropertyLedgerModal";
import { AddPropertyPanel } from "../components/AddPropertyPanel";
import { useProperties } from "../hooks/useProperties";
import { debounce } from "@/utils/debounce";
import { Input } from "@/components/ui/input";

export const AdminPropertiesPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { properties: dbProperties, loading: dbLoading } = useProperties(debouncedSearch, statusFilter);

  const [properties, setProperties] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editProperty, setEditProperty] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const debouncedSetSearch = useCallback(
    debounce((val) => setDebouncedSearch(val), 400),
    []
  );

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  useEffect(() => {
    if (dbProperties) {
      setProperties(dbProperties.map(p => {
        return {
          id: p.id,
          name: p.name,
          location: p.property_address?.address_line || "No location",
          ownerName: p.owner_name || "Unknown",
          ownerEmail: p.owner_email || "N/A",
          ownerPhone: p.owner_phone || "N/A",
          platforms: [], // Mock
          bookingCount: 0, // Mock
          commissionRate: p.commission_rate || 0,
          status: p.status,
          userId: p.user_id,
        };
      }));

      // Keep owners mock or extract from dbProperties
      const uniqueOwners = Array.from(new Set(dbProperties.map(p => p.user_id).filter(Boolean))).map(id => {
        const prop = dbProperties.find(p => p.user_id === id);
        return { id, full_name: prop.owner_name || prop.owner_email };
      });
      setOwners(uniqueOwners.length ? uniqueOwners : [
        { id: "o1", full_name: "Emma Davis" },
        { id: "o2", full_name: "Noah Wilson" },
        { id: "o3", full_name: "Liam Smith" },
        { id: "o4", full_name: "Olivia Jones" }
      ]);
      setLoading(false);
    }
  }, [dbProperties]);

  console.log("prpoerties", properties)

  // if (loading || dbLoading) {
  //   return (
  //     <div className="flex items-center justify-center py-20">
  //       <Loader2 className="w-6 h-6 animate-spin text-green-500" />
  //       <span className="ml-2 text-sm text-muted-foreground">Loading properties...</span>
  //     </div>
  //   );
  // }



  return (
    <>
      {/* FILTERS & ACTIONS */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-36 glass-filter-btn rounded-xl border-0">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              <SelectItem value="all" className="text-xs rounded-lg">Status: All</SelectItem>
              <SelectItem value="active" className="text-xs rounded-lg">Active</SelectItem>
              <SelectItem value="setup" className="text-xs rounded-lg">Inactive</SelectItem>
              {/* <SelectItem value="suspended" className="text-xs rounded-lg">Suspended</SelectItem> */}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search properties, owners..."
              className="h-9 w-64 pl-9 text-xs glass-filter-btn rounded-xl border-0 placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        <div>
          <Button
            onClick={() => {
              setEditProperty(null);
              setPanelOpen(true);
            }}
            className="h-9 rounded-xl glass-filter-btn border-0 text-xs font-semibold px-4 gap-2 shadow-lg shadow-black/5 hover:bg-white/30 transition-all duration-200 text-foreground"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </Button>
        </div>
      </div>

      {/* PROPERTIES TABLE */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2 border-b border-white/20">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-foreground/85">All Properties</h3>
          <span className="text-xs text-muted-foreground/60 ml-1">({properties.length})</span>
        </div>

        {(loading || dbLoading) ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-500 mb-2" />
            <span className="text-sm text-muted-foreground">Loading properties...</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-12 h-12 rounded-full bg-blue-100/60 flex items-center justify-center mb-3">
              <Building2 className="w-6 h-6 text-blue-500/60" />
            </div>
            <p className="text-sm font-medium text-foreground/60 mb-1">No properties found</p>
            <p className="text-xs text-muted-foreground/60">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="divide-y divide-white/15 min-w-[1200px]">
              {/* Header */}
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr_0.8fr_0.8fr_100px_100px_80px] gap-4 px-5 py-2.5 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Property</div>
                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Location</div>
                <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Owner</div>
                <div className="flex items-center gap-1.5">Email</div>
                <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone #</div>
                <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Platforms</div>
                <div className="flex items-center gap-1.5"><CalendarCheck className="w-3 h-3" /> Bookings</div>
                <div className="flex items-center gap-1.5"><Percent className="w-3 h-3" /> Rate</div>
                <div>Status</div>
                <div>Ledger</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Rows */}
              {properties.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr_0.8fr_0.8fr_100px_100px_80px] gap-4 px-5 py-3.5 items-center hover:bg-white/20 transition-colors duration-200 cursor-default"
                >
                  <span className="text-sm font-medium text-foreground/85">{p.name}</span>
                  <span className="text-sm text-muted-foreground/70">{p.location}</span>
                  <span className="text-sm text-muted-foreground/70">{p.ownerName}</span>
                  <span className="text-xs text-muted-foreground/60 truncate">{p.ownerEmail}</span>
                  <span className="text-xs text-muted-foreground/60 truncate">{p.ownerPhone}</span>
                  <div className="flex gap-1 flex-wrap">
                    {p.platforms.map((pl) => (
                      <PlatformBadge key={pl} platform={pl} />
                    ))}
                    {p.platforms.length === 0 && <span className="text-xs text-muted-foreground/50">None</span>}
                  </div>
                  <span className="text-sm text-center font-medium text-foreground/80">{p.bookingCount}</span>
                  <span className="text-sm text-center font-medium text-foreground/80">{p.commissionRate}%</span>
                  <StatusBadge status={p.status} />
                  <div>
                    <button
                      onClick={() => setSelectedProperty(p)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-indigo-500/20 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Ledger
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        setEditProperty(null);
                        setEditLoading(true);
                        setPanelOpen(true);
                        try {
                          const fullProperty = await getProperty(p.id);
                          setEditProperty(fullProperty);
                        } catch (err) {
                          toast.error("Failed to load property details for editing.");
                          setPanelOpen(false);
                        } finally {
                          setEditLoading(false);
                        }
                      }}
                      className="p-1.5 cursor-pointer rounded-lg hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit Property"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      <PropertyLedgerModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />

      {/* ADD PROPERTY PANEL */}
      <AddPropertyPanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setEditProperty(null);
          setEditLoading(false);
        }}
        propertyToEdit={editProperty}
        editLoading={editLoading}
      />
    </>
  );
};
