import { useState, useEffect, useCallback } from "react";
import { X, CalendarDays } from "lucide-react";
import { PlatformBadge } from "@/components/PlatformBadge";

const formatDisplayDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatFooterDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const BookingDayModal = ({ date, bookings = [], onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  if (!date || bookings.length === 0) return null;

  const totalCommission = bookings.reduce(
    (sum, b) => sum + (b.commissionAmount || 0),
    0
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col bg-background border-l border-border/50"
        style={{
          width: 360,
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <CalendarDays className="w-4 h-4 text-green-600" />
                <h3 className="text-base font-medium text-foreground/90">
                  {formatDisplayDate(date)}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground/60 ml-6">
                {bookings.length} booking{bookings.length !== 1 ? "s" : ""} · {bookings.length} room{bookings.length !== 1 ? "s" : ""} occupied
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center transition-colors hover:bg-secondary/80"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5">
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-3">
            Bookings on this date
          </p>

          <div className="space-y-2.5">
            {bookings.map((booking) => {
              const commissionRate =
                booking.totalAmount > 0
                  ? Math.round((booking.commissionAmount / booking.totalAmount) * 100)
                  : 0;

              return (
                <div
                  key={booking.id}
                  className="rounded-lg bg-secondary p-3 space-y-2.5"
                >
                  {/* Top row: guest + platform */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground/85">
                        {booking.guestName}
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        {booking.roomName}
                      </p>
                    </div>
                    <PlatformBadge platform={booking.platform} />
                  </div>

                  {/* Check-in / Check-out */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground/60">Check-in</span>
                      <span className="text-foreground/70 font-medium">
                        {formatShortDate(booking.checkIn)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground/60">Check-out</span>
                      <span className="text-foreground/70 font-medium">
                        {formatShortDate(booking.checkOut)}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground/60">Status</span>
                    {booking.status === "synced" || booking.status === "confirmed" ? (
                      <span className="text-[11px] font-semibold text-green-700 bg-green-500/15 border border-green-500/20 rounded-lg px-2.5 py-0.5">
                        Confirmed
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-500/15 border border-amber-500/20 rounded-lg px-2.5 py-0.5">
                        {booking.status
                          ? booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)
                          : "Pending"}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/50" />

                  {/* Commission */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground/60">
                      Commission ({commissionRate}%)
                    </span>
                    <span className="text-foreground/80 font-semibold">
                      ₱{(booking.commissionAmount || 0).toLocaleString()} / ₱{(booking.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/50 bg-secondary shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/60">
              Total commission — {formatFooterDate(date)}
            </span>
            <span className="text-[15px] font-medium text-green-600">
              ₱{totalCommission.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
