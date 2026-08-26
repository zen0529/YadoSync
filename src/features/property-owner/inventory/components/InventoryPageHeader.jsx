import { CalendarDays, LayoutGrid, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const InventoryPageHeader = ({
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
