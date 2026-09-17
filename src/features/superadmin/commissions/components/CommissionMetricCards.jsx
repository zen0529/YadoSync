import { Coins, TrendingUp, Building2, Percent } from "lucide-react";
import { formatCurrency, formatPercentage } from "../utils/commissionFormatters";

const StatCard = ({ icon: Icon, gradient, shadow, label, value, sub, loading }) => (
  <div className="glass-card rounded-2xl p-5 group hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 border border-white/20 relative overflow-hidden">
    <div className="flex items-center justify-between mb-3">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow} transition-transform duration-300 group-hover:scale-110`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div className="flex items-baseline gap-1">
      {loading ? (
        <span className="text-2xl font-bold text-foreground/40 animate-pulse">Loading…</span>
      ) : (
        <p className="text-3xl font-bold leading-none tracking-tight text-foreground/90">
          {value}
        </p>
      )}
    </div>
    <p className="text-xs text-muted-foreground/70 font-medium mt-1.5">{label}</p>
    {sub && <p className="text-[11px] mt-1 font-medium text-emerald-600 dark:text-emerald-400">{sub}</p>}
  </div>
);

export const CommissionMetricCards = ({ stats, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      <StatCard
        icon={Coins}
        gradient="from-amber-400 to-orange-500"
        shadow="shadow-amber-500/20"
        label="Total Platform Commission"
        value={formatCurrency(stats?.totalCommission || 0)}
        sub="Across all active properties"
        loading={loading}
      />
      <StatCard
        icon={TrendingUp}
        gradient="from-green-400 to-emerald-500"
        shadow="shadow-green-500/20"
        label="Gross Booking Volume"
        value={formatCurrency(stats?.totalVolume || 0)}
        sub={`${stats?.totalBookings || 0} confirmed booking${stats?.totalBookings !== 1 ? "s" : ""}`}
        loading={loading}
      />
      <StatCard
        icon={Building2}
        gradient="from-blue-400 to-indigo-500"
        shadow="shadow-blue-500/20"
        label="Properties Configured"
        value={stats?.propertiesWithCommission || 0}
        sub="With active commission rates"
        loading={loading}
      />
      <StatCard
        icon={Percent}
        gradient="from-violet-400 to-purple-500"
        shadow="shadow-violet-500/20"
        label="Average Commission Rate"
        value={formatPercentage(stats?.averageCommissionRate || 0)}
        sub="Platform average fee"
        loading={loading}
      />
    </div>
  );
};
