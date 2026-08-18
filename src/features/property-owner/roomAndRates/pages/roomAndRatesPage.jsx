import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImportOtaModal } from "../components/ImportOtaModal";
import { BedDouble, Download, Loader2, CalendarDays } from "lucide-react";
import { useInventory } from "../hooks/useInventory";
import { RoomTypesTab } from "../components/RoomTypesTab";
import { ARIEditorPanel } from "../components/ARIEditorPanel";

export const RoomAndRatesPage = () => {
  const { property, roomTypes: initialRoomTypes, loading } = useInventory();
  const [resortFilter, setResortFilter] = useState("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isARIEditorOpen, setIsARIEditorOpen] = useState(false);

  // Passed up from RoomTypesTab so the ARI panel can show room type / rate plan selectors
  const [ariRoomTypes, setAriRoomTypes] = useState([]);
  const [ariRatePlans, setAriRatePlans] = useState([]);
  const [ariDefaultRoomTypeId, setAriDefaultRoomTypeId] = useState(null);
  const [ariDefaultRatePlanId, setAriDefaultRatePlanId] = useState(null);

  const openARIEditor = ({
    roomTypes = [],
    ratePlans = [],
    defaultRoomTypeId = null,
    defaultRatePlanId = null,
  } = {}) => {
    setAriRoomTypes(roomTypes);
    setAriRatePlans(ratePlans);
    setAriDefaultRoomTypeId(defaultRoomTypeId);
    setAriDefaultRatePlanId(defaultRatePlanId);
    setIsARIEditorOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header & Filters */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
            <BedDouble className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground/90 leading-tight">
              Rooms & Rates
            </h2>
            <p className="text-xs text-muted-foreground/60">
              Configure your physical room types and pricing plans
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-foreground border border-white/20 rounded-xl h-9 px-4 flex items-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-semibold hidden sm:inline">
              Import from OTA
            </span>
          </Button>

          <Button
            onClick={() =>
              openARIEditor({
                roomTypes: ariRoomTypes,
                ratePlans: ariRatePlans,
              })
            }
            disabled={!property}
            className="bg-blue-500/90 hover:bg-blue-600 text-white border-0 rounded-xl h-9 px-4 flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20"
          >
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-semibold hidden sm:inline">
              Set Prices &amp; Availability
            </span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <span className="text-sm text-muted-foreground">
              Loading inventory...
            </span>
          </div>
        ) : !property ? (
          <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 px-6 mt-4">
            <div className="w-14 h-14 rounded-full bg-green-100/60 flex items-center justify-center mb-4">
              <BedDouble className="w-7 h-7 text-green-500/50" />
            </div>
            <p className="text-base font-semibold text-foreground/60 mb-1">
              No property found
            </p>
            <p className="text-sm text-muted-foreground/60 text-center max-w-xs">
              You need a property set up before managing room types.
            </p>
          </div>
        ) : (
          <RoomTypesTab
            propertyId={property.id}
            channexPropertyId={property.channex_property_id}
            initialRoomTypes={initialRoomTypes}
            onOpenARIEditor={openARIEditor}
            onRoomTypesLoaded={setAriRoomTypes}
            onRatePlansLoaded={setAriRatePlans}
          />
        )}
      </div>

      <ImportOtaModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={() => {}}
      />

      {/* ARI Editor slide-over */}
      {property && (
        <ARIEditorPanel
          open={isARIEditorOpen}
          onClose={() => setIsARIEditorOpen(false)}
          propertyId={property.id}
          channexPropertyId={property.channex_property_id}
          roomTypes={ariRoomTypes}
          ratePlans={ariRatePlans}
          defaultRoomTypeId={ariDefaultRoomTypeId}
          defaultRatePlanId={ariDefaultRatePlanId}
        />
      )}
    </div>
  );
};
