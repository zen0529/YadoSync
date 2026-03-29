import { Badge } from "@/components/ui/badge";

const syncClass = {
  synced:  "bg-green-100 text-green-700 hover:bg-green-100",
  pending: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  failed:  "bg-red-100 text-red-700 hover:bg-red-100",
};

export const SyncBadge = ({ sync }) => (
  <Badge className={`text-xs font-semibold ${syncClass[sync]}`}>
    {sync.charAt(0).toUpperCase() + sync.slice(1)}
  </Badge>
);
