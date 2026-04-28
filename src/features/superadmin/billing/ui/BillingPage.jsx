import { useState } from "react";
import { Download, Building2, Coins, Search, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { MOCK_SUPERADMIN_BILLING } from "@/data/constants";

export const BillingPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBilling = MOCK_SUPERADMIN_BILLING.filter(b => 
    b.property.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOutstanding = filteredBilling
    .filter(b => b.status !== "capped")
    .reduce((sum, b) => sum + b.commission, 0);

  const cappedProperties = filteredBilling.filter(b => b.status === "capped").length;

  return (
    <div className="flex flex-col gap-5 pb-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground leading-tight">Billing & Revenue</h2>
          <p className="text-xs text-muted-foreground">Manage property invoices and track the ₱50k commission cap.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-foreground border border-white/20 flex items-center gap-2 transition-all shadow-sm text-sm font-semibold">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-white/20 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Uncapped Revenue Tracking</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">₱{totalOutstanding.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Currently accruing across properties</p>
        </div>
        
        <div className="glass-card rounded-2xl p-5 border border-white/20 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capped Properties</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{cappedProperties}</p>
          <p className="text-[10px] text-green-500 font-semibold mt-1">Enjoying 0% fees this month</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/20 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue Accounts</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-500">
            {filteredBilling.filter(b => b.status === "overdue").length}
          </p>
          <p className="text-[10px] text-red-500/80 font-semibold mt-1">Action required</p>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="glass-filter-bar rounded-xl p-2 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search property or owner..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-white/10 border-none text-sm text-foreground focus:ring-1 focus:ring-green-500/50 outline-none placeholder:text-muted-foreground/50 transition-all"
          />
        </div>
      </div>

      {/* LEDGER TABLE */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/20">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr] gap-4 px-5 py-3 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider bg-black/20">
              <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Property / Owner</div>
              <div>Booking Volume</div>
              <div>Commission (20%)</div>
              <div>Cap Progress</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="divide-y divide-white/10">
              {filteredBilling.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No records found.</div>
              ) : (
                filteredBilling.map((b) => {
                  const pct = Math.min((b.commission / b.cap) * 100, 100);
                  const isCapped = b.status === "capped";
                  const isOverdue = b.status === "overdue";
                  
                  return (
                    <div key={b.id} className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr] gap-4 px-5 py-4 items-center hover:bg-white/5 transition-colors duration-200">
                      
                      {/* Property Info */}
                      <div>
                        <p className="text-sm font-semibold text-foreground/90">{b.property}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{b.owner}</p>
                      </div>

                      {/* Volume */}
                      <p className="text-sm text-foreground/80 font-mono">₱{b.volume.toLocaleString()}</p>

                      {/* Commission */}
                      <div>
                        <p className={`text-sm font-bold ${isCapped ? "text-green-500" : isOverdue ? "text-red-500" : "text-amber-500"}`}>
                          ₱{b.commission.toLocaleString()}
                        </p>
                        {isOverdue && <span className="text-[9px] font-bold bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded mt-1 inline-block uppercase">Overdue</span>}
                      </div>

                      {/* Cap Progress */}
                      <div>
                        <div className="flex justify-between text-[10px] font-semibold mb-1.5">
                          <span className={isCapped ? "text-green-500" : "text-muted-foreground/80"}>
                            {isCapped ? "100% CAPPED" : `${Math.round(pct)}% to cap`}
                          </span>
                          <span className="text-muted-foreground/50">₱50k Limit</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/20 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isCapped ? "bg-green-500" : "bg-gradient-to-r from-amber-400 to-orange-500"}`} 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors" title="View Details">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 text-xs font-semibold transition-colors">
                          Invoice
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
