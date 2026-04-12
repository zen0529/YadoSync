import { Sparkline } from "./Sparkline";
import { SPARK_DATA } from "../dashboard/data/constants";
import { CalendarCheck, Building2, Coins, AlertCircle } from "lucide-react";

const METRIC_ICONS = {
  bookings: {
    icon: CalendarCheck,
    gradient: "from-green-400 to-emerald-500",
    shadow: "shadow-green-500/20",
    glow: "bg-green-400/10",
  },
  resorts: {
    icon: Building2,
    gradient: "from-blue-400 to-indigo-500",
    shadow: "shadow-blue-500/20",
    glow: "bg-blue-400/10",
  },
  earnings: {
    icon: Coins,
    gradient: "from-amber-400 to-orange-500",
    shadow: "shadow-amber-500/20",
    glow: "bg-amber-400/10",
  },
  pending: {
    icon: AlertCircle,
    gradient: "from-rose-400 to-red-500",
    shadow: "shadow-rose-500/20",
    glow: "bg-rose-400/10",
  },
};

export const MetricCard = ({ label, value, trend, warn = false, sparkKey }) => {
  const meta = METRIC_ICONS[sparkKey] || METRIC_ICONS.bookings;
  const Icon = meta.icon;

  return (
    <div className="glass-card rounded-2xl p-5 group hover:bg-white/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5">
      <div className="flex flex-row justify-between items-center">
        {/* Value */}
        <p
          className={`text-3xl font-bold leading-none tracking-tight ${warn ? "text-rose-600" : "text-foreground/90"}`}
        >
          {value}
        </p>

        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg ${meta.shadow} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Label */}
      <p className="text-xs text-muted-foreground/70 font-medium mt-1">
        {label}
      </p>

      {/* Trend */}
      <p
        className={`text-xs mt-2 font-medium ${warn ? "text-rose-500/80" : "text-green-600/80"}`}
      >
        {trend}
      </p>

      {/* Sparkline */}
      <Sparkline data={SPARK_DATA[sparkKey]} warn={warn} />
    </div>
  );
};
