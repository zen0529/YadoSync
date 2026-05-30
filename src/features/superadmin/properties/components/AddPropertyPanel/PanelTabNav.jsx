/**
 * PanelTabNav — the horizontal tab navigation bar for the Add Property panel.
 *
 * Props:
 *  - tabs        {Array}    array of { id, label, icon } tab descriptors
 *  - activeTab   {string}   currently active tab id
 *  - onTabChange {function} called with the new tab id when a tab is clicked
 */
export const PanelTabNav = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex gap-1 px-4 py-3 border-b border-black/5 dark:border-white/10 shrink-0 overflow-x-auto">
    {tabs.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        type="button"
        onClick={() => onTabChange(id)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
          activeTab === id
            ? "bg-green-500 text-white shadow-md shadow-green-500/25"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </button>
    ))}
  </div>
);
