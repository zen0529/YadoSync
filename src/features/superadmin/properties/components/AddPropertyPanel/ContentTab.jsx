import { useRef } from "react";
import { Image, Plus, Trash2, Upload } from "lucide-react";
import { Field } from "@/components/ui/field";
import { inputCls } from "@/components/ui/input-cls";

/**
 * ContentTab — renders the description, important info, and photo management UI.
 *
 * Photo staging flow:
 *  - User picks a local image file via the file input.
 *  - A blob preview URL is generated for the thumbnail.
 *  - The staged photo is stored as { file, preview, description, author }.
 *  - On form submit (handled by usePropertyForm), each file is uploaded to
 *    Supabase and the public URL is resolved before sending to Channex.
 *
 * Props:
 *  - form        {object}   current form state
 *  - setContent  {function} setContent(key, value) — updates form.content[key]
 *  - newPhoto    {object}   { file, preview, description, author } draft state
 *  - setNewPhoto {function} setter for the draft photo state
 *  - addPhoto    {function} commits the draft photo to form.content.photos
 *  - removePhoto {function} removePhoto(index) — removes a photo by index
 */
export const ContentTab = ({ form, setContent, newPhoto, setNewPhoto, addPhoto, removePhoto }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setNewPhoto(p => ({ ...p, file, preview }));
    // Reset the input so the same file can be re-selected if removed
    e.target.value = "";
  };

  return (
    <div className="space-y-5">
      <Field label="Description">
        <textarea
          className={`${inputCls} resize-none min-h-[100px]`}
          placeholder="Write a brief property description..."
          value={form.content.description}
          onChange={e => setContent("description", e.target.value)}
        />
      </Field>

      <Field label="Important Information">
        <textarea
          className={`${inputCls} resize-none min-h-[80px]`}
          placeholder="e.g. check-in procedures, house rules..."
          value={form.content.important_information}
          onChange={e => setContent("important_information", e.target.value)}
        />
      </Field>

      {/* Photos */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
          Photos
        </p>

        {/* Staged photos list */}
        {form.content.photos.length > 0 && (
          <div className="space-y-2 mb-3">
            {form.content.photos.map((ph, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border group"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                  <img
                    src={ph.preview}
                    alt={ph.description}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = "none"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground/80 truncate">
                    {ph.description || "Untitled"}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 truncate">
                    {ph.file?.name || ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new photo */}
        <div className="rounded-xl border border-dashed border-border p-4 space-y-3 bg-muted/10">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <Image className="w-4 h-4" />
            <span className="text-xs font-semibold">Add Photo</span>
          </div>

          {/* File picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-white/20 bg-white/40 dark:bg-white/5 text-sm text-muted-foreground hover:text-foreground transition-all ${
              newPhoto.preview ? "border-green-500/40 bg-green-500/5 text-green-600 dark:text-green-400" : ""
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            {newPhoto.preview ? newPhoto.file?.name : "Choose image file…"}
          </button>

          {/* Preview thumbnail */}
          {newPhoto.preview && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border">
              <img
                src={newPhoto.preview}
                alt="preview"
                className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0"
              />
              <p className="text-[10px] text-muted-foreground/70 truncate flex-1">
                {newPhoto.file?.name}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input
              className={inputCls}
              placeholder="Description"
              value={newPhoto.description}
              onChange={e => setNewPhoto(p => ({ ...p, description: e.target.value }))}
            />
            <input
              className={inputCls}
              placeholder="Author"
              value={newPhoto.author}
              onChange={e => setNewPhoto(p => ({ ...p, author: e.target.value }))}
            />
          </div>
          <button
            type="button"
            onClick={addPhoto}
            disabled={!newPhoto.file}
            className="w-full h-8 rounded-lg bg-green-500/10 hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-green-600 dark:text-green-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-green-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Photo
          </button>
        </div>
      </div>
    </div>
  );
};
