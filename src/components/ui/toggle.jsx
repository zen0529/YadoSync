/**
 * Toggle — a complete, styled, labeled row with a custom toggle switch.
 * Designed for settings panels. Distinct from the headless switch.jsx primitive.
 *
 * Props:
 *  - label    {string}   — display text on the left
 *  - checked  {boolean}  — current on/off state
 *  - onChange {function} — called with the new boolean value
 */
export const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer py-2.5 px-3.5 rounded-xl hover:bg-white/20 dark:hover:bg-white/5 transition-colors group">
    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-all duration-200 flex-shrink-0 ${
        checked ? "bg-green-500" : "bg-muted dark:bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-4.5" : "translate-x-0"
        }`}
      />
    </button>
  </label>
);
