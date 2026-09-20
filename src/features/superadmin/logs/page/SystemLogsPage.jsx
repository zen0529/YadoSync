/**
 * src/features/superadmin/logs/page/SystemLogsPage.jsx
 *
 * Superadmin System Logs route page.
 * Orchestrates Sync Logs, Revision Failures, and Booking Recovery.
 */

import { useState } from "react";
import { RefreshCw, Search, History, AlertTriangle, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActiveFailuresAlert } from "../components/ActiveFailuresAlert";
import { RecoverBookingsModal } from "../components/RecoverBookingsModal";
import { SyncLogsTable } from "../components/SyncLogsTable";
import { RevisionFailuresTable } from "../components/RevisionFailuresTable";
import { useSyncLogs } from "../hooks/useSyncLogs";
import { useRevisionFailures } from "../hooks/useRevisionFailures";

const PAGE_SIZE = 50;

export default function SystemLogsPage() {
  const [activeTab, setActiveTab] = useState("sync_logs");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);

  // Queries
  const {
    logs,
    totalCount: totalSyncLogs,
    isLoading: isSyncLoading,
    isFetching: isSyncFetching,
    refetch: refetchSyncLogs,
  } = useSyncLogs({
    page,
    limit: PAGE_SIZE,
    typeFilter,
    search,
    startDate,
    endDate,
  });

  const {
    failures,
    totalCount: totalFailures,
    expiredCount,
    earliestFailureAt,
    isLoading: isFailuresLoading,
    isFetching: isFailuresFetching,
    refetch: refetchFailures,
  } = useRevisionFailures({
    page,
    limit: PAGE_SIZE,
    statusFilter,
    search,
    startDate,
    endDate,
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
  };

  const handleRefresh = () => {
    if (activeTab === "sync_logs") {
      refetchSyncLogs();
    } else {
      refetchFailures();
    }
  };

  const isRefreshing = isSyncFetching || isFailuresFetching;

  return (
    <div className="flex flex-col gap-5 pb-8 min-h-[calc(100vh-6rem)]">
      {/* HEADER / ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        {/* Date Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs text-foreground font-medium outline-none cursor-pointer"
              />
            </div>
            <span className="text-muted-foreground/30">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs text-foreground font-medium outline-none cursor-pointer"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
                className="ml-1 text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted transition-colors flex items-center"
                title="Clear dates"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Refresh & Recover Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 px-3 text-xs flex items-center gap-1.5 border-border cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setRecoveryModalOpen(true)}
            className="h-9 px-4 text-xs font-semibold flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md shadow-green-500/20 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Recover Missing Bookings</span>
          </Button>
        </div>
      </div>

      {/* ACTIVE EXPIRED FAILURES WARNING BANNER */}
      <ActiveFailuresAlert
        count={expiredCount}
        earliestFailureAt={earliestFailureAt}
        onTriggerRecovery={() => setRecoveryModalOpen(true)}
      />

      {/* TABS & SEARCH FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        {/* Tab Buttons */}
        <div className="flex bg-muted/60 p-1 rounded-xl border border-border w-fit">
          <button
            onClick={() => handleTabChange("sync_logs")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "sync_logs"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Sync Audit Logs</span>
            {totalSyncLogs > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-muted-foreground">
                {totalSyncLogs}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("revision_failures")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "revision_failures"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Booking Failures</span>
            {expiredCount > 0 ? (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500">
                {expiredCount}
              </span>
            ) : totalFailures > 0 ? (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-muted-foreground">
                {totalFailures}
              </span>
            ) : null}
          </button>
        </div>

        {/* Search & Sub-Filter */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md ml-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={
                activeTab === "sync_logs"
                  ? "Search logs by message, type..."
                  : "Search by booking ID, revision ID, error..."
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-9 pr-3 text-xs bg-card border-border rounded-xl"
            />
          </div>

          {activeTab === "sync_logs" ? (
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-xl border border-border bg-card text-xs text-foreground font-medium outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="booking_recovery">booking_recovery</option>
              <option value="booking_poller_permanent_failure">poller_failure</option>
            </select>
          ) : (
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-xl border border-border bg-card text-xs text-foreground font-medium outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="unresolved">Unresolved Only</option>
              <option value="resolved">Resolved Only</option>
            </select>
          )}
        </div>
      </div>

      {/* ACTIVE TABLE VIEW */}
      {activeTab === "sync_logs" ? (
        <SyncLogsTable
          logs={logs}
          totalCount={totalSyncLogs}
          page={page}
          limit={PAGE_SIZE}
          onPageChange={setPage}
          isLoading={isSyncLoading}
        />
      ) : (
        <RevisionFailuresTable
          failures={failures}
          totalCount={totalFailures}
          page={page}
          limit={PAGE_SIZE}
          onPageChange={setPage}
          isLoading={isFailuresLoading}
        />
      )}

      {/* RECOVER MISSING BOOKINGS MODAL */}
      <RecoverBookingsModal
        open={recoveryModalOpen}
        onOpenChange={setRecoveryModalOpen}
        earliestFailureAt={earliestFailureAt}
        expiredCount={expiredCount}
      />
    </div>
  );
}
