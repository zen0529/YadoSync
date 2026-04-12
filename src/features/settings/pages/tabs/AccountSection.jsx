import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  AlertTriangle,
  Copy,
  Check,
  Loader2,
  Calendar,
  Fingerprint,
  LogOut,
} from "lucide-react";
import { signOutAllSessions } from "../../queries";
import { format } from "date-fns";

const SectionHeader = ({ title, description }) => (
  <div className="mb-6">
    <h2 className="text-base font-semibold text-foreground mb-0.5">{title}</h2>
    {description && (
      <p className="text-sm text-muted-foreground/70">{description}</p>
    )}
  </div>
);

export const AccountSection = ({ user }) => {
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
