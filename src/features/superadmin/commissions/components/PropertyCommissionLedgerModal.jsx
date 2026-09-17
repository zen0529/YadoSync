import { X, Building2, User, Coins, Calendar, Download, AlertCircle } from "lucide-react";
import { PlatformBadge } from "@/components/PlatformBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { usePropertyCommissionLedger } from "../hooks/usePropertyCommissionLedger";
import { formatCurrency, formatDate } from "../utils/commissionFormatters";
import { Button } from "@/components/ui/button";

export const PropertyCommissionLedgerModal = ({ property, onClose }) => {
  if (!property) return null;

  const {
    ledger = [],
    totalCommission,
    totalVolume,
    isLoading,
    isError,
    errorMessage,
  } = usePropertyCommissionLedger(property.id);

  // Fallback to property rollup if ledger hasn't completed or is 0
  const displayCommission =
    totalCommission > 0 ? totalCommission : property.totalCommission || 0;
  const displayVolume = totalVolume > 0 ? totalVolume : property.totalVolume || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-background/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">
                Commission Ledger
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground/80">
                <span className="flex items-center gap-1 font-medium text-foreground/90">
                  <Building2 className="w-3 h-3 text-emerald-500" /> {property.name}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {property.ownerName}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 dark:bg-white/5 border border-white/10">
                  Rate: {property.commissionRate}%
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Property Totals Highlight Bar */}
        <div className="px-6 py-3.5 bg-black/10 dark:bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground/70 tracking-wider">
                Total Earned Commission
              </p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(displayCommission, property.currency)}
              </p>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground/70 tracking-wider">
                Gross Booking Volume
              </p>
              <p className="text-sm font-semibold text-foreground/90">
                {formatCurrency(displayVolume, property.currency)}
              </p>
            </div>
            <div className="w-px h-8 bg-white/15" />
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground/70 tracking-wider">
                Commissionable Bookings
              </p>
              <p className="text-sm font-semibold text-foreground/90">
                {ledger.length > 0 ? ledger.length : property.bookingCount || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Ledger Entries Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
              Loading bookings ledger…
            </div>
          )}

          {!isLoading && isError && (
            <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
              <p className="text-sm font-medium text-foreground/90">{errorMessage}</p>
            </div>
          )}

          {!isLoading && !isError && ledger.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground/60">
              No commissionable bookings found for this property yet.
            </div>
          )}

          {!isLoading && !isError && ledger.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/5 dark:bg-white/5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    <th className="py-3 px-5">Guest / Code</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Stay Dates</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Gross Amount</th>
                    <th className="py-3 px-5 text-right">Commission Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {ledger.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-5">
                        <p className="font-semibold text-foreground/90">
                          {row.guest_name || "Guest"}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                          {row.ota_reservation_code || row.channex_booking_id || "—"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <PlatformBadge platform={row.ota_name} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-foreground/80">
                          <Calendar className="w-3 h-3 text-muted-foreground/60" />
                          <span>
                            {formatDate(row.check_in)} → {formatDate(row.check_out)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-foreground/80">
                        {formatCurrency(row.amount, row.currency)}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(row.commission_amount, row.currency)}
                        <p className="text-[10px] font-normal text-muted-foreground/60">
                          {property.commissionRate}% of gross
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/15 bg-white/5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground/70">
            Showing {ledger.length} record{ledger.length !== 1 ? "s" : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-4 text-xs rounded-xl bg-white/10 hover:bg-white/20 border-white/20 text-foreground"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
