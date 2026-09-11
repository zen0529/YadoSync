import React, { useState, useRef, useEffect } from "react";
import { Search, Phone, ClipboardList, Check, X, Minus, Clock } from "lucide-react";

// Brand icons matching the reference image
export const ChannelBrandIcon = ({ type }) => {
  switch (type) {
    case "booking":
      return (
        <span className="w-4 h-4 rounded-md bg-[#003580] text-white font-black text-[9px] flex items-center justify-center shrink-0">
          B.
        </span>
      );
    case "airbnb":
      return (
        <span className="w-4 h-4 rounded-md bg-[#FF5A5F] text-white flex items-center justify-center shrink-0 p-0.5">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C9.5 2 7.7 3.8 7.7 6.3c0 2.2 1.3 4.2 3.1 5.2-.4.7-.8 1.4-1.2 2.2-1.8 3.5-3.6 7-3.6 8.3 0 1.1.9 2 2 2 1.3 0 2.6-1.1 4-3 1.4 1.9 2.7 3 4 3 1.1 0 2-.9 2-2 0-1.3-1.8-4.8-3.6-8.3-.4-.8-.8-1.5-1.2-2.2 1.8-1 3.1-3 3.1-5.2C16.3 3.8 14.5 2 12 2zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
          </svg>
        </span>
      );
    case "agoda":
      return (
        <span className="w-4 h-4 rounded-md bg-white border border-slate-200 text-[#00a699] flex items-center justify-center shrink-0">
          <div className="flex gap-[1px]">
            <span className="w-1 h-1 rounded-full bg-red-500"></span>
            <span className="w-1 h-1 rounded-full bg-yellow-400"></span>
            <span className="w-1 h-1 rounded-full bg-green-500"></span>
          </div>
        </span>
      );
    case "expedia":
      return (
        <span className="w-4 h-4 rounded-md bg-[#f59e0b] text-[#002244] font-black text-[9px] flex items-center justify-center shrink-0">
          E.
        </span>
      );
    case "trip":
      return (
        <span className="w-4 h-4 rounded-md bg-[#2577e3] text-white font-bold text-[9px] flex items-center justify-center shrink-0">
          T
        </span>
      );
    case "hotels":
      return (
        <span className="w-4 h-4 rounded-md bg-[#d32f2f] text-white font-bold text-[9px] flex items-center justify-center shrink-0">
          H
        </span>
      );
    case "direct":
      return (
        <span className="w-4 h-4 rounded-full bg-[#10b981] text-white font-bold text-[9px] flex items-center justify-center shrink-0">
          D
        </span>
      );
    case "walkin":
      return (
        <span className="w-4 h-4 rounded-full bg-[#8b5cf6] text-white font-bold text-[9px] flex items-center justify-center shrink-0">
          W
        </span>
      );
    case "phone":
      return (
        <span className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center shrink-0">
          <Phone className="w-2.5 h-2.5" />
        </span>
      );
    case "manual":
      return (
        <span className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center shrink-0">
          <ClipboardList className="w-2.5 h-2.5" />
        </span>
      );
    case "status-confirmed":
      return (
        <span className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center shrink-0">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </span>
      );
    case "status-pending":
      return (
        <span className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center shrink-0">
          <Clock className="w-2.5 h-2.5 stroke-[3]" />
        </span>
      );
    case "status-cancelled":
      return (
        <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
          <X className="w-2.5 h-2.5 stroke-[3]" />
        </span>
      );
    case "status-blocked":
      return (
        <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
          <Minus className="w-2.5 h-2.5 stroke-[3]" />
        </span>
      );
    default:
      return (
        <span className="w-4 h-4 rounded-full bg-slate-400 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
          •
        </span>
      );
  }
};

const INITIAL_OTAS = [
  { id: "booking", label: "Booking.com", icon: "booking" },
  { id: "airbnb", label: "Airbnb", icon: "airbnb" },
  { id: "agoda", label: "Agoda", icon: "agoda" },
  { id: "expedia", label: "Expedia", icon: "expedia" },
  { id: "trip", label: "Trip.com", icon: "trip" },
  { id: "hotels", label: "Hotels.com", icon: "hotels" },
];

const EXTRA_OTAS = [
  { id: "vrbo", label: "Vrbo", icon: "trip" },
  { id: "tripadvisor", label: "Tripadvisor", icon: "agoda" },
  { id: "google", label: "Google Hotels", icon: "booking" },
  { id: "traveloka", label: "Traveloka", icon: "trip" },
  { id: "tiket", label: "Tiket.com", icon: "expedia" },
  { id: "rakuten", label: "Rakuten Travel", icon: "hotels" },
  { id: "klook", label: "Klook", icon: "expedia" },
  { id: "ctrip", label: "Ctrip", icon: "trip" },
  { id: "despegar", label: "Despegar", icon: "booking" },
  { id: "hostelworld", label: "Hostelworld", icon: "hotels" },
  { id: "kayak", label: "Kayak", icon: "expedia" },
  { id: "trivago", label: "Trivago", icon: "agoda" },
  { id: "hopper", label: "Hopper", icon: "airbnb" },
];

