import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

/**
 * A reusable confirmation dialog for destructive delete actions.
 *
 * Props:
 *  - open        {boolean}   – controlled open state
 *  - onOpenChange{fn}        – called when the dialog requests an open-state change
 *  - title       {string}    – dialog heading  (default: "Delete?")
 *  - description {string}    – body copy shown below the heading
 *  - onConfirm   {fn}        – called when the user clicks the destructive action button
 *  - loading     {boolean}   – disables both buttons while an async operation is running
 *  - confirmLabel{string}    – label for the destructive button (default: "Delete")
 *  - cancelLabel {string}    – label for the cancel button     (default: "Cancel")
 */
export function DeleteDialog({
  open,
  onOpenChange,
  title = "Delete?",
  description,
  onConfirm,
  loading = false,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm gap-6">
        <AlertDialogHeader className="place-items-start text-left gap-2">
          <AlertDialogTitle className="text-base font-semibold tracking-tight">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="sm:justify-end gap-2">
          <AlertDialogCancel disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm?.();
            }}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Deleting…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
