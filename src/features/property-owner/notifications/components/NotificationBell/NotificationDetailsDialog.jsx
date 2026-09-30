import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function NotificationDetailsDialog({ notification, onClose }) {
  return (
    <Dialog open={Boolean(notification)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{notification?.title || "Notification"}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap break-words pt-2 text-sm leading-relaxed">
            {notification?.message}
          </DialogDescription>
        </DialogHeader>
        <Button type="button" onClick={onClose}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
