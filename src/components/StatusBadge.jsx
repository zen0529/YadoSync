import { Badge } from "@/components/ui/badge";

const statusClass = {
  active: "bg-green-100 text-green-700 hover:bg-green-100",
  setup:  "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
};

export const StatusBadge = ({ status }) => (
  <Badge className={`text-xs font-semibold ${statusClass[status]}`}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </Badge>
);
