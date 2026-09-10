import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MappingFooter = ({
  saving = false,
  saveSuccess = false,
  saveError = null,
  allRatesMapped = false,
  mappedRatesCount = 0,
  totalRatesCount = 0,
  onSave,
}) => {
  return (
    <div className="shrink-0 pt-4 mt-2 border-t border-black/5 dark:border-white/10 flex flex-col gap-2">
      {saveError && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">{saveError}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground/60">
          {saveSuccess ? (
            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connection activated &amp; mappings saved!
            </span>
          ) : (
            <span>
              Map room types and rate plans to sync availability and pricing
            </span>
          )}
        </div>

        <Button
          type="button"
          onClick={onSave}
          disabled={saving || !allRatesMapped}
          className="h-9 px-4 text-xs bg-green-500 hover:bg-green-600 text-white shadow-sm shadow-green-500/20 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              Connecting &amp; Saving…
            </>
          ) : (
            `Save & Connect (${mappedRatesCount}/${totalRatesCount})`
          )}
        </Button>
      </div>
    </div>
  );
};

export default MappingFooter;
