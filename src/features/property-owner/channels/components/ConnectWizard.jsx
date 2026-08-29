import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import StepDots from "./StepDots";
import Step1Credentials from "./Step1Credentials";
import Step2Mapping from "./Step2Mapping";
import Step3Activate from "./Step3Activate";

// ── Connect Wizard Modal ──────────────────────────────────────────────────────
const TOTAL_STEPS = 3;

const ConnectWizard = ({ platform, property, ratePlans, onSuccess, onClose }) => {
  const [step, setStep]           = useState(0);
  const [hotelId, setHotelId]     = useState(null);
  const [groupId, setGroupId]     = useState(null);
  const [mappings, setMappings]   = useState([]);

  const stepTitles = ["Credentials", "Map Rooms & Rates", "Review & Activate"];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${platform.bgClass} ${platform.textClass}`}>
              {platform.initials}
            </div>
            <div>
              <DialogTitle className="text-sm">Connect {platform.name}</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">{stepTitles[step]}</DialogDescription>
            </div>
          </div>
          <StepDots current={step} total={TOTAL_STEPS} />
        </DialogHeader>

        <div className="mt-2">
          {step === 0 && (
            <Step1Credentials
              platform={platform}
              onNext={({ hotelId: hid }) => { setHotelId(hid); setStep(1); }}
              onClose={onClose}
            />
          )}
          {step === 1 && (
            <Step2Mapping
              platform={platform}
              hotelId={hotelId}
              ratePlans={ratePlans}
              onNext={({ groupId: gid, ratePlanMappings }) => {
                setGroupId(gid);
                setMappings(ratePlanMappings);
                setStep(2);
              }}
              onBack={() => setStep(0)}
              onClose={onClose}
            />
          )}
          {step === 2 && (
            <Step3Activate
              platform={platform}
              hotelId={hotelId}
              groupId={groupId}
              ratePlanMappings={mappings}
              property={property}
              ratePlans={ratePlans}
              onSuccess={onSuccess}
              onBack={() => setStep(1)}
              onClose={onClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectWizard;
