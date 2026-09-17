import {
  Building2,
  User,
  Coins,
  Percent,
  Search,
  ArrowUpDown,
  ReceiptText,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatPercentage } from "../utils/commissionFormatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PropertyCommissionTable = ({
  properties = [],
  loading,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onSelectProperty,
}) => {
  const totalCommission = properties.reduce((sum, p) => sum + (p.totalCommission || 0), 0);
  const totalVolume = properties.reduce((sum, p) => sum + (p.totalVolume || 0), 0);
  const totalBookings = properties.reduce((sum, p) => sum + (p.bookingCount || 0), 0);

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/20">
      {/* TABLE CONTROLS */}
      <div className="p-4 sm:px-5 sm:py-4 border-b border-white/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search property, owner, or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/70 hidden sm:inline flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-9 text-xs w-[180px] rounded-xl bg-white/10 dark:bg-white/5 border-white/20">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/20">
              <SelectItem value="commission_desc" className="text-xs">Highest Commission</SelectItem>
              <SelectItem value="commission_asc" className="text-xs">Lowest Commission</SelectItem>
              <SelectItem value="volume_desc" className="text-xs">Highest Gross Volume</SelectItem>
              <SelectItem value="bookings_desc" className="text-xs">Most Bookings</SelectItem>
              <SelectItem value="rate_desc" className="text-xs">Highest Rate (%)</SelectItem>
              <SelectItem value="name_asc" className="text-xs">Property Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLE CONTENT */}
      <div className="overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Header */}
          <div className="grid grid-cols-[1.5fr_1.2fr_0.7fr_0.7fr_1fr_1fr_auto] gap-3 px-5 py-3 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider bg-black/10 dark:bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Property</div>
            <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Owner</div>
            <div className="flex items-center gap-1.5"><Percent className="w-3.5 h-3.5" /> Rate</div>
            <div className="text-center">Bookings</div>
            <div className="text-right flex items-center justify-end gap-1"><TrendingUp className="w-3.5 h-3.5" /> Gross Volume</div>
            <div className="text-right flex items-center justify-end gap-1"><Coins className="w-3.5 h-3.5" /> Total Commission</div>
            <div className="text-right">Ledger</div>
          </div>

          {/* Body */}
          <div className="divide-y divide-white/10">
            {loading && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground/60 animate-pulse">
                Loading property commissions…
              </div>
            )}

            {!loading && properties.length === 0 && (
              <div className="px-5 py-12 text-center flex flex-col items-center justify-center">
                <ReceiptText className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-semibold text-foreground/80">No properties found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {searchQuery ? "Try refining your search query." : "No properties configured yet."}
                </p>
              </div>
            )}

            {!loading &&
              properties.map((p) => {
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1.5fr_1.2fr_0.7fr_0.7fr_1fr_1fr_auto] gap-3 px-5 py-3.5 items-center hover:bg-white/15 dark:hover:bg-white/5 transition-colors group"
                  >
                    {/* Property */}
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-semibold text-foreground/90 truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                        {p.location}
                      </p>
                    </div>

                    {/* Owner */}
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-medium text-foreground/80 truncate">
                        {p.ownerName}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">
                        {p.ownerEmail}
                      </p>
                    </div>

                    {/* Rate */}
                    <div>
                      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20 text-xs font-semibold px-2 py-0.5 rounded-lg">
                        {formatPercentage(p.commissionRate)}
                      </Badge>
                    </div>

                    {/* Booking Count */}
                    <div className="text-center">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/20 dark:bg-white/5 text-foreground/80">
                        {p.bookingCount}
                      </span>
                    </div>

                    {/* Gross Volume */}
                    <div className="text-right">
                      <span className="text-xs font-medium text-foreground/80">
                        {formatCurrency(p.totalVolume, p.currency)}
                      </span>
                    </div>

                    {/* Total Commission */}
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.totalCommission, p.currency)}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectProperty(p)}
                        className="h-8 px-2.5 text-xs rounded-xl bg-white/10 hover:bg-white/20 dark:bg-white/5 border-white/20 text-foreground flex items-center gap-1 shadow-sm transition-all"
                      >
                        <ReceiptText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                        <span className="hidden sm:inline">Ledger</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
                      </Button>
                    </div>
                  </div>
                );
              })}

            {/* Total Row */}
            {!loading && properties.length > 0 && (
              <div className="grid grid-cols-[1.5fr_1.2fr_0.7fr_0.7fr_1fr_1fr_auto] gap-3 px-5 py-4 items-center bg-black/15 dark:bg-white/10 border-t-2 border-emerald-500/30">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    Total ({properties.length} Properties)
                  </span>
                </div>
                <div />
                <div />
                <div className="text-center font-bold text-xs text-foreground/90">
                  {totalBookings}
                </div>
                <div className="text-right font-bold text-xs text-foreground/90">
                  {formatCurrency(totalVolume)}
                </div>
                <div className="text-right font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalCommission)}
                </div>
                <div />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
