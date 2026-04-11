import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Lock,
  Bell,
  Info,
  AlertTriangle,
  Copy,
  Check,
  Loader2,
  Mail,
  Smartphone,
  Calendar,
  Fingerprint,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  fetchUserProfile,
  updateProfile,
  updatePassword,
  fetchNotificationPreferences,
  upsertNotificationPreferences,
  signOutAllSessions,
} from "../queries";
import { format } from "date-fns";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: Info },
];

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

const InputField = ({
  label,
  description,
  error,
  children,
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium block text-foreground/80">{label}</label>
    {children}
    {description && !error && (
      <p className="text-xs text-muted-foreground/60">{description}</p>
    )}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

const ProfileSection = ({ user }) => {
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

const SecuritySection = () => {
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

const NotificationsSection = ({ userId }) => {
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

const AccountSection = ({ user }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(user?.id || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOutAll = async () => {
    setSigningOut(true);
    try {
      await signOutAllSessions();
      navigate("/login", { replace: true });
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div>
      <SectionHeader

        title="Account"
        description="View your account details and manage active sessions."
      />

      {/* Account Info Card */}
      <div className="glass-card rounded-2xl mb-4">
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground/70 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5" />
                Account ID
              </label>
              <div className="flex items-center gap-2">
                <span className="flex-1 h-10 rounded-lg border border-white/30 bg-white/30 px-3 text-xs font-mono flex items-center truncate select-all">
                  {user?.id}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={copyId}
                  className="border-white/30 shrink-0 hover:bg-green-50/50 hover:text-green-600 hover:border-green-200/50 transition-all"
                  aria-label={copied ? "Copied" : "Copy account ID"}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground/70 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Account created
              </label>
              <p className="text-sm h-10 flex items-center text-foreground/80">
                {user?.created_at
                  ? format(
                      new Date(user.created_at),
                      "MMMM d, yyyy 'at' h:mm a"
                    )
                  : "---"}
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground/70 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Last sign in
              </label>
              <p className="text-sm h-10 flex items-center text-foreground/80">
                {user?.last_sign_in_at
                  ? format(
                      new Date(user.last_sign_in_at),
                      "MMMM d, yyyy 'at' h:mm a"
                    )
                  : "---"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-2xl border-red-200/40">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shrink-0 shadow-md shadow-red-500/20">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-700">
                Danger Zone
              </h3>
              <p className="text-xs text-red-600/70 mt-0.5">
                Actions here are irreversible. Proceed with caution.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/30 rounded-xl border border-red-200/40 p-4">
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground/85">Sign out all sessions</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Sign out from all devices and browsers immediately.
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs h-9 px-4"
                >
                  Sign Out All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out all sessions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately sign you out from all devices and
                    browsers. You will need to sign in again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSignOutAll}
                    disabled={signingOut}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {signingOut ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" />{" "}
                        Signing out...
                      </>
                    ) : (
                      "Yes, sign out all"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SettingsPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    fetchUserProfile().then(setProfile).catch(() => {});
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSection user={profile} />;
      case "security":
        return <SecuritySection />;
      case "notifications":
        return <NotificationsSection userId={profile?.id} />;
      case "account":
        return <AccountSection user={profile} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 glass-card rounded-xl p-1 w-fit overflow-x-auto" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-green-500/90 text-white shadow-sm shadow-green-500/20"
                  : "text-muted-foreground/70 hover:text-foreground/80 hover:bg-white/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl" role="tabpanel" id={`panel-${activeTab}`}>{renderContent()}</div>
    </div>
  );
};
