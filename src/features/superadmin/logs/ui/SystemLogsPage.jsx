import { useState } from "react";
import { Download, Search, Terminal, Globe, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import { MOCK_SUPERADMIN_LOGS } from "@/data/constants";

const LOG_ICONS = {
  webhook: <Globe className="w-4 h-4 text-blue-400" />,
  sync: <RefreshCwIcon className="w-4 h-4 text-green-400" />,
  auth: <ShieldAlert className="w-4 h-4 text-purple-400" />
};

function RefreshCwIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

export const SystemLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredLogs = MOCK_SUPERADMIN_LOGS.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col gap-5 pb-6 h-[calc(100vh-8rem)]">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground leading-tight">System Logs</h2>
          <p className="text-xs text-muted-foreground">Audit trail for API webhooks, sync events, and errors.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-foreground border border-white/20 flex items-center gap-2 transition-all shadow-sm text-sm font-semibold">
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="glass-filter-bar rounded-xl p-2 flex flex-wrap items-center gap-3 shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/10 border-none text-sm text-foreground focus:ring-1 focus:ring-green-500/50 outline-none placeholder:text-muted-foreground/50 transition-all"
          />
        </div>
        
        <div className="flex bg-black/20 dark:bg-white/5 rounded-lg p-1">
          {['all', 'webhook', 'sync', 'auth'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${filterType === type ? 'bg-white/20 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* LOGS TERMINAL */}
      <div className="glass-card rounded-2xl border border-white/20 flex-1 flex flex-col overflow-hidden bg-black/40">
        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2 bg-black/20">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">yadomanagement/system.log</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-muted-foreground/50 text-center py-8">No logs found matching criteria.</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors group">
                <span className="text-muted-foreground/50 w-[70px] shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {log.time}
                </span>
                
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                  log.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {log.status}
                </span>

                <span className="flex items-center gap-1.5 shrink-0 w-[100px]">
                  {LOG_ICONS[log.type]}
                  <span className="text-foreground/70 capitalize">{log.type}</span>
                </span>

                <span className="text-blue-400 shrink-0 w-[120px] truncate" title={log.source}>
                  [{log.source}]
                </span>

                <span className="text-foreground/90 flex-1 min-w-[200px]">
                  {log.message}
                </span>
                
                <span className="text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  ID: {log.id}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
