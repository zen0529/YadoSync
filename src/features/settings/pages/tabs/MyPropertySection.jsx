import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  Loader2,
  Check,
  AlertTriangle,
  Pencil,
  X,
  Plus,
} from "lucide-react";
import { fetchMyProperty, updateMyProperty } from "../../queries";
import { AddPropertyModal } from "./AddPropertyModal";

const Alert = ({ type, message, onDismiss }) => {
  if (!message) return null;
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm mb-5 ${
        isSuccess
          ? "bg-green-50/80 text-green-700 border border-green-200/60"
          : "bg-red-50/80 text-red-700 border border-red-200/60"
      }`}
    >
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <Check className="w-4 h-4 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 shrink-0" />
        )}
        <span>{message}</span>
      </div>
      <button
        onClick={onDismiss}
        className="ml-3 font-bold hover:opacity-70 text-lg leading-none"
        aria-label="Dismiss alert"
      >
        &times;
      </button>
    </div>
  );
};

const SectionHeader = ({ title, description, children }) => (
  <div className="mb-6 flex items-start justify-between">
    <div>
      <h2 className="text-base font-semibold text-foreground mb-0.5">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground/70">{description}</p>
      )}
    </div>
    {children}
  </div>
);

const FIELDS = [
  { key: "name", label: "Property Name", icon: Building2, type: "text", placeholder: "e.g. Casa del Sol Beach Resort" },
  { key: "location", label: "Location", icon: MapPin, type: "text", placeholder: "e.g. Boracay, Malay, Aklan" },
  { key: "ownerName", label: "Owner Name", icon: User, type: "text", placeholder: "e.g. Maria Santos" },
  { key: "ownerPhone", label: "Owner Phone", icon: Phone, type: "tel", placeholder: "e.g. +63 917 123 4567" },
  { key: "ownerEmail", label: "Owner Email", icon: Mail, type: "email", placeholder: "e.g. maria@example.com" },
];

const mapToForm = (data) => ({
  name: data?.name || "",
  location: data?.location || "",
  ownerName: data?.owner_name || "",
  ownerPhone: data?.owner_phone || "",
  ownerEmail: data?.owner_email || "",
});

export const MyPropertySection = ({ userId }) => {
  const [property, setProperty] = useState(null);
  const [form, setForm] = useState({ name: "", location: "", ownerName: "", ownerPhone: "", ownerEmail: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchMyProperty(userId)
      .then((data) => {
        setProperty(data);
        setForm(mapToForm(data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleCancel = () => {
    setForm(mapToForm(property));
    setEditing(false);
    setAlert({ type: "", message: "" });
  };

  const handleSave = async () => {
    setSaving(true);
    setAlert({ type: "", message: "" });
    try {
      const updated = await updateMyProperty(userId, form);
      setProperty(updated);
      setForm(mapToForm(updated));
      setEditing(false);
      setAlert({ type: "success", message: "Property details updated successfully." });
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <SectionHeader
          title="My Property"
          description="View and edit your property and contact details."
        />
        <div className="glass-card rounded-2xl">
          <div className="py-12 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/60" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div>
        <SectionHeader
          title="My Property"
          description="View and edit your property and contact details."
        />
        <div className="glass-card rounded-2xl">
          <div className="py-12 flex flex-col items-center justify-center px-6">
            <div className="w-14 h-14 rounded-full bg-green-100/60 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-green-500/50" />
            </div>
            <p className="text-base font-semibold text-foreground/60 mb-1">No property found</p>
            <p className="text-sm text-muted-foreground/60 text-center max-w-xs mb-5">
              You don't have a property linked to your account yet.
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-green-500/90 hover:bg-green-600 text-white text-sm h-9 px-5 rounded-lg shadow-md shadow-green-500/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Property
            </Button>
          </div>
        </div>
        <AddPropertyModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          userId={userId}
          onSaved={(result) => {
            setProperty(result);
            setForm(mapToForm(result));
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="My Property"
        description="View and edit your property and contact details."
      >
        {!editing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="border-white/30 text-xs h-8 hover:bg-green-50/50 hover:text-green-600 hover:border-green-200/50 transition-all"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>
        )}
      </SectionHeader>

      <div className="glass-card rounded-2xl">
        <div className="p-6 space-y-1">
          <Alert
            {...alert}
            onDismiss={() => setAlert({ type: "", message: "" })}
          />

          {FIELDS.map((field, i) => {
            const Icon = field.icon;
            return (
              <div
                key={field.key}
                className={`flex items-center gap-3 py-4 ${i < FIELDS.length - 1 ? "border-b border-white/20" : ""}`}
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20 shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground/60 mb-1">{field.label}</p>
                  {editing ? (
                    <input
                      type={field.type}
                      value={form[field.key]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-white/30 bg-white/40 px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 hover:bg-white/50"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground/85">{form[field.key] || "—"}</p>
                  )}
                </div>
              </div>
            );
          })}

          {editing && (
            <div className="flex items-center gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-500/90 hover:bg-green-600 text-white text-sm h-9 px-5 rounded-lg shadow-md shadow-green-500/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="border-white/30 text-sm h-9 px-5 rounded-lg hover:bg-white/30"
              >
                <X className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};