import { useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
  useMyProperty,
  useConnections,
} from "../hooks/useConnections";
import { PLATFORMS } from "../constants/PLATFORMS";
import PlatformRow from "../components/PlatformRow";

export default function ChannelsPage() {
  const { user } = useAuth();
  const { property, loading: propLoading } = useMyProperty(user?.id);
  const {
    connections,
    loading: connLoading,
    refetch,
  } = useConnections(property?.id);

  const [notification, setNotification] = useState(null);

  const loading = propLoading || connLoading;
  const connectedCount = connections.filter(
    (c) => c.connection_status === "connected",
  ).length;

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const getConnection = (platformId) =>
    connections.find((c) => c.platform === platformId) || null;

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

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <p className="text-sm text-muted-foreground/70 max-w-lg">
          Connect your OTA accounts through Channex. Once connected,
          availability and rates are synced automatically and bookings appear in
          your Bookings page in real time.
        </p>
        {!propLoading && property && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 bg-[#f0faf0] border-[#97C459] text-[#27500A] dark:bg-green-900/30 dark:border-green-700/50 dark:text-green-300">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            Channex connected
          </div>
        )}
      </div>

      {/* OTA Platforms */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/20 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground/85">
              OTA Platforms
            </h3>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Connect the platforms where your property is listed.
            </p>
          </div>
          {!loading && property && (
            <span className="text-xs text-muted-foreground/50 shrink-0 mt-0.5">
              {connectedCount} / {PLATFORMS.filter((p) => p.supported).length}{" "}
              connected
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
          </div>
        ) : !property ? (
          <div className="flex items-center gap-2 px-5 py-10 text-sm text-muted-foreground/60">
            <AlertCircle className="w-4 h-4 shrink-0" />
            No property found. Please add a property in Settings before managing
            connections.
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-1.5">
            {PLATFORMS.map((p) => (
              <PlatformRow
                key={p.id}
                platform={p}
                connection={getConnection(p.id)}
                property={property}
                onNotify={notify}
                onRefresh={refetch}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
