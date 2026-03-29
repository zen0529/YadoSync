import { Badge } from "@/components/ui/badge";
import { PLATFORM_LABELS } from "@/data/constants";

const platformClass = {
  klook:   "bg-green-100 text-green-700 hover:bg-green-100",
  booking: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  agoda:   "bg-purple-100 text-purple-700 hover:bg-purple-100",
};

export const PlatformBadge = ({ platform }) => (
  <Badge className={`text-xs font-semibold ${platformClass[platform]}`}>
    {PLATFORM_LABELS[platform]}
  </Badge>
);
