import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useActiveProperty } from "@/features/property-owner/context/PropertyContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  RefreshCw,
  BedDouble,
  Building2,
  CalendarDays,
  LayoutGrid,
  Pencil,
  Check,
  X,
  PackageOpen,
  AlertCircle,
} from "lucide-react";
import { InventoryGridView } from "../components/inventoryGridView";
import { InventoryCalendarView } from "../components/inventoryCalendarView";
import { useGetAvailabilities } from "../hooks/useGetAvailabilities";
import { useGetRestrictions } from "../hooks/useGetRestrictions";
import { Button } from "@/components/ui/button";
import { usePushAvailability } from "@/features/property-owner/roomAndRates/hooks/usePushAvailability";
import {
  MONTH_NAMES,
  DOW_LABELS,
  toDateStr,
  firstOfMonth,
  daysInMonth,
  addDays,
} from "../utils/dateUtils";

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal = ({
  open,
  onClose,
  roomType,
  date,
  currentValue,
  channexPropertyId,
  propertyId,
  onSaved,
}) => {
  const [val, setVal] = useState(currentValue ?? roomType?.count_of_rooms ?? 1);
  const [saving, setSaving] = useState(false);
  const { pushAvailability } = usePushAvailability();

  useEffect(() => {
    setVal(currentValue ?? roomType?.count_of_rooms ?? 1);
  }, [currentValue, roomType, open]);

  if (!open || !roomType || !date) return null;

  const d = new Date(date + "T00:00:00Z");
  const label = `${DOW_LABELS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!roomType.channex_room_type_id) {
      toast.error(
        "Room type has no Channex ID — sync it in Rooms & Rates first.",
      );
      return;
    }
    setSaving(true);
    try {
      await pushAvailability({
        propertyId,
        roomTypeId: roomType.id,
        channexPropertyId,
        channexRoomTypeId: roomType.channex_room_type_id,
        values: [{ date, available: Number(val) }],
      });
      toast.success("Availability updated", {
        description: `${val} rooms on ${date}`,
      });
      onSaved(roomType.id, date, Number(val));
      onClose();
    } catch (err) {
      toast.error("Failed to push availability", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-2xl bg-background/90 dark:bg-[#0f172a]/95 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md shadow-green-500/30">
              <BedDouble className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/90 leading-none">
                {roomType.title}
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground/70 mb-1.5 uppercase tracking-wide">
              Available Rooms
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVal((v) => Math.max(0, Number(v) - 1))}
                className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted text-foreground/70 flex items-center justify-center text-lg font-bold transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                max={roomType.count_of_rooms}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="flex-1 h-9 rounded-xl border border-border bg-background/60 text-center text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-green-400/50"
              />
              <button
                type="button"
                onClick={() =>
                  setVal((v) =>
                    Math.min(roomType.count_of_rooms, Number(v) + 1),
                  )
                }
                className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted text-foreground/70 flex items-center justify-center text-lg font-bold transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground/50 text-center mt-1.5">
              Max capacity: <strong>{roomType.count_of_rooms}</strong>
            </p>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-md shadow-green-500/25"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Pushing to Channex…
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save & Push
              </>
            )}
          </Button>
        </form>
      </div>
    </>
  );
};

// ─── Page Header ──────────────────────────────────────────────────────────────

const PageHeader = ({
  property,
  onRefresh,
  gridLoading,
  view = "grid",
  onViewChange,
}) => (
  <div className="flex items-center justify-between shrink-0">
    <div className="flex items-center gap-3"></div>
    <div className="flex items-center gap-2">
      {/* Toggle button: Grid & Calendar */}
      <div className="flex items-center p-1 bg-muted/50 dark:bg-muted/30 rounded-xl border border-border/40 gap-1">
        <button
          type="button"
          onClick={() => onViewChange?.("grid")}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            view === "grid"
              ? "bg-background text-foreground shadow-sm dark:bg-white/10 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Grid
        </button>
        <button
          type="button"
          onClick={() => onViewChange?.("calendar")}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            view === "calendar"
              ? "bg-background text-foreground shadow-sm dark:bg-white/10 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Calendar
        </button>
      </div>

      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={gridLoading}
          className="h-8 px-3 text-xs rounded-xl border-border/50 gap-1.5"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${gridLoading ? "animate-spin" : ""}`}
          />
        </Button>
      )}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const InventoryPage = () => {
  const { user } = useAuth();
  const {
    selectedProperty: property,
    selectedPropertyId,
    isLoading: propertyLoading,
  } = useActiveProperty();

  const [roomTypes, setRoomTypes] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);
  const [roomLoading, setRoomLoading] = useState(false);
  const [view, setView] = useState("grid");
  const grid = view === "grid";

  // Current month/year
  const today = useMemo(() => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }, []);
  const [viewYear, setViewYear] = useState(today.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(today.getUTCMonth()); // 0-indexed

  // Use availability hook
  const {
    availMap,
    gridLoading: availLoading,
    isFetching: availFetching,
    loadAvailability,
    handleCellSaved,
  } = useGetAvailabilities({
    propertyId: selectedPropertyId,
    roomTypes,
    viewYear,
    viewMonth,
  });

  // Use restrictions hook
  const {
    restrMap,
    ratePlanRestrMap,
    restrLoading,
    isFetching: restrFetching,
    loadRestrictions,
    handleRestrictionSaved,
  } = useGetRestrictions({
    property,
    propertyId: selectedPropertyId,
    roomTypes,
    ratePlanIds: useMemo(() => ratePlans.map((p) => p.id), [ratePlans]),
    viewYear,
    viewMonth,
  });

  const gridLoading = availLoading || restrLoading;
  const isRefreshing = availFetching || restrFetching;

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadAvailability(), loadRestrictions()]);
  }, [loadAvailability, loadRestrictions]);

  const [activeRoomTypeId, setActiveRoomTypeId] = useState(null);
  const [editCell, setEditCell] = useState(null);

  // ── Calendar cells for the current month view ─────────────────────────────
  const calendarData = useMemo(() => {
    const firstDay = firstOfMonth(viewYear, viewMonth);
    const totalDays = daysInMonth(viewYear, viewMonth);
    const startDow = firstDay.getUTCDay(); // 0=Sun
    const cells = [];
    // Leading empty cells
    for (let i = 0; i < startDow; i++) cells.push({ date: null });
    // Month days
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ date: new Date(Date.UTC(viewYear, viewMonth, d)) });
    }
    // Trailing empty cells to complete final row (multiple of 7)
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [viewYear, viewMonth]);

  // ── Load room types & rate plans for active property ──────────────────────
  useEffect(() => {
    if (!selectedPropertyId) {
      setRoomTypes([]);
      setRatePlans([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setRoomLoading(true);
      try {
        // Fetch in parallel so both state updates fire in the same React render
        const [{ data: rooms }, { data: plans }] = await Promise.all([
          supabase
            .from("room_types")
            .select("id, title, count_of_rooms, channex_room_type_id")
            .eq("property_id", selectedPropertyId)
            .order("created_at", { ascending: true }),
          supabase
            .from("rate_plans")
            .select(
              "id, title, room_type_id, channex_rate_plan_id, currency, sell_mode, room_types(title)",
            )
            .eq("property_id", selectedPropertyId)
            .order("created_at", { ascending: true }),
        ]);

        if (!cancelled) {
          if (rooms) {
            setRoomTypes(rooms);
            if (rooms.length) setActiveRoomTypeId(rooms[0].id);
          }
          // Both setRoomTypes + setRatePlans are called synchronously here,
          // so React 18 batches them into ONE re-render — rate plan rows and
          // availability rows always appear on the same paint.
          if (plans) setRatePlans(plans);
        }
      } finally {
        if (!cancelled) setRoomLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPropertyId]);

  const handlePrevMonth = () => {
    setViewYear((y) => (viewMonth === 0 ? y - 1 : y));
    setViewMonth((m) => (m === 0 ? 11 : m - 1));
  };
  const handleNextMonth = () => {
    setViewYear((y) => (viewMonth === 11 ? y + 1 : y));
    setViewMonth((m) => (m === 11 ? 0 : m + 1));
  };
  const handleThisMonth = () => {
    setViewYear(today.getUTCFullYear());
    setViewMonth(today.getUTCMonth());
  };
  const handleMonthChange = (year, month) => {
    setViewYear(year);
    setViewMonth(month);
  };

  const activeRoomType = roomTypes.find((r) => r.id === activeRoomTypeId);
  const pageLoading = propertyLoading || (roomLoading && !roomTypes.length);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        <span className="text-sm text-muted-foreground">
          Loading inventory…
        </span>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-green-100/60 dark:bg-green-500/10 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-green-400/60" />
        </div>
        <p className="text-base font-semibold text-foreground/60">
          No property found
        </p>
        <p className="text-sm text-muted-foreground/50 text-center max-w-xs">
          A property needs to be set up by an admin before you can manage
          inventory.
        </p>
      </div>
    );
  }

  if (!roomTypes.length) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader property={property} view={view} onViewChange={setView} />
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
            <PackageOpen className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-base font-semibold text-foreground/60">
            No room types yet
          </p>
          <p className="text-sm text-muted-foreground/50 text-center max-w-xs">
            Create room types in <strong>Rooms &amp; Rates</strong> first, then
            come back here to manage availability.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Page header — fixed */}
      <div className="shrink-0">
        <PageHeader
          property={property}
          onRefresh={handleRefresh}
          gridLoading={isRefreshing}
          view={view}
          onViewChange={setView}
        />
      </div>

      {grid ? (
        <InventoryGridView
          roomTypes={roomTypes}
          ratePlans={ratePlans}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onMonthChange={handleMonthChange}
          handleThisMonth={handleThisMonth}
          handlePrevMonth={handlePrevMonth}
          handleNextMonth={handleNextMonth}
          gridLoading={gridLoading}
          availMap={availMap}
          restrMap={restrMap}
          ratePlanRestrMap={ratePlanRestrMap}
          today={today}
          setEditCell={setEditCell}
          channexPropertyId={property?.channex_property_id}
          propertyId={property?.id}
          onRestrictionSaved={handleRestrictionSaved}
        />
      ) : (
        <InventoryCalendarView
          roomTypes={roomTypes}
          activeRoomTypeId={activeRoomTypeId}
          setActiveRoomTypeId={setActiveRoomTypeId}
          activeRoomType={activeRoomType}
          onMonthChange={handleMonthChange}
          handleThisMonth={handleThisMonth}
          handlePrevMonth={handlePrevMonth}
          handleNextMonth={handleNextMonth}
          viewMonth={viewMonth}
          viewYear={viewYear}
          gridLoading={gridLoading}
          calendarData={calendarData}
          today={today}
          availMap={availMap}
          setEditCell={setEditCell}
        />
      )}

      {/* Channex warning — fixed */}
      {!property.channex_property_id && (
        <div className="shrink-0 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-50/50 dark:bg-amber-500/5 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Channex not connected
            </p>
            <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">
              This property has no Channex ID. Changes will only be saved
              locally and won&apos;t be pushed to OTAs. Contact an admin to
              complete the Channex setup.
            </p>
          </div>
        </div>
      )}

      {/* Edit modal */}
      <EditModal
        open={!!editCell}
        onClose={() => setEditCell(null)}
        roomType={roomTypes.find((r) => r.id === editCell?.roomTypeId)}
        date={editCell?.date}
        currentValue={editCell?.value}
        channexPropertyId={property?.channex_property_id}
        propertyId={property?.id}
        onSaved={handleCellSaved}
      />
    </div>
  );
};