const OTHER_SOURCES = [
  { id: "direct", label: "Direct", icon: "direct" },
  { id: "walkin", label: "Walk-in", icon: "walkin" },
  { id: "phone", label: "Phone", icon: "phone" },
  { id: "manual", label: "Manual", icon: "manual" },
];

const STATUS_OPTIONS = [
  { id: "confirmed", label: "Confirmed", icon: "status-confirmed" },
  { id: "pending", label: "Pending", icon: "status-pending" },
  { id: "cancelled", label: "Cancelled", icon: "status-cancelled" },
  { id: "blocked", label: "Blocked", icon: "status-blocked" },
];

export const ChannelsDropdown = ({
  open,
  onClose,
  selectedChannels = [],
  onApply,
}) => {
  const [search, setSearch] = useState("");
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef(null);

  // Initialize selected state with all channels and statuses
  const allChannelIds = [
    ...INITIAL_OTAS.map((o) => o.id),
    ...EXTRA_OTAS.map((o) => o.id),
    ...OTHER_SOURCES.map((s) => s.id),
  ];

  const allStatusIds = STATUS_OPTIONS.map((s) => s.id);

  const [checkedChannels, setCheckedChannels] = useState(() => {
    if (selectedChannels.length > 0 && !selectedChannels.includes("all")) {
      return new Set(selectedChannels);
    }
    return new Set(allChannelIds);
  });

  const [checkedStatuses, setCheckedStatuses] = useState(
    () => new Set(allStatusIds)
  );

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const allChannelsSelected = allChannelIds.every((id) =>
    checkedChannels.has(id)
  );

  const toggleAll = () => {
    if (allChannelsSelected) {
      setCheckedChannels(new Set());
    } else {
      setCheckedChannels(new Set(allChannelIds));
    }
  };

  const toggleChannel = (id) => {
    setCheckedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleStatus = (id) => {
    setCheckedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClear = () => {
    setCheckedChannels(new Set());
    setCheckedStatuses(new Set());
  };

  const handleApply = () => {
    onApply?.({
      channels: Array.from(checkedChannels),
      statuses: Array.from(checkedStatuses),
      allSelected: allChannelsSelected,
    });
    onClose();
  };

  if (!open) return null;

  // Filter lists by search query
  const query = search.toLowerCase().trim();
  const visibleInitialOtas = INITIAL_OTAS.filter((o) =>
    o.label.toLowerCase().includes(query)
  );
  const visibleExtraOtas = EXTRA_OTAS.filter((o) =>
    o.label.toLowerCase().includes(query)
  );
  const visibleOtherSources = OTHER_SOURCES.filter((s) =>
    s.label.toLowerCase().includes(query)
  );
  const visibleStatuses = STATUS_OPTIONS.filter((s) =>
    s.label.toLowerCase().includes(query)
  );

  const otasToDisplay = showMore
    ? [...visibleInitialOtas, ...visibleExtraOtas]
    : visibleInitialOtas;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[285px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[540px]"
    >
      {/* Popover Header */}
      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2.5">
        Channels
      </h4>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search channels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 outline-none placeholder:text-slate-400 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
        />
      </div>

      {/* Scrollable Channels List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
        {/* All Channels Option */}
        <label className="flex items-center gap-2.5 py-0.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allChannelsSelected}
            onChange={toggleAll}
            className="w-4 h-4 rounded text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            All channels
          </span>
        </label>

        {/* OTAs Section */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            OTAs
          </p>
          <div className="space-y-1.5">
            {otasToDisplay.map((ota) => (
              <label
                key={ota.id}
                className="flex items-center gap-2.5 py-0.5 cursor-pointer select-none hover:opacity-90"
              >
                <input
                  type="checkbox"
                  checked={checkedChannels.has(ota.id)}
                  onChange={() => toggleChannel(ota.id)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <ChannelBrandIcon type={ota.icon} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {ota.label}
                </span>
              </label>
            ))}
          </div>

          {/* Toggle More OTAs */}
          {!query && (
            <div className="mt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowMore((prev) => !prev)}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                {showMore ? "- Show less" : "+ 13 more"}
              </button>{" "}
              <span className="text-slate-400 font-normal">(20 total)</span>
            </div>
          )}
        </div>

        {/* Other Sources Section */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Other sources
          </p>
          <div className="space-y-1.5">
            {visibleOtherSources.map((source) => (
              <label
                key={source.id}
                className="flex items-center gap-2.5 py-0.5 cursor-pointer select-none hover:opacity-90"
              >
                <input
                  type="checkbox"
                  checked={checkedChannels.has(source.id)}
                  onChange={() => toggleChannel(source.id)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <ChannelBrandIcon type={source.icon} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {source.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status Section */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Status
          </p>
          <div className="space-y-1.5">
            {visibleStatuses.map((st) => (
              <label
                key={st.id}
                className="flex items-center gap-2.5 py-0.5 cursor-pointer select-none hover:opacity-90"
              >
                <input
                  type="checkbox"
                  checked={checkedStatuses.has(st.id)}
                  onChange={() => toggleStatus(st.id)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <ChannelBrandIcon type={st.icon} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {st.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={handleApply}
          className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
};
