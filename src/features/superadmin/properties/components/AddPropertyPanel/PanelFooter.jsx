import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * PanelFooter — the always-visible bottom bar of the Add Property slide-over panel.
 *
 * Props:
 *  - tabs       {Array}    array of { id } tab descriptors (used for section count)
 *  - activeTab  {string}   currently active tab id (used for "X of N" counter)
 *  - submitting {boolean}  disables actions while the form is submitting
 *  - onClose    {function} called when Cancel is clicked
 */
export const PanelFooter = ({ tabs, activeTab, submitting, onClose, isEditing }) => (
  <div className="shrink-0 px-6 py-4 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3">
    <p className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
      <ChevronRight className="w-3 h-3" />
      {tabs.findIndex(t => t.id === activeTab) + 1} of {tabs.length} sections
    </p>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="h-9 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all border border-black/5 dark:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <Button
        type="submit"
        form="add-property-form"
        disabled={submitting}
        className="h-9 px-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-semibold shadow-lg shadow-green-500/25 border-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {submitting && (
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
        )}
        {submitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Property" : "Create Property")}
      </Button>
    </div>
  </div>
);
