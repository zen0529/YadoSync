import { usePropertyForm } from "../hooks/usePropertyForm";
import { TABS } from "../constants/propertyConstants";
import { PanelHeader }  from "./AddPropertyPanel/PanelHeader";
import { PanelTabNav }  from "./AddPropertyPanel/PanelTabNav";
import { PanelFooter }  from "./AddPropertyPanel/PanelFooter";
import { BasicInfoTab } from "./AddPropertyPanel/BasicInfoTab";
import { SettingsTab }  from "./AddPropertyPanel/SettingsTab";
import { ContentTab }   from "./AddPropertyPanel/ContentTab";

/**
 * AddPropertyPanel — slide-over panel for creating a new property.
 *
 * Orchestrates the usePropertyForm hook and composes panel chrome
 * (header, tab nav, footer) with the three tab sub-panels. Owns no
 * state or business logic of its own.
 *
 * Props:
 *  - open    {boolean}  whether the panel is visible
 *  - onClose {function} called to close the panel
 */
export const AddPropertyPanel = ({ open, onClose }) => {
  const {
    tab, setTab,
    form,
    newPhoto, setNewPhoto,
    logoData, setLogoData,
    submitting,
    set, setSetting, setContent,
    handleCountryChange,
    handlePhoneChange,
    addPhoto, removePhoto,
    handleSubmit,
  } = usePropertyForm(open, onClose);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[520px] flex flex-col bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <PanelHeader onClose={onClose} />

        <PanelTabNav tabs={TABS} activeTab={tab} onTabChange={setTab} />

        {/* Scrollable form body */}
        <form id="add-property-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {tab === "basic" && (
              <BasicInfoTab
                form={form}
                set={set}
                handleCountryChange={handleCountryChange}
                handlePhoneChange={handlePhoneChange}
                logoData={logoData}
                setLogoData={setLogoData}
              />
            )}
            {tab === "settings" && (
              <SettingsTab form={form} setSetting={setSetting} />
            )}
            {tab === "content" && (
              <ContentTab
                form={form}
                setContent={setContent}
                newPhoto={newPhoto}
                setNewPhoto={setNewPhoto}
                addPhoto={addPhoto}
                removePhoto={removePhoto}
              />
            )}
          </div>
        </form>

        <PanelFooter
          tabs={TABS}
          activeTab={tab}
          submitting={submitting}
          onClose={onClose}
        />
      </div>
    </>
  );
};
