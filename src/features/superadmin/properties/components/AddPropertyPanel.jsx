import { usePropertyForm } from "../hooks/usePropertyForm";
import { TABS } from "../constants/propertyConstants";
import { PanelHeader } from "./AddPropertyPanel/PanelHeader";
import { PanelTabNav } from "./AddPropertyPanel/PanelTabNav";
import { PanelFooter } from "./AddPropertyPanel/PanelFooter";
import { BasicInfoTab } from "./AddPropertyPanel/BasicInfoTab";
import { SettingsTab } from "./AddPropertyPanel/SettingsTab";
import { ContentTab } from "./AddPropertyPanel/ContentTab";
import { Loader2 } from "lucide-react";

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
export const AddPropertyPanel = ({ open, onClose, propertyToEdit, editLoading }) => {
  const {
    tab, setTab,
    form,
    logoData, setLogoData,
    submitting,
    set, setSetting, setContent,
    handleCountryChange,
    handlePhoneChange,
    addPhotos, removePhoto, updatePhotoField,
    handleSubmit,
  } = usePropertyForm(open, onClose, propertyToEdit);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[520px] flex flex-col bg-background/80 dark:bg-[#0F172A]/90 backdrop-blur-2xl border-l border-black/5 dark:border-white/10 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <PanelHeader onClose={onClose} isEditing={!!propertyToEdit} />

        <PanelTabNav tabs={TABS} activeTab={tab} onTabChange={setTab} />

        {/* Scrollable form body */}
        <form id="add-property-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {editLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-green-500" />
              <p className="text-sm text-muted-foreground">Loading property details...</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {tab === "basic" && (
                <BasicInfoTab
                  form={form}
                  set={set}
                  handleCountryChange={handleCountryChange}
                  handlePhoneChange={handlePhoneChange}
                  logoData={logoData}
                  setLogoData={setLogoData}
                  isEditing={!!propertyToEdit}
                />
              )}
              {tab === "settings" && (
                <SettingsTab form={form} setSetting={setSetting} />
              )}
              {tab === "content" && (
                <ContentTab
                  form={form}
                  setContent={setContent}
                  addPhotos={addPhotos}
                  removePhoto={removePhoto}
                  updatePhotoField={updatePhotoField}
                />
              )}
            </div>
          )}
        </form>

        <PanelFooter
          tabs={TABS}
          activeTab={tab}
          submitting={submitting}
          onClose={onClose}
          isEditing={!!propertyToEdit}
        />
      </div>
    </>
  );
};
