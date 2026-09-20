/**
 * src/features/superadmin/logs/components/LogPayloadModal.jsx
 *
 * Modal dialog for inspecting the structured JSON payload of a sync log entry.
 */

import { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function LogPayloadModal({ log, open, onOpenChange }) {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const payloadString = log.payload
    ? JSON.stringify(log.payload, null, 2)
    : "No payload data recorded.";

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between pr-4">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <span>Log Payload Details</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2.5 text-xs flex items-center gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </Button>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Type: <span className="font-semibold text-foreground">{log.type}</span> • ID:{" "}
            <span className="font-mono text-[11px]">{log.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-xl bg-muted/60 p-4 border border-border/80 overflow-hidden">
          <pre className="max-h-[360px] overflow-auto font-mono text-[11px] text-foreground/90 leading-relaxed whitespace-pre-wrap select-text">
            {payloadString}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
