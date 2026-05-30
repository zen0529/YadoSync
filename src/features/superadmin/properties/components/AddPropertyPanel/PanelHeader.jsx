import { Building2, X } from "lucide-react";

/**
 * PanelHeader — the fixed top bar of the Add Property slide-over panel.
 *
 * Props:
 *  - onClose {function} — called when the X button is clicked
 */
export const PanelHeader = ({ onClose, isEditing }) => (
  <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
        <Building2 className="w-4.5 h-4.5 text-white" />
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground leading-tight">
          {isEditing ? "Edit Property" : "Add Property"}
        </h2>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
          {isEditing ? "Update property details below" : "Fill in the property details below"}
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={onClose}
      className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);
