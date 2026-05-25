import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlatformBadge } from "@/components/PlatformBadge";
import { SyncBadge } from "@/components/SyncBadge";
import { getAdminStats, getAllBookings } from "../queries";
import {
  ArrowRight,
  TrendingUp,
  Building2,
  Globe,
  RefreshCw,
  Coins,
  AlertCircle,
  AlertTriangle,
  TrendingDown,
  Info
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { Loader2, ArrowUpRight, User, Users, CalendarCheck } from "lucide-react";
import { MOCK_SUPERADMIN_EARNINGS, MOCK_SUPERADMIN_PROPERTY_BREAKDOWN, MOCK_SUPERADMIN_ALERTS } from "@/data/constants";

const PLATFORMS = [
  { key: "klook",   label: "Klook",       color: "#22c55e" },
  { key: "booking", label: "Booking.com", color: "#3b82f6" },
  { key: "agoda",   label: "Agoda",       color: "#8b5cf6" },
];

const ALERT_ICONS = {
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-xl">
        <p className="text-sm font-bold text-foreground mb-1">{label}</p>
        <p className="text-xs text-green-500 font-semibold flex items-center justify-between gap-4">
          <span>{payload[0].name}:</span>
          <span>
            {payload[0].name === "Earnings" || payload[0].name === "Commission" || payload[0].name === "Revenue" 
              ? `₱${payload[0].value.toLocaleString()}` 
              : payload[0].value}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

const StatCard = ({ icon: Icon, gradient, shadow, label, value }) => (
  <div className="glass-card rounded-2xl p-5 group hover:bg-white/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold leading-none tracking-tight text-foreground/90">{value}</p>
    <p className="text-xs text-muted-foreground/70 font-medium mt-1">{label}</p>
  </div>
);

export const AdminOverviewPage = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, bookingsData] = await Promise.all([
          getAdminStats(),
          getAllBookings(),
        ]);
        setStats(statsData);
        setBookings(bookingsData);
      } catch (err) {
        console.error("Failed to load admin overview:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        <span className="ml-2 text-sm text-muted-foreground">Loading overview...</span>
      </div>
    );
  }

  const totalCommission = bookings.reduce((sum, b) => sum + (b.commission_amount || 0), 0);

  const platformCounts = PLATFORMS.map((p) => {
    const count = bookings.filter((b) => b.platform === p.key).length;
    return { name: p.label, value: count, fill: p.color };
  });

  return (
    <div className="flex flex-col gap-5 pb-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground leading-tight">Good Morning, Superadmin</h2>
          <p className="text-xs text-muted-foreground">Here is the platform-wide performance across all properties.</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Building2} gradient="from-blue-400 to-indigo-500" shadow="shadow-blue-500/20" label="Active Properties" value={stats?.totalProperties ?? 0} />
        <StatCard icon={TrendingDown} gradient="from-zinc-400 to-slate-500" shadow="shadow-slate-500/20" label="Churned Properties" value={2} />
        <StatCard icon={AlertCircle} gradient="from-rose-400 to-red-500" shadow="shadow-rose-500/20" label="Overdue Accounts" value={1} />
        <StatCard icon={Coins} gradient="from-amber-400 to-orange-500" shadow="shadow-amber-500/20" label="Total Commission" value={`₱${totalCommission.toLocaleString()}`} />
      </div>

      {/* MIDDLE ROW: CHARTS */}
      <div className="grid grid-cols-1 gap-4">
        
        {/* Earnings Over Time Chart */}
        <div className="glass-card rounded-2xl p-5 border border-white/20 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground/85">Platform Commission Growth</h3>
              <p className="text-[10px] text-muted-foreground/60">Earnings over the last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">+18%</span>
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_SUPERADMIN_EARNINGS} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }}
                  tickFormatter={(val) => `₱${val/1000}k`}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="earnings" 
                  name="Commission"
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCommission)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* PROPERTY BREAKDOWN (BAR CHART) */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/20 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground/85">Top Properties by Earnings</h3>
            <p className="text-[10px] text-muted-foreground/60">Contribution to total commission</p>
          </div>
          
          <div className="flex-1 min-h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_SUPERADMIN_PROPERTY_BREAKDOWN} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} tickFormatter={(val) => `${val}%`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.8)" }} width={100} />
                <Tooltip 
                  cursor={{fill: "rgba(255,255,255,0.05)"}}
                  contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff", fontSize: "12px", fontWeight: "bold" }}
                  formatter={(value) => [`${value}%`, "Share"]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {MOCK_SUPERADMIN_PROPERTY_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SYSTEM HEALTH / ACTION CENTER */}
        <div className="glass-card rounded-2xl flex flex-col overflow-hidden border border-white/20">
          <div className="px-5 py-4 border-b border-white/20 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-md shadow-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground/85">Action Center</h3>
            </div>
            <span className="bg-red-500/20 text-red-500 py-0.5 px-2 rounded-full text-[10px] font-bold">
              {MOCK_SUPERADMIN_ALERTS.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[300px]">
            <div className="p-3 flex flex-col gap-2">
              {MOCK_SUPERADMIN_ALERTS.map((alert) => (
                <div key={alert.id} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    {ALERT_ICONS[alert.type]}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground/90">{alert.title}</h4>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed">
                      {alert.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
