import { Badge } from "@/components/ui/badge";
import { PLATFORM_LABELS } from "@/data/constants";

const platformClass = {
  klook:   "bg-green-500/15 text-green-700 border-green-500/20 backdrop-blur-sm hover:bg-green-500/20",
  booking: "bg-blue-500/15 text-blue-700 border-blue-500/20 backdrop-blur-sm hover:bg-blue-500/20",
  agoda:   "bg-violet-500/15 text-violet-700 border-violet-500/20 backdrop-blur-sm hover:bg-violet-500/20",
};

export const PlatformBadge = ({ platform }) => (
  <Badge className={`text-[11px] font-semibold border rounded-lg px-2.5 py-0.5 ${platformClass[platform]}`}>
    {PLATFORM_LABELS[platform]}
  </Badge>
);
