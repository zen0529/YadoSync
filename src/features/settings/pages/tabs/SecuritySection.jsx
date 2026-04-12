import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Check, AlertTriangle } from "lucide-react";
import { updatePassword } from "../../queries";

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

const InputField = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium block text-foreground/80">{label}</label>
    {children}
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

export const SecuritySection = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (newPassword.length < 8)
      errs.newPassword = "Password must be at least 8 characters.";
    if (newPassword !== confirmPassword)
      errs.confirmPassword = "Passwords do not match.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });
    if (!validate()) return;
    setSaving(true);
    try {
      await updatePassword({ newPassword });
      setAlert({
        type: "success",
        message: "Password updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Security"
        description="Update your password to keep your account secure."
      />
      <div className="glass-card rounded-2xl">
        <div className="p-6">
          <Alert
            {...alert}
            onDismiss={() => setAlert({ type: "", message: "" })}
          />
          <form onSubmit={handleSave} className="space-y-5">
            <InputField label="Current password">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full h-10 rounded-lg border border-white/30 bg-white/40 pl-10 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 hover:bg-white/50"
                  placeholder="Enter current password"
                />
              </div>
            </InputField>

            <div className="border-t border-white/20 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField
                  label="New password"
                  error={errors.newPassword}
                >
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full h-10 rounded-lg border border-white/30 bg-white/40 px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 hover:bg-white/50"
                    placeholder="Min. 8 characters"
                  />
                </InputField>

                <InputField
                  label="Confirm new password"
                  error={errors.confirmPassword}
                >
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full h-10 rounded-lg border border-white/30 bg-white/40 px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 hover:bg-white/50"
                    placeholder="Re-enter new password"
                  />
                </InputField>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-green-500/90 hover:bg-green-600 text-white text-sm h-9 px-5 rounded-lg shadow-md shadow-green-500/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
