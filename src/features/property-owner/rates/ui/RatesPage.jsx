import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getRatePlansForOwner } from "../queries";
import { TrendingUp, Tag, CreditCard, Layers, Loader2, Building2 } from "lucide-react";

const SELL_MODE_LABEL = { per_room: "Per Room", per_person: "Per Person" };
const RATE_MODE_LABEL = { manual: "Manual", derived: "Derived" };

export const RatesPage = () => {
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [ratePlans, setRatePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setLoading(true);
      try {
        const result = await getRatePlansForOwner(user.id);
        setProperty(result.property);
        setRatePlans(result.ratePlans);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Group rate plans by room type
  const byRoomType = ratePlans.reduce((acc, plan) => {
    const rtId = plan.room_types?.id || "unknown";
    if (!acc[rtId]) acc[rtId] = { roomType: plan.room_types, plans: [] };
    acc[rtId].plans.push(plan);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground/90 leading-tight">Rate Plans</h2>
          <p className="text-xs text-muted-foreground/60">
            Pricing plans configured for your property
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
          <span className="text-sm text-muted-foreground">Loading rate plans…</span>
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-16 px-6 gap-3">
          <p className="text-sm font-medium text-red-500">Failed to load rate plans</p>
          <p className="text-xs text-muted-foreground/60">{error}</p>
        </div>
      ) : !property ? (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-16 px-6 gap-3">
          <div className="w-14 h-14 rounded-full bg-violet-100/60 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-violet-400/60" />
          </div>
          <p className="text-sm font-medium text-foreground/60">No property found</p>
          <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
            Your property needs to be set up before rate plans can be configured.
          </p>
        </div>
      ) : ratePlans.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-16 px-6 gap-3">
          <div className="w-14 h-14 rounded-full bg-violet-100/60 flex items-center justify-center">
            <Tag className="w-7 h-7 text-violet-400/60" />
          </div>
          <p className="text-sm font-medium text-foreground/60">No rate plans yet</p>
          <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
            Your property manager hasn't configured any rate plans yet.<br />
            Contact them to set up pricing for your room types.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-6 pb-6">
          {Object.values(byRoomType).map(({ roomType, plans }) => (
            <div key={roomType?.id || "unknown"}>
              {/* Room type header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                  <Layers className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-sm font-semibold text-foreground/80">
                  {roomType?.title || "Unknown Room Type"}
                </h3>
                <span className="text-[10px] text-muted-foreground/50 font-medium">
                  {plans.length} plan{plans.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Rate plan cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    className="glass-card rounded-2xl p-4 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Title + currency */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground/85">{plan.title}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold bg-violet-100/70 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full border border-violet-200/50">
                          {plan.currency}
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="border-t border-white/30 dark:border-white/10 pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3 text-muted-foreground/50" />
                          <span className="text-[11px] text-muted-foreground/60">Sell Mode</span>
                        </div>
                        <span className="text-[11px] font-semibold text-foreground/70">
                          {SELL_MODE_LABEL[plan.sell_mode] || plan.sell_mode}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-muted-foreground/50" />
                          <span className="text-[11px] text-muted-foreground/60">Rate Mode</span>
                        </div>
                        <span className="text-[11px] font-semibold text-foreground/70 capitalize">
                          {RATE_MODE_LABEL[plan.rate_mode] || plan.rate_mode}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

