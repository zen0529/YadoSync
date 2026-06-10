/**
 * Handles file input change for photo upload.
 * Creates an object URL preview for the selected file.
 */
export const handleFileChange = ({ e, setNewPhoto }) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const preview = URL.createObjectURL(file);
  setNewPhoto((p) => ({ ...p, file, preview }));
  e.target.value = "";
};
