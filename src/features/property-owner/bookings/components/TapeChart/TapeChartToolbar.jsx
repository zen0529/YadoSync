import React, { useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChannelsDropdown } from "./ChannelsDropdown";

export const TapeChartToolbar = ({
  startDate,
  endDate,
  onPrev,
  onNext,
  viewMode,
  onViewModeChange,
  selectedChannels = ["all"],
  onChannelsApply,
  onAddClick,
}) => {
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);

  const views = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "3days", label: "3 Days" },
    { id: "today", label: "Today" },
  ];

  const formattedRange = `${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}`;
  const isFiltered = !selectedChannels.includes("all");

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3 relative z-30">
      {/* Date Navigation */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onPrev}
          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
          aria-label="Previous date range"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{formattedRange}</span>
        </div>

        <button
          onClick={onNext}
          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
          aria-label="Next date range"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* View Switcher & Channels Button */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5">
        {/* View Mode Segmented Control */}
        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs">
          {views.map((v) => {
            const isActive = viewMode === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onViewModeChange(v.id)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  isActive
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:cursor-pointer dark:hover:text-white"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        {/* Channels Dropdown Trigger & Popover */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChannelsOpen((prev) => !prev)}
            className={`h-8 px-3 hover:cursor-pointer rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-xs gap-1.5 transition-colors ${
              isChannelsOpen ? "border-green-500 ring-1 ring-blue-500/20" : ""
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Channels</span>
            {isFiltered && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
            )}
          </Button>

          <ChannelsDropdown
            open={isChannelsOpen}
            onClose={() => setIsChannelsOpen(false)}
            selectedChannels={selectedChannels}
            onApply={onChannelsApply}
          />
        </div>

        {/* New Booking Button */}
        <Button
          onClick={onAddClick}
          size="sm"
          className="h-8 bg-green-600 hover:bg-green-500 hover:cursor-pointer text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-semibold text-xs px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Booking</span>
        </Button>
      </div>
    </div>
  );
};
