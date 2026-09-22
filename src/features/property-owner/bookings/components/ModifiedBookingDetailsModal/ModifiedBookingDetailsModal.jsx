import React from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  Clock,
} from "lucide-react";

/**
 * Helper to safely format ISO date strings
 */
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const parsed = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
    return format(parsed, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
};

/**
 * Calculate night count safely
 */
const getNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  try {
    const dIn = typeof checkIn === "string" ? parseISO(checkIn) : new Date(checkIn);
    const dOut = typeof checkOut === "string" ? parseISO(checkOut) : new Date(checkOut);
    const diff = differenceInDays(dOut, dIn);
    return diff > 0 ? diff : 1;
  } catch {
    return null;
  }
};

export const ModifiedBookingDetailsModal = ({
  open,
  onOpenChange,
  bookings = [],
  selectedBookingId = null,
}) => {
  // If a specific booking was clicked from a notification, match on either id or channex_booking_id
  const matchingSelected = selectedBookingId
    ? bookings.find(
        (b) =>
          String(b.id) === String(selectedBookingId) ||
          String(b.channex_booking_id) === String(selectedBookingId),
      )
    : null;

  // If a specific booking was found, display it; otherwise list all modified bookings
  const displayList = matchingSelected
    ? [matchingSelected]
    : bookings.filter((b) => b.status === "modified");

  const isSingle = displayList.length === 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs tracking-wide uppercase">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {isSingle ? "OTA Booking Modification" : `OTA Modifications (${displayList.length})`}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {isSingle ? "Modified Booking Details" : "Modified Bookings Review"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {isSingle
              ? "This reservation was updated by the OTA channel. Review the stay dates, guest notes, and rate changes below."
              : "The following bookings received date, room, or price updates from the OTA. Review the changes below to verify your room assignments."}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No modified booking details found.
            </div>
          ) : (
            displayList.map((booking) => {
              const nights = getNights(booking.check_in, booking.check_out);
              const reservationCode =
                booking.ota_reservation_code ||
                booking.channex_booking_id ||
                `#${booking.id}`;

              return (
                <div
                  key={booking.id || booking.channex_booking_id}
                  className="rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-white dark:bg-slate-800/60 p-4.5 space-y-3.5 shadow-xs transition-all hover:border-amber-300"
                >
                  {/* Card Top Row: OTA Info & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                        {booking.ota_name || "OTA Channel"}
                      </span>
                      {booking.properties?.name && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{booking.properties.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                        <AlertTriangle className="w-3 h-3" />
                        Modified
                      </span>
                    </div>
                  </div>

                  {/* Guest & Reservation Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {booking.guest_name || "Guest Name Not Provided"}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 pl-6">
                        {booking.guest_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{booking.guest_email}</span>
                          </div>
                        )}
                        {booking.guest_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{booking.guest_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right pl-6 sm:pl-0">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                        Res Code
                      </span>
                      <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {reservationCode}
                      </p>
                    </div>
                  </div>

                  {/* Stay Dates & Financials Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* Stay Dates */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            Stay Period
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                          </p>
                        </div>
                      </div>
                      {nights && (
                        <span className="text-[11px] font-bold text-slate-500 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
                          {nights} {nights === 1 ? "night" : "nights"}
                        </span>
                      )}
                    </div>

                    {/* Updated Total Amount */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <DollarSign className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            Updated Payout
                          </span>
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {booking.currency || "USD"}{" "}
                            {Number(booking.amount || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                      {booking.commission_amount != null && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Comm: {booking.currency || "USD"}{" "}
                          {Number(booking.commission_amount).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Modification Changelog / Notes Callout */}
                  {booking.notes && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300 text-[11px]">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Modification Log</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 whitespace-pre-line text-[11px] leading-relaxed font-mono">
                        {booking.notes}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  {booking.updated_at && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Last updated {formatDate(booking.updated_at)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Auto-synced via Channex Backbone
          </span>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs px-5 rounded-lg"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModifiedBookingDetailsModal;

