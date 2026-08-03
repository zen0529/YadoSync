import { toast } from "sonner";

export const handleSaveRatePlan = async ({
  form,
  localId,
  roomTypeId,
  ratePlans,
  roomTypes,
  propertyId,
  channexPropertyId,
  createRatePlan,
  updateRatePlan,
  setSubmitting,
  handleClose,
}) => {
  setSubmitting(true);
  try {
    console.log("form", form);
    if (!localId) {
      const selectedRoomType = roomTypes.find(
        (rt) => rt.id === roomTypeId,
      );
      if (!selectedRoomType?.channex_room_type_id) {
        throw new Error(
          "Selected room type has no Channex ID. Sync your room types first.",
        );
      }
      await createRatePlan({
        propertyId,
        roomTypeId,
        channexPropertyId,
        channexRoomTypeId: selectedRoomType.channex_room_type_id,
        form,
      });
      console.log("form", form);
      toast.success("Rate plan created");
    } else {
      const rp = ratePlans.find((r) => r.id === localId);
      if (rp) {
        await updateRatePlan({
          localId: rp.id,
          channexRatePlanId: rp.channex_rate_plan_id,
          form,
          propertyId,
        });
        toast.success("Rate plan updated");
      }
    }
    handleClose();
  } catch (err) {
    toast.error("Failed to save rate plan", { description: err.message });
  } finally {
    setSubmitting(false);
  }
};
