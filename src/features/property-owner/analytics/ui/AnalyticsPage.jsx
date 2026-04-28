import { PlatformBadge } from "@/components/PlatformBadge";
import { MetricCard } from "@/features/property-owner/components/MetricCard";
import { EARNINGS_PER_BOOKING, MOCK_REVENUE_DATA, MOCK_PLATFORM_DATA } from "@/data/constants";
import { User, Building2, Globe, Coins, Download, ArrowUpRight } from "lucide-react";
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
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-xl">
        <p className="text-sm font-bold text-foreground mb-1">{label}</p>
        <p className="text-xs text-green-500 font-semibold flex items-center justify-between gap-4">
          <span>Revenue:</span>
          <span>₱{payload[0].value.toLocaleString()}</span>
        </p>
        {payload[1] && (
          <p className="text-xs text-blue-400 font-semibold flex items-center justify-between gap-4 mt-0.5">
            <span>Bookings:</span>
            <span>{payload[1].value}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const AnalyticsPage = () => {
  return (
    <div className="flex flex-col gap-5 pb-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground leading-tight">Analytics & Reports</h2>
          <p className="text-xs text-muted-foreground">Track your financial performance and OTA distribution.</p>
        </div>
        <button className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-foreground border border-white/20 flex items-center gap-2 transition-all shadow-sm text-sm font-semibold w-fit">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Top Row: Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard label="Total Gross Revenue" value="₱202,000" trend="+12% vs Last Week" sparkKey="earnings" />
        <MetricCard label="Average Daily Rate" value="₱6,400" trend="Across all properties" sparkKey="earnings" />
        
        {/* Commission Cap Card */}
        <div className="glass-card rounded-2xl p-5 group hover:bg-white/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/20 blur-2xl rounded-full group-hover:bg-green-500/30 transition-all duration-500 pointer-events-none" />
          
          <div className="flex flex-row justify-between items-center relative z-10">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold leading-none tracking-tight text-foreground/90">₱18.4k</span>
              <span className="text-xs text-muted-foreground/80 font-medium">/ ₱50k</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20 transition-transform duration-300 group-hover:scale-110">
              <Coins className="w-5 h-5 text-white" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground/70 font-medium mt-1 relative z-10">
            YadoSync Fee Cap
          </p>

          <div className="mt-2.5 relative z-10">
            <div className="flex justify-between text-[11px] font-semibold mb-1">
              <span className="text-green-600/80">36% to Cap</span>
              <span className="text-muted-foreground/70">0% fee after!</span>
            </div>
            <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: "36%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Revenue Over Time Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/20 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground/85">Revenue Over Time</h3>
              <p className="text-[10px] text-muted-foreground/60">Last 7 Days</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">+24%</span>
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_REVENUE_DATA} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
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
                  dataKey="revenue" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OTA Distribution Chart */}
        <div className="glass-card rounded-2xl p-5 border border-white/20 flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-foreground/85">Bookings by Platform</h3>
            <p className="text-[10px] text-muted-foreground/60">Distribution (Last 30 Days)</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_PLATFORM_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {MOCK_PLATFORM_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    itemStyle={{ color: "#fff", fontSize: "12px", fontWeight: "bold" }}
                    formatter={(value) => [`${value}%`, "Share"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-y-2 mt-2">
              {MOCK_PLATFORM_DATA.map((platform) => (
                <div key={platform.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: platform.fill }} />
                  <span className="text-[11px] text-muted-foreground/80 font-medium">{platform.name}</span>
                  <span className="text-[11px] font-bold text-foreground/90 ml-auto">{platform.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Detailed Financial Ledger */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/20">
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/20 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Coins className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground/85">Commission Ledger</h3>
              <p className="text-[10px] text-muted-foreground/60">Detailed breakdown of OTA payouts</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1.5fr_1fr_auto] gap-4 px-5 py-3 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider bg-black/20">
              <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Guest</div>
              <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Resort & Room</div>
              <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Platform</div>
              <div className="flex items-center justify-end gap-1.5"><Coins className="w-3 h-3" /> Commission</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-white/10">
              {EARNINGS_PER_BOOKING.map((e, i) => (
                <div key={i} className="grid grid-cols-[1fr_1.5fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-white/10 transition-colors">
                  <span className="text-sm font-semibold text-foreground/90">{e.guest}</span>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground/80">{e.resort}</span>
                    <span className="text-[10px] text-muted-foreground/60">ID: r-{Math.floor(Math.random() * 90 + 10)}</span>
                  </div>
                  <div>
                    <PlatformBadge platform={e.platform} />
                  </div>
                  <span className="text-sm font-bold text-red-400/90 text-right">- ₱{e.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
