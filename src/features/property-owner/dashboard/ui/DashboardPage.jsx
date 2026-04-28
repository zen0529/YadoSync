import { useState, useMemo } from "react";
import { PlatformBadge } from "@/components/PlatformBadge";
import { SyncBadge } from "@/components/SyncBadge";
import { MetricCard } from "../../components/MetricCard";
import { BookingCalendar } from "../components/BookingCalendar";
import { BookingDayModal } from "../components/BookingDayModal";
import { 
  MOCK_ARRIVALS,
  MOCK_DEPARTURES,
  MOCK_PLATFORM_DATA
} from "@/data/constants";
import { 
  ACTIVITY_BARS, 
  DEMO_BOOKINGS_BY_DATE, 
  DEMO_TOTAL_ROOMS
} from "../data/constants";
import {
  TrendingUp,
  User,
  Building2,
  Globe,
  RefreshCw,
  Plus,
  CalendarDays,
  Coins,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Cell as BarCell
} from "recharts";

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-md border border-white/20 p-2 rounded-lg shadow-xl text-[10px] font-bold text-white">
        {payload[0].value} Bookings
      </div>
    );
  }
  return null;
};

export const DashboardPage = () => {
  const [panelDate, setPanelDate] = useState(null);
  const [panelBookings, setPanelBookings] = useState([]);
  const [opTab, setOpTab] = useState("arrivals");

  const handleDateClick = (date, bookings) => {
    setPanelDate(date);
    setPanelBookings(bookings);
  };

  const handlePanelClose = () => {
    setPanelDate(null);
    setPanelBookings([]);
  };

  // Convert raw array to Recharts format
  const activityData = useMemo(() => {
    return ACTIVITY_BARS.map((val, i) => ({
      day: i + 1,
      value: val,
      fill: `rgba(34,197,94,${0.3 + (val / 100) * 0.7})`
    }));
  }, []);

  return (
  <>
    {/* QUICK ACTIONS & HEADER */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
      <div>
        <h2 className="text-lg font-bold text-foreground leading-tight">Good Morning, Admin</h2>
        <p className="text-xs text-muted-foreground">Here is what is happening with your properties today.</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-foreground border border-white/20 flex items-center gap-2 transition-all shadow-sm text-sm font-semibold">
          <CalendarDays className="w-4 h-4 text-orange-400" />
          <span className="hidden sm:inline">Block Dates</span>
        </button>
        <button className="h-9 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20 flex items-center gap-2 transition-all text-sm font-semibold">
          <Plus className="w-4 h-4" />
          <span>New Booking</span>
        </button>
      </div>
    </div>

    {/* METRIC CARDS */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      <MetricCard label="Total Bookings" value="24" trend="↑ +3 this week" sparkKey="bookings" />
      <MetricCard label="Today's Occupancy" value="85%" trend="+5% from yesterday" sparkKey="resorts" />
      
      {/* Commission Cap Card (Mini) */}
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

      <MetricCard label="Pending Bookings" value="2" trend="↑ +1 today" warn sparkKey="pending" />
    </div>

    {/* MAIN GRID — Operations + Calendar */}
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mb-4">

      {/* OPERATIONS PANEL (Arrivals / Departures) */}
      <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
        {/* Header Tabs */}
        <div className="px-5 pt-4 pb-0 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setOpTab("arrivals")}
              className={`pb-3 text-sm font-semibold transition-all relative ${opTab === "arrivals" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
            >
              Arrivals Today
              <span className="ml-2 bg-green-500/20 text-green-600 dark:text-green-400 py-0.5 px-2 rounded-full text-[10px]">{MOCK_ARRIVALS.length}</span>
              {opTab === "arrivals" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 rounded-t-full shadow-[0_-2px_8px_rgba(34,197,94,0.5)]" />}
            </button>
            <button 
              onClick={() => setOpTab("departures")}
              className={`pb-3 text-sm font-semibold transition-all relative ${opTab === "departures" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
            >
              Departures Today
              <span className="ml-2 bg-red-500/20 text-red-600 dark:text-red-400 py-0.5 px-2 rounded-full text-[10px]">{MOCK_DEPARTURES.length}</span>
              {opTab === "departures" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 rounded-t-full shadow-[0_-2px_8px_rgba(239,68,68,0.5)]" />}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-white/10 flex-1 overflow-y-auto min-h-[220px]">
          {(opTab === "arrivals" ? MOCK_ARRIVALS : MOCK_DEPARTURES).map((b, i) => (
            <div
              key={b.id}
              className="px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shadow-inner border border-white/10 ${opTab === "arrivals" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-400"}`}>
                  <span className="text-xs font-bold">{b.time.split(":")[0]}</span>
                  <span className="text-[8px] uppercase">{b.time.split(":")[1] === "00" ? "00" : b.time.split(":")[1]}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground/90">{b.guest}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground/70">{b.resort}</span>
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground/80">{b.room}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <PlatformBadge platform={b.platform} />
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/80 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOOKING CALENDAR */}
      <div className="min-h-[280px]">
        <BookingCalendar
          bookingsByDate={DEMO_BOOKINGS_BY_DATE}
          totalRooms={DEMO_TOTAL_ROOMS}
          month={3}
          year={2026}
          onDateClick={handleDateClick}
        />
      </div>
    </div>

    {/* BOTTOM ROW — Recharts & Action Center */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      {/* ACTION CENTER */}
      <div className="glass-card rounded-2xl overflow-hidden p-5 flex flex-col relative border border-white/20">
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-md shadow-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-foreground/85">Action Center</h3>
        </div>
        
        <div className="space-y-3 flex-1">
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3 cursor-pointer hover:bg-orange-500/20 transition-colors">
            <MessageSquare className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-orange-400 mb-0.5">3 Unread Messages</h4>
              <p className="text-[10px] text-foreground/70 leading-tight">Maria Santos is asking for an early check-in. Reply now to keep your response rate high.</p>
            </div>
          </div>
          
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 cursor-pointer hover:bg-red-500/20 transition-colors">
            <RefreshCw className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-red-400 mb-0.5">1 Sync Error</h4>
              <p className="text-[10px] text-foreground/70 leading-tight">Agoda connection for "Sunset Cove" failed. Click to re-authenticate.</p>
            </div>
          </div>
        </div>
      </div>

      {/* PLATFORM BREAKDOWN (Recharts Donut) */}
      <div className="glass-card rounded-2xl overflow-hidden p-5 flex flex-col border border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Globe className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-foreground/85">Platform Breakdown</h3>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_PLATFORM_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
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
                  itemStyle={{ color: "#fff", fontSize: "10px", fontWeight: "bold" }}
                  formatter={(value) => [`${value}%`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full grid grid-cols-2 gap-y-1.5 mt-2">
            {MOCK_PLATFORM_DATA.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
                <span className="text-[10px] text-muted-foreground/80">{p.name}</span>
                <span className="text-[10px] font-bold text-foreground/90 ml-auto">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIVITY CHART (Recharts Bar) */}
      <div className="glass-card rounded-2xl overflow-hidden p-5 flex flex-col border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/20">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground/85">Booking Activity</h3>
          </div>
          <span className="text-[10px] text-muted-foreground/50 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">March</span>
        </div>

        <div className="flex-1 w-full min-h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} content={<CustomBarTooltip />} />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {activityData.map((entry, index) => (
                  <BarCell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>

    {/* BOOKING DAY PANEL */}
    {panelDate && (
      <BookingDayModal
        date={panelDate}
        bookings={panelBookings}
        onClose={handlePanelClose}
      />
    )}
  </>
  );
};
