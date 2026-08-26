import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useActiveProperty } from "@/features/property-owner/context/PropertyContext";
import { getRoomTypesAndRatePlans } from "../supabase";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Building2,
  Pencil,
  PackageOpen,
  AlertCircle,
} from "lucide-react";
import { InventoryGridView } from "../components/inventoryGridView";
import { InventoryCalendarView } from "../components/inventoryCalendarView";
import { AvailabilityEditModal } from "../components/AvailabilityEditModal";
import { InventoryPageHeader } from "../components/InventoryPageHeader";
import { useGetAvailabilities } from "../hooks/useGetAvailabilities";
import { useGetRestrictions } from "../hooks/useGetRestrictions";
import { Button } from "@/components/ui/button";
import {
  MONTH_NAMES,
  DOW_LABELS,
  toDateStr,
  firstOfMonth,
  daysInMonth,
  addDays,
} from "../utils/dateUtils";

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
        const { rooms, plans } =
          await getRoomTypesAndRatePlans(selectedPropertyId);

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
    const maxDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 12, 1),
    );
    const maxYear = maxDate.getUTCFullYear();
    const maxMonth = maxDate.getUTCMonth();
    if (viewYear > maxYear || (viewYear === maxYear && viewMonth >= maxMonth))
      return;
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
        <InventoryPageHeader
          property={property}
          view={view}
          onViewChange={setView}
        />
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
        <InventoryPageHeader
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
      <AvailabilityEditModal
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
