import { useRef, useState, useEffect } from "react";
import cc from "currency-codes";
import { MapPin, Upload, Search } from "lucide-react";
import { AsYouType } from "libphonenumber-js";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { Field } from "@/components/ui/field";
import { inputCls } from "@/components/ui/input-cls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  COUNTRIES, CURRENCIES, TIMEZONES, PROPERTY_TYPES,
} from "../../constants/propertyConstants";

/**
 * BasicInfoTab — renders the combined "Basic Info & Location" tab.
 *
 * Props:
 *  - form                {object}   current form state
 *  - set                 {function} set(key, value) — top-level field setter
 *  - handleCountryChange {function} country cascade handler
 *  - handlePhoneChange   {function} formatted phone setter
 *  - logoData            {object}   { file, preview } draft logo state
 *  - setLogoData         {function} setter for the draft logo state
 */
export const BasicInfoTab = ({ form, set, handleCountryChange, handlePhoneChange, logoData, setLogoData, isEditing }) => {
  const logoInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState(form.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Sync searchQuery when the external form.address changes unexpectedly
  useEffect(() => {
    if (form.address && form.address !== searchQuery && !showSuggestions) {
      setSearchQuery(form.address);
    }
  }, [form.address]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        let countryParam = "";
        if (form.country) {
          countryParam = `&countrycodes=${form.country.toLowerCase()}`;
        }

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=5${countryParam}`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Nominatim search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery, form.country]);

  const handleSelectSuggestion = (place) => {
    setSearchQuery(place.display_name);
    setShowSuggestions(false);

    // Auto-fill form
    set("address", place.address?.road || place.name || "");
    set("city", place.address?.city || place.address?.town || place.address?.village || "");
    set("state", place.address?.state || place.address?.county || "");
    set("zip_code", place.address?.postcode || "");
    set("latitude", parseFloat(place.lat));
    set("longitude", parseFloat(place.lon));
  };

  const DraggableMarker = () => {
    const map = useMap();
    const markerRef = useRef(null);

    useEffect(() => {
      if (form.latitude && form.longitude) {
        map.flyTo([form.latitude, form.longitude], map.getZoom() || 15);
      }
    }, [form.latitude, form.longitude, map]);

    const handleDragEnd = async () => {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        set("latitude", lat);
        set("longitude", lng);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, { headers: { "Accept-Language": "en" } });
          const data = await res.json();
          if (data && data.address) {
            setSearchQuery(data.display_name || "");
            set("address", data.address.road || data.name || "");
            set("city", data.address.city || data.address.town || data.address.village || "");
            set("state", data.address.state || data.address.county || "");
            set("zip_code", data.address.postcode || "");
          }
        } catch (err) {
          console.error("Reverse geocode error", err);
        }
      }
    };

    if (!form.latitude || !form.longitude) return null;

    return (
      <Marker
        draggable={true}
        eventHandlers={{ dragend: handleDragEnd }}
        position={[form.latitude, form.longitude]}
        ref={markerRef}
      />
    );
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLogoData({ file, preview });
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Property Title + Status */}
      <div className="grid grid-cols-[2fr_1fr] gap-3">
        <Field label="Property Title">
          <input
            className={inputCls}
            placeholder="Demo Hotel"
            value={form.title}
            onChange={e => set("title", e.target.value)}
            required
          />
        </Field>

        <Field label="Status">
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              <SelectItem value="active" className="text-sm rounded-lg">Active</SelectItem>
              <SelectItem value="inactive" className="text-sm rounded-lg">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Property Type + Country */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Property Type">
          <Select value={form.property_type} onValueChange={v => set("property_type", v)}>
            <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              {PROPERTY_TYPES.map(t => (
                <SelectItem key={t} value={t} className="text-sm rounded-lg capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Country">
          <Select value={form.country} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              {COUNTRIES.map(c => (
                <SelectItem key={c.code} value={c.code} className="text-sm rounded-lg">{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Currency + Timezone + Commission (cascade targets) */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Currency">
          <Select value={form.currency} onValueChange={v => set("currency", v)}>
            <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30 w-64">
              {CURRENCIES.map(c => (
                <SelectItem key={c} value={c} className="text-sm rounded-lg">
                  <span className="font-semibold">{c}</span>
                  <span className="text-muted-foreground ml-1.5">— {cc.code(c)?.currency}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Timezone">
          <Select value={form.timezone} onValueChange={v => set("timezone", v)}>
            <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              {TIMEZONES.map(tz => (
                <SelectItem key={tz} value={tz} className="text-sm rounded-lg">{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

      </div>

      {/* Owner & Contact Info */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Owner Name">
          <input
            className={inputCls}
            type="text"
            placeholder="John Doe"
            value={form.owner_name || ""}
            onChange={e => set("owner_name", e.target.value)}
            required
          />
        </Field>

        <Field label="Contact Email">
          <input
            type="email"
            placeholder="hotel@example.io"
            value={form.email}
            onChange={e => set("email", e.target.value)}
            disabled={isEditing}
            className={`${inputCls} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </Field>

        <Field label="Owner Password">
          <input
            type="text"
            placeholder="Temp login password"
            value={form.password}
            onChange={e => set("password", e.target.value)}
            required={!isEditing}
            disabled={isEditing}
            className={`${inputCls} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </Field>

        <Field label="Phone Number">
          <input
            className={inputCls}
            type="tel"
            placeholder="+44 1234 567890"
            value={form.phone}
            onChange={e => handlePhoneChange(e.target.value)}
          />
        </Field>

        <Field label="Commission Rate (%)">
          <input
            className={inputCls}
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="15"
            value={form.commission_rate}
            onChange={e => set("commission_rate", parseFloat(e.target.value) || 0)}
            required
          />
        </Field>
      </div>

      {/* Logo + Website */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Logo">
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-white/20 bg-white/40 dark:bg-white/5 text-sm transition-all ${logoData?.preview ? "border-green-500/40 bg-green-500/5 text-green-600 dark:text-green-400" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Upload className="w-3.5 h-3.5" />
            {logoData?.preview ? logoData.file?.name : (form.logo_url ? "Change Logo…" : "Choose logo file…")}
          </button>
        </Field>
        <Field label="Website">
          <input
            className={inputCls}
            placeholder="https://..."
            value={form.website}
            onChange={e => set("website", e.target.value)}
          />
        </Field>
      </div>

      {/* Address & Location section */}
      <div className="pt-2">
        <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-6">
          Address & Location
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Address">
              <div className="relative">
                <input
                  className={inputCls}
                  placeholder="Start typing to search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    set("address", e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {isSearching && (
                  <Search className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-border rounded-xl shadow-xl overflow-hidden">
                    {suggestions.map((place) => (
                      <div
                        key={place.place_id}
                        className="px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer border-b border-border last:border-0 truncate"
                        onClick={() => handleSelectSuggestion(place)}
                        title={place.display_name}
                      >
                        {place.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <Field label="City">
              <input
                className={inputCls}
                placeholder="Demo Town"
                value={form.city}
                onChange={e => set("city", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="State / Province">
              <input
                className={inputCls}
                placeholder="Demo State"
                value={form.state}
                onChange={e => set("state", e.target.value)}
              />
            </Field>
            <Field label="ZIP / Postcode">
              <input
                className={inputCls}
                placeholder="SA23 2JH"
                value={form.zip_code}
                onChange={e => set("zip_code", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">
              <input
                className={inputCls}
                type="number"
                step="any"
                placeholder="51.5285582"
                value={form.latitude}
                onChange={e => set("latitude", e.target.value)}
              />
            </Field>
            <Field label="Longitude">
              <input
                className={inputCls}
                type="number"
                step="any"
                placeholder="-0.2416781"
                value={form.longitude}
                onChange={e => set("longitude", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Mini map preview */}
      <div className="pt-2 pb-4">
        {form.latitude && form.longitude ? (
          <div className="rounded-xl overflow-hidden border border-border h-64 relative z-0">
            <MapContainer
              center={[form.latitude, form.longitude]}
              zoom={15}
              scrollWheelZoom={false}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarker />
            </MapContainer>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-border h-36 flex items-center justify-center bg-neutral-50/50 dark:bg-white/5">
            <div className="text-center text-muted-foreground/70 px-4">
              <MapPin className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Search for an address to drop a pin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
