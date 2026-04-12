import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Check, AlertTriangle } from "lucide-react";
import { updateProfile } from "../../queries";

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

const InputField = ({ label, description, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium block text-foreground/80">{label}</label>
    {children}
    {description && !error && (
      <p className="text-xs text-muted-foreground/60">{description}</p>
    )}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

const SectionHeader = ({ title, description }) => (
  <div className="mb-6">
    <h2 className="text-base font-semibold text-foreground mb-0.5">{title}</h2>
    {description && (
      <p className="text-sm text-muted-foreground/70">{description}</p>
    )}
  </div>
);

export const ProfileSection = ({ user }) => {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert({ type: "", message: "" });
    try {
      await updateProfile({ email });
      setAlert({ type: "success", message: "Profile updated successfully." });
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Profile"
        description="Manage your account email and personal information."
      />
      <div className="glass-card rounded-2xl">
        <div className="p-6">
          <Alert
            {...alert}
            onDismiss={() => setAlert({ type: "", message: "" })}
          />
          <form onSubmit={handleSave} className="space-y-5">
            <InputField
              label="Email address"
              description="Changing your email will require verification from your new email address."
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/30 bg-white/40 pl-10 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 hover:bg-white/50"
                  placeholder="your@email.com"
                />
              </div>
            </InputField>

            <div className="pt-2">
              <Button
                type="submit"
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
