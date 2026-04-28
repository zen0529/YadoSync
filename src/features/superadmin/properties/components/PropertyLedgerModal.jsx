import { X, Receipt, Download, Building2, User } from "lucide-react";
import { PlatformBadge } from "@/components/PlatformBadge";
import { MOCK_PROPERTY_LEDGER } from "@/data/constants";

export const PropertyLedgerModal = ({ property, onClose }) => {
  if (!property) return null;

  // Calculate totals from mock ledger
  const totalVolume = MOCK_PROPERTY_LEDGER.reduce((sum, b) => sum + b.volume, 0);
  const totalCommission = MOCK_PROPERTY_LEDGER.reduce((sum, b) => sum + b.commission, 0);
  const cap = 50000;
  const pct = Math.min((totalCommission / cap) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-background/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-border">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Commission Ledger</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/80">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {property.name}</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {property.ownerName}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cap Progress Section */}
        <div className="px-6 py-5 bg-muted/10 border-b border-border shrink-0">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Billing Cycle</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-amber-500">₱{totalCommission.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground font-medium">/ ₱50,000 cap</span>
              </div>
            </div>
            <div className="text-right">
              <button className="h-8 px-3 rounded-lg bg-background hover:bg-muted text-foreground border border-border flex items-center gap-2 transition-all shadow-sm text-xs font-semibold">
                <Download className="w-3.5 h-3.5" />
                Export Ledger
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold mb-1.5">
              <span className="text-amber-500">{Math.round(pct)}% of Cap Reached</span>
              <span className="text-muted-foreground/60">{MOCK_PROPERTY_LEDGER.length} bookings processed</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-out" 
                style={{ width: `${pct}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[auto_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-muted/50 backdrop-blur z-10 border-b border-border">
              <div className="w-[80px]">Booking ID</div>
              <div>Date</div>
              <div>Guest</div>
              <div>Platform</div>
              <div className="text-right">Volume</div>
              <div className="text-right">Commission (20%)</div>
            </div>
            
            <div className="divide-y divide-border/50 p-2">
              {MOCK_PROPERTY_LEDGER.map((b) => (
                <div key={b.id} className="grid grid-cols-[auto_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-4 py-3.5 items-center hover:bg-muted/50 transition-colors rounded-lg group">
                  <span className="w-[80px] text-xs font-mono text-muted-foreground/70 group-hover:text-foreground transition-colors">{b.id}</span>
                  <span className="text-sm text-muted-foreground">{b.date}</span>
                  <span className="text-sm font-medium text-foreground/90">{b.guest}</span>
                  <div><PlatformBadge platform={b.platform} /></div>
                  <span className="text-sm text-foreground/80 font-mono text-right">₱{b.volume.toLocaleString()}</span>
                  <span className="text-sm font-bold text-amber-500/90 font-mono text-right">+₱{b.commission.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-between items-center shrink-0">
          <p className="text-xs text-muted-foreground max-w-xl">
            This ledger is the source of truth for all commission calculations. Bookings cancelled prior to check-in are automatically deducted.
          </p>
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-background hover:bg-muted text-foreground font-semibold text-sm transition-all border border-border"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
