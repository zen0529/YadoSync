/**
 * src/features/superadmin/logs/components/SyncLogsTable.jsx
 *
 * Table presentation for `sync_logs` records.
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileCode, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime, timeAgo, getStatusStyle } from "../utils/formatters";
import { LogPayloadModal } from "./LogPayloadModal";

export function SyncLogsTable({
  logs,
  totalCount,
  page,
  limit,
  onPageChange,
  isLoading,
}) {
  const [selectedLog, setSelectedLog] = useState(null);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-2">
        <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto" />
        <h4 className="text-sm font-semibold text-foreground">No sync logs found</h4>
        <p className="text-xs text-muted-foreground">
          Sync attempts and recovery operations will automatically appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4 w-[160px]">Timestamp</th>
                <th className="py-3 px-4 w-[100px]">Status</th>
                <th className="py-3 px-4 w-[180px]">Operation</th>
                <th className="py-3 px-4 w-[100px]">Platform</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4 text-right w-[110px]">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-medium text-foreground">{formatDateTime(log.created_at)}</div>
                    <div className="text-[10px] text-muted-foreground">{timeAgo(log.created_at)}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusStyle(
                        log.status,
                      )}`}
                    >
                      {log.status || "—"}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-foreground font-medium">
                    {log.type || "sync"}
                  </td>

                  <td className="py-3 px-4 text-muted-foreground capitalize">
                    {log.platform || "Channex"}
                  </td>

                  <td className="py-3 px-4 text-foreground/90 max-w-md truncate" title={log.message}>
                    {log.message || "—"}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {log.payload ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto"
                      >
                        <FileCode className="h-3.5 w-3.5" />
                        <span>View</span>
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
        <div>
          Showing <span className="font-semibold text-foreground">{logs.length}</span> of{" "}
          <span className="font-semibold text-foreground">{totalCount}</span> log entries
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-8 px-2.5 text-xs flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </Button>

          <span className="px-2 font-medium text-foreground">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-8 px-2.5 text-xs flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Payload Modal */}
      <LogPayloadModal
        log={selectedLog}
        open={Boolean(selectedLog)}
        onOpenChange={(val) => !val && setSelectedLog(null)}
      />
    </div>
  );
}
