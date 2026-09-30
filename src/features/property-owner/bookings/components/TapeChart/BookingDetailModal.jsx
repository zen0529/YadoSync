import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const BookingDetailModal = ({ booking, open, onOpenChange }) => {
  if (!booking) return null;
  const amount = booking.amount != null && booking.amount !== ""
    ? new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: booking.currency || "USD",
    }).format(Number(booking.amount))
    : "Not available";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{booking.guest}</DialogTitle>
          <DialogDescription>{booking.code || "Booking details"}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-muted-foreground">Room type</dt><dd className="font-medium">{booking.roomTypeTitle}</dd></div>
          <div><dt className="text-muted-foreground">Rate plan</dt><dd className="font-medium">{booking.ratePlanTitle}</dd></div>
          <div><dt className="text-muted-foreground">Check-in</dt><dd className="font-medium">{booking.checkIn}</dd></div>
          <div><dt className="text-muted-foreground">Check-out</dt><dd className="font-medium">{booking.checkOut}</dd></div>
          <div><dt className="text-muted-foreground">Source</dt><dd className="font-medium">{booking.booking.ota_name || "Direct"}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd className="font-medium capitalize">{booking.status}</dd></div>
          <div><dt className="text-muted-foreground">Amount</dt><dd className="font-medium">{amount}</dd></div>
        </dl>
        {booking.status === "modified" && (
          <p className="rounded-md border border-destructive p-3 text-xs text-destructive">
            This booking was modified. The calendar shows its last saved dates; review the OTA change before relying on this placement.
          </p>
        )}
        <Button type="button" onClick={() => onOpenChange(false)}>Close</Button>
      </DialogContent>
    </Dialog>
  );
};
