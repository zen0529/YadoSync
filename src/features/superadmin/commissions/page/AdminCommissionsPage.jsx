import { useState } from "react";
import { Download, RefreshCw, AlertCircle, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommissionMetricCards } from "../components/CommissionMetricCards";
import { PropertyCommissionTable } from "../components/PropertyCommissionTable";
import { PropertyCommissionLedgerModal } from "../components/PropertyCommissionLedgerModal";
import { usePropertyCommissions } from "../hooks/usePropertyCommissions";

export const AdminCommissionsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("commission_desc");
  const [selectedProperty, setSelectedProperty] = useState(null);

  const {
    properties,
    stats,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = usePropertyCommissions({
    searchQuery,
    sortBy,
  });

  const handleExportCSV = () => {
    if (!properties || properties.length === 0) return;

    const headers = [
      "Property Name",
      "Location",
      "Owner Name",
      "Owner Email",
      "Commission Rate (%)",
      "Bookings Count",
      "Gross Volume",
      "Total Commission",
      "Currency",
      "Status",
    ];

    const rows = properties.map((p) => [
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.location || "").replace(/"/g, '""')}"`,
      `"${(p.ownerName || "").replace(/"/g, '""')}"`,
      `"${(p.ownerEmail || "").replace(/"/g, '""')}"`,
      p.commissionRate,
      p.bookingCount,
      p.totalVolume.toFixed(2),
      p.totalCommission.toFixed(2),
      p.currency,
      p.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `yadosync_property_commissions_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground leading-tight">
              Property Commissions
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Live Rollup
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor commission earnings, rate configurations, and booking volumes per property.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-foreground border border-white/20 flex items-center gap-1.5 shadow-sm text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            disabled={properties.length === 0}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {isError && (
        <div className="glass-card rounded-2xl p-4 border border-red-500/30 bg-red-500/10 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="h-7 text-xs border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-500/20"
          >
            Retry
          </Button>
        </div>
      )}

      {/* METRIC CARDS */}
      <CommissionMetricCards stats={stats} loading={isLoading} />

      {/* PROPERTY COMMISSIONS TABLE */}
      <PropertyCommissionTable
        properties={properties}
        loading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onSelectProperty={(property) => setSelectedProperty(property)}
      />

      {/* DRILL-DOWN LEDGER MODAL */}
      {selectedProperty && (
        <PropertyCommissionLedgerModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
};

export default AdminCommissionsPage;
