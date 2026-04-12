import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RESORTS, TIMEFRAMES } from "@/data/constants";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import yadoLogo from "@/assets/logoWhite.png";
import {
  LayoutGrid,
  CalendarCheck,
  Building2,
  Coins,
  Settings,
  LogOut,
  Download,
  CalendarDays,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview",  label: "Overview",  icon: LayoutGrid },
  { id: "bookings",  label: "Bookings",  icon: CalendarCheck },
  // { id: "resorts",   label: "Resorts",   icon: Building2 },
  { id: "earnings",  label: "Earnings",  icon: Coins },
];


const SidebarContent = ({ collapsed, page, closeSidebar, username, signOut }) => {
  const { dark, toggle } = useTheme();

  return (
    <>
      {/* BRAND */}
      <div className={`border-b border-white/15 flex items-center justify-between ${collapsed ? "px-2 py-4" : "px-5 py-5"}`}>
        {collapsed ? (
          <img src={yadoLogo} alt="YadoManagement" className="w-8 h-10 mx-auto" />
        ) : (
          <div className="flex items-center gap-2.5 ">
            <img src={yadoLogo} alt="" className="w-8 h-10 shrink-0" aria-hidden="true" />
            <div >
              <p className="pt-3 text-[15px] font-extrabold text-white tracking-wide leading-none">YadoManagement</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Channel Manager</p>
            </div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={closeSidebar}
            className="lg:hidden w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        )}
      </div>

      {/* NAV */}
      <nav className={`pt-5 flex-1 ${collapsed ? "px-2" : "px-3"}`} aria-label="Main navigation">
        {!collapsed && <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-2 mb-2">Menu</p>}
        {NAV_ITEMS.map(n => {
          const Icon = n.icon;
          const isActive = page === n.id;
          return (
            <Link key={n.id} to={`/dashboard/${n.id}`} onClick={closeSidebar}
              title={collapsed ? n.label : undefined}
              className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-3 py-2.5 rounded-xl text-sm mb-1 transition-all duration-200
                ${isActive
                  ? "bg-white/20 text-white font-semibold shadow-sm"
                  : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && n.label}
            </Link>
          );
        })}

        {!collapsed && <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-2 mb-2 mt-5">Support</p>}
        <Link to="/dashboard/settings" onClick={closeSidebar}
          title={collapsed ? "Settings" : undefined}
          className={`w-full flex items-center ${collapsed ? "justify-center mt-4" : "gap-2.5"} px-3 py-2.5 rounded-xl text-sm transition-all duration-200
            ${page === "settings"
              ? "bg-white/20 text-white font-semibold shadow-sm"
              : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && " Settings"}
        </Link>
      </nav>

      {/* DARK MODE TOGGLE */}
      <div className={`border-t border-white/15 ${collapsed ? "px-2 py-3" : "px-4 py-3"}`}>
        <button
          onClick={toggle}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-3 py-2.5 rounded-xl text-sm transition-all duration-200
            text-white/60 hover:bg-white/10 hover:text-white`}
        >
          {dark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && (dark ? "Light Mode" : "Dark Mode")}
        </button>
      </div>

      {/* USER / SIGN OUT */}
      <div className={`border-t border-white/15 flex items-center ${collapsed ? "justify-center px-2 py-4" : "gap-2.5 px-4 py-4"}`}>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md shadow-black/10">
          {username.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/90 truncate">{username}</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-[10px] text-white/50 hover:text-red-300 transition-colors flex items-center gap-1">
                  <LogOut className="w-2.5 h-2.5" /> Sign out
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to sign out of YadoManagement?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={signOut}>
                    Sign out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </>
  );
};

const DashboardLayoutInner = () => {
  const { user, signOut } = useAuth();
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "User";
  const location = useLocation();
  const page = location.pathname.split("/")[2] || "overview";
  const isSettingsPage = page === "settings";
  const [timeframe, setTimeframe]         = useState("All-time");
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateFrom, setDateFrom]           = useState("");
  const [dateTo, setDateTo]               = useState("");
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [collapsed, setCollapsed]         = useState(() => {
    return localStorage.getItem("yadomanagement-sidebar") === "collapsed";
  });

  useEffect(() => {
    localStorage.setItem("yadomanagement-sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard flex h-screen overflow-hidden font-sans">

      {/* ANIMATED GRADIENT MESH BACKGROUND */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-gray-50 to-stone-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-green-200/40 dark:bg-green-900/30 blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-[100px] animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-teal-100/30 dark:bg-teal-900/20 blur-[100px] animate-pulse" style={{ animationDuration: "10s" }} />
        <div className="absolute bottom-[20%] left-[15%] w-[350px] h-[350px] rounded-full bg-cyan-100/20 dark:bg-cyan-900/15 blur-[80px] animate-pulse" style={{ animationDuration: "14s" }} />
      </div>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR — frosted glass */}
      <aside
        className={`${collapsed ? "w-16" : "w-[230px]"} shrink-0 glass-sidebar flex flex-col z-40
          fixed inset-y-0 left-0
          lg:static
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <SidebarContent
          collapsed={collapsed}
          page={page}
          closeSidebar={closeSidebar}
          username={username}
          signOut={signOut}
        />
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">

        {/* TOPBAR — frosted glass */}
        <header className="h-14 glass-topbar px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 rounded-lg hover:bg-white/30 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5 text-foreground/70" />
            </button>
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(c => !c)}
              className="hidden lg:flex w-8 h-8 rounded-lg hover:bg-white/30 dark:hover:bg-white/10 items-center justify-center transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed
                ? <PanelLeftOpen className="w-4.5 h-4.5 text-foreground/60" />
                : <PanelLeftClose className="w-4.5 h-4.5 text-foreground/60" />
              }
            </button>
            <h3 className="text-base font-semibold text-foreground/80">
              {NAV_ITEMS.find(n => n.id === page)?.label || (page === "settings" ? "Settings" : "")}
            </h3>
          </div>
          {!isSettingsPage && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-muted-foreground/70 hidden sm:inline">{timeframe}</span>
              <Button size="sm" className="bg-green-500/90 hover:bg-green-600 text-white h-8 text-xs rounded-lg shadow-md shadow-green-500/20 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-green-500/30">
                <Download className="w-3.5 h-3.5 mr-1.5" /> <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          )}
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" aria-label="Page content">

          {/* FILTERS — frosted glass pill bar */}
          {!isSettingsPage && (
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <div className="flex glass-filter-bar rounded-xl overflow-hidden overflow-x-auto" role="group" aria-label="Timeframe filter">
                {TIMEFRAMES.map((t, i) => (
                  <div key={t} className="flex items-center">
                    {i > 0 && <div className="w-px bg-white/30 dark:bg-white/10 my-1.5" aria-hidden="true" />}
                    <button
                      onClick={() => { setTimeframe(t); setShowDateRange(false); }}
                      aria-pressed={timeframe === t}
                      className={`px-3 sm:px-4 py-2 text-xs font-medium transition-all duration-200 whitespace-nowrap
                        ${timeframe === t
                          ? "bg-green-500/90 text-white font-semibold shadow-sm"
                          : "text-muted-foreground/80 hover:text-green-600 dark:hover:text-green-400 hover:bg-white/30 dark:hover:bg-white/10"}`}>
                      {t}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setShowDateRange(v => !v); if (!showDateRange) setTimeframe("Custom range"); }}
                className="glass-filter-btn h-9 px-3.5 rounded-xl text-xs font-medium text-muted-foreground/80 hover:text-green-600 dark:hover:text-green-400 hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-200 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Date Range</span>
              </button>

              {showDateRange && (
                <div className="flex items-center gap-2 glass-filter-btn rounded-xl px-3 py-1.5">
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    aria-label="Start date"
                    className="bg-transparent border-none text-xs text-foreground/80 outline-none w-28 cursor-pointer" />
                  <span className="text-muted-foreground/60 text-xs" aria-hidden="true">to</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    aria-label="End date"
                    className="bg-transparent border-none text-xs text-foreground/80 outline-none w-28 cursor-pointer" />
                </div>
              )}

              <Select>
                <SelectTrigger className="h-9 text-xs w-36 glass-filter-btn rounded-xl border-0">
                  <SelectValue placeholder="Platform: All" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown rounded-xl border-white/30">
                  <SelectItem value="all" className="text-xs rounded-lg">Platform: All</SelectItem>
                  <SelectItem value="klook" className="text-xs rounded-lg">Klook</SelectItem>
                  <SelectItem value="booking" className="text-xs rounded-lg">Booking.com</SelectItem>
                  <SelectItem value="agoda" className="text-xs rounded-lg">Agoda</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="h-9 text-xs w-40 glass-filter-btn rounded-xl border-0">
                  <SelectValue placeholder="Resort: All" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown rounded-xl border-white/30">
                  <SelectItem value="all" className="text-xs rounded-lg">Resort: All</SelectItem>
                  {RESORTS.map(r => (
                    <SelectItem key={r.name} value={r.name} className="text-xs rounded-lg">{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* PAGES */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const DashboardLayout = () => (
  <ThemeProvider>
    <DashboardLayoutInner />
  </ThemeProvider>
);
