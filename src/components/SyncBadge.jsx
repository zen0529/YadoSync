import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertTriangle } from "lucide-react";

const syncConfig = {
  synced:  { class: "bg-green-500/15 text-green-700 border-green-500/20 backdrop-blur-sm", icon: Check },
  pending: { class: "bg-amber-500/15 text-amber-700 border-amber-500/20 backdrop-blur-sm", icon: Clock },
  failed:  { class: "bg-red-500/15 text-red-700 border-red-500/20 backdrop-blur-sm", icon: AlertTriangle },
};

export const SyncBadge = ({ sync }) => {
  const config = syncConfig[sync] || syncConfig.pending;
  const Icon = config.icon;

  return (
    <Badge
      role="status"
      aria-label={`Sync status: ${sync}`}
      className={`text-[11px] font-semibold border rounded-lg px-2.5 py-0.5 flex items-center gap-1 w-fit ${config.class}`}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {sync.charAt(0).toUpperCase() + sync.slice(1)}
    </Badge>
  );
};
