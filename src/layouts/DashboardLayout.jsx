import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { useActiveProperty } from "@/features/property-owner/context/PropertyContext";
import { PropertySelector } from "@/features/property-owner/components/PropertySelector";
import { supabase } from "@/lib/supabase";
import yadoLogo from "@/assets/logoWhite.png";
import {
  LayoutGrid,
  CalendarCheck,
  Building2,
  Globe,
  Settings,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  BedDouble,
  MessageSquare,
  BarChart3,
  Package,
  ChevronDown,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "inbox", label: "Inbox", icon: MessageSquare },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "rooms-and-rates", label: "Rooms & Rates", icon: BedDouble },
  { id: "analytics", label: "Analytics & Reports", icon: BarChart3 },
  { id: "channels", label: "Channels", icon: Globe },
];

const SidebarContent = ({
  collapsed,
  page,
  closeSidebar,
  connectionCount,
}) => {
  return (
    <>
      {/* BRAND */}
      <div
        className={`border-b border-white/15 flex items-center justify-between ${collapsed ? "px-2 py-4" : "px-5 py-5"}`}
      >
        {collapsed ? (
          <img
            src={yadoLogo}
            alt="YadoManagement"
            className="w-8 h-10 mx-auto"
          />
        ) : (
          <div className="flex items-center gap-2.5 ">
            <img
              src={yadoLogo}
              alt=""
              className="w-8 h-10 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="pt-3 text-[15px] font-extrabold text-white tracking-wide leading-none">
                YadoManagement
              </p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">
                Channel Manager
              </p>
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
      <nav
        className={`pt-5 pb-4 flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-3"}`}
        aria-label="Main navigation"
      >
        {!collapsed && (
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-2 mb-2">
            Menu
          </p>
        )}
        {NAV_ITEMS.map((n) => {
          const Icon = n.icon;
          const isActive = page === n.id;
          return (
            <Link
              key={n.id}
              to={`/dashboard/${n.id}`}
              onClick={closeSidebar}
              title={collapsed ? n.label : undefined}
              className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-3 py-2.5 rounded-xl text-sm mb-1 transition-all duration-200
                ${
                  isActive
                    ? "bg-white/20 text-white font-semibold shadow-sm"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && n.label}
              {!collapsed && n.id === "channels" && connectionCount > 0 && (
                <span className="ml-auto w-4 h-4 rounded-full bg-green-500/90 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                  {connectionCount > 9 ? "9+" : connectionCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
};

const DashboardLayoutInner = () => {
  const { user, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const location = useLocation();
  const page = location.pathname.split("/")[2] || "overview";
  const { selectedPropertyId } = useActiveProperty();
  const [connectionCount, setConnectionCount] = useState(0);

  useEffect(() => {
    if (!selectedPropertyId) {
      setConnectionCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { count } = await supabase
          .from("platform_connection")
          .select("id", { count: "exact", head: true })
          .eq("property_id", selectedPropertyId)
          .eq("connection_status", "connected");
        if (!cancelled) setConnectionCount(count || 0);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPropertyId, page]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("yadomanagement-sidebar") === "collapsed";
  });

  useEffect(() => {
    localStorage.setItem(
      "yadomanagement-sidebar",
      collapsed ? "collapsed" : "expanded",
    );
  }, [collapsed]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard flex h-screen overflow-hidden font-sans">
      {/* ANIMATED GRADIENT MESH BACKGROUND */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-gray-50 to-stone-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-green-200/40 dark:bg-green-900/30 blur-[120px] animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-[100px] animate-pulse"
          style={{ animationDuration: "12s" }}
        />
        <div
          className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-teal-100/30 dark:bg-teal-900/20 blur-[100px] animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        <div
          className="absolute bottom-[20%] left-[15%] w-[350px] h-[350px] rounded-full bg-cyan-100/20 dark:bg-cyan-900/15 blur-[80px] animate-pulse"
          style={{ animationDuration: "14s" }}
        />
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
          connectionCount={connectionCount}
        />
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* TOPBAR — frosted glass */}
        <header className="h-14 glass-topbar px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
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
              onClick={() => setCollapsed((c) => !c)}
              className="hidden lg:flex w-8 h-8 rounded-lg hover:bg-white/30 dark:hover:bg-white/10 items-center justify-center transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4.5 h-4.5 text-foreground/60" />
              ) : (
                <PanelLeftClose className="w-4.5 h-4.5 text-foreground/60" />
              )}
            </button>
            <h3 className="text-base font-semibold text-foreground/80">
              {NAV_ITEMS.find((n) => n.id === page)?.label ||
                (page === "settings" ? "Settings" : "")}
            </h3>
          </div>

          {/* Right Topbar actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Property Selector */}
            <PropertySelector />

            {/* Dark Mode Toggle (Circular icon button only) */}
            <button
              type="button"
              onClick={toggle}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="w-9 h-9 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-700 dark:text-zinc-300 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {dark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
              )}
            </button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 py-1 px-1 sm:pr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 group"
                  aria-label="User account menu"
                >
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-semibold overflow-hidden border border-violet-200 dark:border-violet-800/40 shrink-0 shadow-xs">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-200 max-w-[90px] sm:max-w-[140px] truncate hidden sm:inline-block">
                    {username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-400 group-hover:text-gray-600 dark:group-hover:text-zinc-200 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-xl">
                <div className="flex items-center gap-2.5 px-2.5 py-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold shrink-0">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate leading-tight">
                      {username}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild>
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center gap-2 px-2.5 py-2 cursor-pointer rounded-lg text-xs font-medium text-foreground hover:bg-muted/60"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => setShowSignOutDialog(true)}
                  className="flex items-center gap-2 px-2.5 py-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 rounded-lg text-xs font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* SIGN OUT CONFIRMATION DIALOG */}
        <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
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

        {/* CONTENT */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6"
          aria-label="Page content"
        >
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
