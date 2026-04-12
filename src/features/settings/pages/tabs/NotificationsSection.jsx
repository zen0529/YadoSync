import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, Smartphone, Loader2, Check, AlertTriangle } from "lucide-react";
import {
  fetchNotificationPreferences,
  upsertNotificationPreferences,
} from "../../queries";

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

const SectionHeader = ({ title, description }) => (
  <div className="mb-6">
    <h2 className="text-base font-semibold text-foreground mb-0.5">{title}</h2>
    {description && (
      <p className="text-sm text-muted-foreground/70">{description}</p>
    )}
  </div>
);

export const NotificationsSection = ({ userId }) => {
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!userId) return;
    fetchNotificationPreferences(userId)
      .then((prefs) => {
        setEmailNotif(prefs.email_notifications);
        setSmsNotif(prefs.sms_notifications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    setAlert({ type: "", message: "" });
    try {
      await upsertNotificationPreferences({
        userId,
        emailNotifications: emailNotif,
        smsNotifications: smsNotif,
      });
      setAlert({
        type: "success",
        message: "Notification preferences saved.",
      });
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
          title="Notifications"
          description="Choose how you want to be notified about new bookings."
        />
        <div className="glass-card rounded-2xl">
          <div className="py-12 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/60" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Notifications"
        description="Choose how you want to be notified about new bookings."
      />
      <div className="glass-card rounded-2xl">
        <div className="p-6 space-y-1">
          <Alert
            {...alert}
            onDismiss={() => setAlert({ type: "", message: "" })}
          />

          <div className="flex items-center justify-between py-4 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/85">Email notifications</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Receive email alerts when a new booking is confirmed
                </p>
              </div>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} aria-label="Toggle email notifications" />
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/20">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/85">SMS notifications</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Receive SMS alerts via Semaphore when a new booking is confirmed
                </p>
              </div>
            </div>
            <Switch checked={smsNotif} onCheckedChange={setSmsNotif} aria-label="Toggle SMS notifications" />
          </div>

          <div className="pt-4">
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
                "Save Preferences"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
