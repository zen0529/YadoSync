import cc from "currency-codes";
import { countries } from "country-data-list";
import { Building2, Settings2, FileText } from "lucide-react";

/* ─── Tabs ─── */
export const TABS = [
  { id: "basic",    label: "Basic Info", icon: Building2 },
  { id: "settings", label: "Settings",   icon: Settings2 },
  { id: "content",  label: "Content",    icon: FileText },
];

/* ─── Timezone defaults per country code ─── */
export const TZ_MAP = {
  GB: "Europe/London",      FR: "Europe/Paris",        DE: "Europe/Berlin",
  US: "America/New_York",   PH: "Asia/Manila",         SG: "Asia/Singapore",
  JP: "Asia/Tokyo",         AE: "Asia/Dubai",          AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",
};

/* ─── Static lists ─── */
export const TIMEZONES = [
  "Europe/London", "Europe/Paris", "Europe/Berlin", "America/New_York",
  "America/Los_Angeles", "America/Chicago", "Asia/Manila", "Asia/Singapore",
  "Asia/Tokyo", "Asia/Dubai", "Australia/Sydney", "Pacific/Auckland",
];

export const CURRENCIES = cc.codes();

export const COUNTRIES = countries.all
  .filter(c => c.status === "assigned")
  .map(c => ({
    code:      c.alpha2,
    label:     c.name,
    currency:  c.currencies?.[0] || "USD",
    phoneCode: c.countryCallingCodes?.[0] || "",
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const PROPERTY_TYPES = ["hotel", "hostel", "apartment", "resort", "villa", "guesthouse", "motel"];
export const MIN_STAY_TYPES = ["both", "arrival_only", "nightly"];

/* ─── Default form state ─── */
export const defaultForm = {
  title:         "",
  currency:      "GBP",
  email:         "",
  phone:         "",
  zip_code:      "",
  country:       "GB",
  state:         "",
  city:          "",
  address:       "",
  longitude:     "",
  latitude:      "",
  timezone:      "Europe/London",
  property_type: "hotel",
  logo_url:      "",
  website:       "",
  settings: {
    allow_availability_autoupdate_on_confirmation: true,
    allow_availability_autoupdate_on_modification: false,
    allow_availability_autoupdate_on_cancellation: false,
    min_stay_type:  "both",
    min_price:      "",
    max_price:      "",
    state_length:   500,
    cut_off_time:   "00:00:00",
    cut_off_days:   0,
    max_day_advance: "",
  },
  content: {
    description:           "",
    important_information: "",
    photos:                [],
  },
};
