import React from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveProperty } from "../context/PropertyContext";

export const PropertySelector = () => {
  const { properties, selectedProperty, selectedPropertyId, setSelectedPropertyId, isLoading } =
    useActiveProperty();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-9 px-3.5 rounded-xl bg-muted/40 animate-pulse border border-border/40">
        <div className="w-24 sm:w-36 h-3.5 rounded bg-muted-foreground/20" />
        <div className="w-3.5 h-3.5 rounded bg-muted-foreground/20" />
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-9 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-800 dark:text-zinc-100 text-xs sm:text-sm font-medium flex items-center justify-between gap-2.5 shadow-xs hover:border-gray-300 dark:hover:border-zinc-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          aria-label="Select active property"
        >
          <span className="truncate max-w-[120px] sm:max-w-[200px]">
            {selectedProperty?.name || "Select Property"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1.5 rounded-xl shadow-xl">
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Your Properties
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        {properties.map((prop) => {
          const isSelected = prop.id === selectedPropertyId;
          return (
            <DropdownMenuItem
              key={prop.id}
              onClick={() => setSelectedPropertyId(prop.id)}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium"
                  : "hover:bg-muted/60 text-foreground/80"
              }`}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs font-semibold truncate leading-tight">
                  {prop.name}
                </span>
                {prop.location && (
                  <span className="text-[10px] text-muted-foreground/70 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    {prop.location}
                  </span>
                )}
              </div>
              {isSelected && (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
