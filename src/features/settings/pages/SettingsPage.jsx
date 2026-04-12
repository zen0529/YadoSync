import { useState, useEffect } from "react";
import { User, Lock, Bell, Info, Building2 } from "lucide-react";
import { fetchUserProfile } from "../queries";
import { ProfileSection } from "./tabs/ProfileSection";
import { MyPropertySection } from "./tabs/MyPropertySection";
import { SecuritySection } from "./tabs/SecuritySection";
import { NotificationsSection } from "./tabs/NotificationsSection";
import { AccountSection } from "./tabs/AccountSection";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "my-property", label: "My Property", icon: Building2 },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: Info },
];

export const SettingsPage = () => {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    fetchUserProfile().then(setProfile).catch(() => {});
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSection user={profile} />;
      case "my-property":
        return <MyPropertySection userId={profile?.id} />;
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
