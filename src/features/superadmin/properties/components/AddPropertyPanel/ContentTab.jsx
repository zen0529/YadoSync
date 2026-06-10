import { useRef, useState } from "react";
import { Images, Trash2, Upload } from "lucide-react";
import { Field } from "@/components/ui/field";
import { inputCls } from "@/components/ui/input-cls";

/**
 * ContentTab — description, important info, and multi-photo upload UI.
 *
 * Photo flow:
 *  - User drags files onto the drop zone OR clicks to browse (multi-select supported).
 *  - Each file is immediately staged into form.content.photos with a blob preview.
 *  - Description and Author are edited inline per card.
 *  - On submit, usePropertyForm uploads all staged files and resolves public URLs.
 *
 * Props:
 *  - form            {object}   current form state
 *  - setContent      {function} setContent(key, value)
 *  - addPhotos       {function} addPhotos(files[]) — stages multiple files at once
 *  - removePhoto     {function} removePhoto(index)
 *  - updatePhotoField {function} updatePhotoField(index, field, value)
 */
export const ContentTab = ({ form, setContent, addPhotos, removePhoto, updatePhotoField }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) addPhotos(files);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) addPhotos(files);
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
      <div className="space-y-4">
        {/* Drop zone */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 py-8 px-4 ${
            isDragging
              ? "border-green-500 bg-green-500/10 scale-[1.01]"
              : "border-border hover:border-green-500/50 bg-muted/10 hover:bg-green-500/5"
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
            isDragging ? "bg-green-500/20" : "bg-muted/40"
          }`}>
            <Images className={`w-6 h-6 transition-colors ${
              isDragging ? "text-green-500" : "text-muted-foreground/50"
            }`} />
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold transition-colors ${
              isDragging ? "text-green-600 dark:text-green-400" : "text-foreground/70"
            }`}>
              {isDragging ? "Drop photos here" : "Drag & drop photos"}
            </p>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">
              or click to browse · select multiple at once
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <Upload className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-[11px] font-semibold text-green-600 dark:text-green-400">Choose files</span>
          </div>
        </div>

        {/* Staged photo list */}
        {form.content.photos.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              Photos
              <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 normal-case font-bold">
                {form.content.photos.length}
              </span>
            </p>
            <div className="space-y-2">
              {form.content.photos.map((ph, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/30 border border-border group transition-shadow hover:shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                    <img
                      src={ph.preview || ph.url}
                      alt={ph.description || `photo-${i}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>

                  {/* Inline fields */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="relative group/desc">
                      <input
                        className="w-full text-xs font-medium text-foreground bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 pr-7 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-background transition-all"
                        placeholder="Add a description…"
                        value={ph.description}
                        onChange={(e) => updatePhotoField(i, "description", e.target.value)}
                      />
                      <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40 group-focus-within/desc:text-green-500 transition-colors pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      </svg>
                    </div>
                    <input
                      className="w-full text-xs text-foreground bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-background transition-all"
                      placeholder="Author (optional)"
                      value={ph.author || ""}
                      onChange={(e) => updatePhotoField(i, "author", e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground/50 truncate px-0.5">
                      {ph.isExisting ? "Existing photo" : ph.file?.name}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-red-400 transition-all flex-shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
