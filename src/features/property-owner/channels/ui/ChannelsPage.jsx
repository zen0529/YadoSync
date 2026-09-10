import { useState, useMemo } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { AlertCircle, CheckCircle2, XCircle, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMyProperty } from "../hooks/useMyProperty";
import { useConnections } from "../hooks/useConnections";
import { PLATFORMS } from "../constants/PLATFORMS";
import PlatformRow from "../components/PlatformRow";
import { ChannelPanel } from "../components/ChannelPanel";

export default function ChannelsPage() {
  const { user } = useAuth();
  const { property, loading: propLoading } = useMyProperty(user?.id);
  const {
    connections,
    loading: connLoading,
    refetch,
  } = useConnections(property?.id);

  const [notification, setNotification] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loading = propLoading || connLoading;

  const filteredPlatforms = useMemo(() => {
    if (!searchQuery.trim()) return PLATFORMS;
    const q = searchQuery.toLowerCase().trim();
    return PLATFORMS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const getConnection = (platformId) =>
    connections.find((c) => c.platform === platformId) || null;

  const handleConnect = (platform) => {
    setSelectedPlatform(platform);
    setPanelOpen(true);
  };

  const handlePanelSuccess = () => {
    setPanelOpen(false);
    notify("success", `${selectedPlatform?.name} connected and activated`);
    refetch();
  };

  const handlePanelClose = () => {
    setPanelOpen(false);
  };

  return (
    <>
      {/* Inline notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-700/50 dark:text-green-200"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700/50 dark:text-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          {notification.message}
        </div>
      )}

      {/* OTA Platforms */}
      <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)]">
        <div className="px-5 py-4 border-b border-white/20 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-foreground/85">
              OTA Platforms
            </h3>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Connect the platforms where your property is listed.
            </p>
          </div>
          <div className="relative shrink-0 w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels..."
              className="h-8 pl-9 pr-8 text-xs glass-filter-btn rounded-xl border-0 placeholder:text-muted-foreground/40 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
          </div>
        ) : !property ? (
          <div className="flex-1 flex items-center gap-2 px-5 py-10 text-sm text-muted-foreground/60">
            <AlertCircle className="w-4 h-4 shrink-0" />
            No property found. Please add a property in Settings before managing
            connections.
          </div>
        ) : filteredPlatforms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-sm text-muted-foreground/60">
            No channels found matching &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {filteredPlatforms.map((p) => (
              <PlatformRow
                key={p.id}
                platform={p}
                connection={getConnection(p.id)}
                property={property}
                onNotify={notify}
                onRefresh={refetch}
                onConnect={handleConnect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Channel panel — rendered at page level, outside the platform list */}
      <ChannelPanel
        open={panelOpen}
        platform={selectedPlatform}
        connection={getConnection(selectedPlatform?.id)}
        property={property}
        onSuccess={handlePanelSuccess}
        onClose={handlePanelClose}
      />
    </>
  );
}
