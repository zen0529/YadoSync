import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlatformBadgeIcon } from "./BookingTape";
import { PLATFORM_CONFIG } from "./tapeChartData";
import { Calendar, User, DollarSign, BedDouble, CheckCircle2, Hash } from "lucide-react";

export const BookingDetailModal = ({ booking, roomName, open, onOpenChange }) => {
  if (!booking) return null;

  const platformInfo = PLATFORM_CONFIG[booking.platform] || PLATFORM_CONFIG.direct;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlatformBadgeIcon platform={booking.platform} />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {platformInfo.label}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle2 className="w-3 h-3" />
              {booking.status || "Confirmed"}
            </span>
          </div>

          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white mt-3">
            {booking.guest}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Booking reference code: <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{booking.code || "RES-" + booking.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3.5 text-xs">
          {/* Room & Property */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BedDouble className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {roomName || "Assigned Room"}
                </p>
                <p className="text-[11px] text-slate-400">Standard Occupancy</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {booking.nights} {booking.nights === 1 ? "night" : "nights"}
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Check-in</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{booking.checkIn}</p>
              <span className="text-[10px] text-slate-400">From 2:00 PM</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Check-out</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{booking.checkOut}</p>
              <span className="text-[10px] text-slate-400">Until 12:00 PM</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Total Payout</span>
            </div>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {booking.amount || "₱15,000"}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex sm:justify-between items-center">
          <span className="text-[11px] text-slate-400">Synced via Channex Backbone</span>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
