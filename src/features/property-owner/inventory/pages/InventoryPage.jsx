import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImportOtaModal } from "../components/ImportOtaModal";
import { BedDouble, Tag, Download, Loader2 } from "lucide-react";
import { useInventory } from "../hooks/useInventory";
import { RoomTypesTab } from "../components/RoomTypesTab";
import { RatePlansTab } from "../components/RatePlansTab";

const INVENTORY_TABS = [
  { id: "room_types", label: "Room Types", icon: BedDouble },
  { id: "rate_plans", label: "Rate Plans", icon: Tag },
];

export const InventoryPage = () => {
  const { property, loading } = useInventory();
  const [resortFilter, setResortFilter] = useState("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("room_types");

  return (
    <div className="flex flex-col h-full">
      {/* Header & Filters */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
            <BedDouble className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground/90 leading-tight">Rooms & Inventory</h2>
            <p className="text-xs text-muted-foreground/60">Configure your physical room types and pricing plans</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={resortFilter} onValueChange={setResortFilter}>
            <SelectTrigger className="h-9 text-xs w-40 glass-filter-btn rounded-xl border-0">
              <SelectValue placeholder="Resort: All" />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              <SelectItem value="all" className="text-xs rounded-lg">Property: All</SelectItem>
              {property && <SelectItem key={property.name} value={property.name} className="text-xs rounded-lg">{property.name}</SelectItem>}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-foreground border border-white/20 rounded-xl h-9 px-4 flex items-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-semibold hidden sm:inline">Import from OTA</span>
          </Button>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex mb-4 shrink-0">
        {INVENTORY_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-2.5 px-1 mr-6 text-xs font-semibold border-b-2 transition-all duration-200
                ${activeTab === tab.id
                  ? "border-green-500 text-green-600 dark:text-green-400"
                  : "border-transparent text-muted-foreground/60 hover:text-foreground hover:border-border"
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <span className="text-sm text-muted-foreground">Loading inventory...</span>
          </div>
        ) : !property ? (
          <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 px-6 mt-4">
            <div className="w-14 h-14 rounded-full bg-green-100/60 flex items-center justify-center mb-4">
              <BedDouble className="w-7 h-7 text-green-500/50" />
            </div>
            <p className="text-base font-semibold text-foreground/60 mb-1">No property found</p>
            <p className="text-sm text-muted-foreground/60 text-center max-w-xs">You need a property set up before managing room types.</p>
          </div>
        ) : (
          <div className="flex-1">
            <div className={activeTab === "room_types" ? "block" : "hidden"}>
              <RoomTypesTab propertyId={property.id} channexPropertyId={property.channex_property_id} />
            </div>
            <div className={activeTab === "rate_plans" ? "block" : "hidden"}>
              <RatePlansTab propertyId={property.id} channexPropertyId={property.channex_property_id} />
            </div>
          </div>
        )}
      </div>

      <ImportOtaModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImport={() => { }} />
    </div>
  );
};
