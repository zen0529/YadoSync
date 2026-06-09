import React, { useState, useEffect, useRef } from "react";
import { BedDouble, X, Loader2, Settings, Image as ImageIcon, Trash2, Upload, Plus } from "lucide-react";
import { Field } from "@/components/ui/field";
import { inputCls } from "@/components/ui/input-cls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "content", label: "Content", icon: ImageIcon }
];

export const AddRoomTypePanel = ({ open, onClose, roomTypeToEdit, onSave, submitting, editLoading }) => {
  const [tab, setTab] = useState("general");
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    count_of_rooms: 1,
    occ_adults: 2,
    occ_children: 0,
    occ_infants: 0,
    default_occupancy: 2,
    capacity: 2,
    room_kind: "room",
    description: "",
    content: {
      photos: []
    }
  });

  const [newPhoto, setNewPhoto] = useState({ file: null, preview: null, description: "" });

  useEffect(() => {
    if (open && roomTypeToEdit) {
      setForm({
        title: roomTypeToEdit.title || "",
        count_of_rooms: roomTypeToEdit.count_of_rooms || 1,
        occ_adults: roomTypeToEdit.occ_adults || 2,
        occ_children: roomTypeToEdit.occ_children || 0,
        occ_infants: roomTypeToEdit.occ_infants || 0,
        default_occupancy: roomTypeToEdit.default_occupancy || 2,
        capacity: roomTypeToEdit.capacity || 2,
        room_kind: roomTypeToEdit.room_kind || "room",
        description: roomTypeToEdit.content_description || "",
        content: {
          photos: (roomTypeToEdit.photos || []).map(photo => ({
            id: photo.channex_photo_id || null,
            url: photo.url,
            description: photo.description || "",
            position: photo.position || 0,
            isExisting: true,
          }))
        }
      });
      setTab("general");
      setNewPhoto({ file: null, preview: null, description: "" });
    } else if (open && !roomTypeToEdit) {
      setForm({
        title: "",
        count_of_rooms: 1,
        occ_adults: 2,
        occ_children: 0,
        occ_infants: 0,
        default_occupancy: 2,
        capacity: 2,
        room_kind: "room",
        description: "",
        content: {
          photos: []
        }
      });
      setTab("general");
      setNewPhoto({ file: null, preview: null, description: "" });
    }
  }, [open, roomTypeToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Automatically stage any pending photo that was selected but not explicitly added
    const finalForm = { ...form };
    if (newPhoto.file) {
      finalForm.content = {
        ...finalForm.content,
        photos: [...finalForm.content.photos, newPhoto]
      };
    }
    
    onSave(finalForm, roomTypeToEdit?.id);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setNewPhoto(p => ({ ...p, file, preview }));
    e.target.value = "";
  };

  const addPhoto = () => {
    if (!newPhoto.file && !newPhoto.url) return;
    setForm(f => ({
      ...f,
      content: {
        ...f.content,
        photos: [...f.content.photos, newPhoto]
      }
    }));
    setNewPhoto({ file: null, preview: null, description: "" });
  };

  const removePhoto = (index) => {
    setForm(f => ({
      ...f,
      content: {
        ...f.content,
        photos: f.content.photos.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[520px] flex flex-col bg-background/80 dark:bg-[#0F172A]/90 backdrop-blur-2xl border-l border-black/5 dark:border-white/10 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <BedDouble className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">
                {roomTypeToEdit ? "Edit Room Type" : "Add Room Type"}
              </h2>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                {roomTypeToEdit ? "Update room configuration" : "Configure a new room type"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 px-4 py-3 border-b border-black/5 dark:border-white/10 shrink-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                tab === id
                  ? "bg-green-500 text-white shadow-md shadow-green-500/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <form id="add-room-type-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {editLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 min-h-[300px]">
              <Loader2 className="w-7 h-7 animate-spin text-green-500" />
              <p className="text-sm text-muted-foreground">Loading room type details...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tab === "general" && (
                <>
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 mb-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      YadoSync works with bed spaces, Adult beds can sleep adults and children, child beds are for children only.
                      <br/><br/>
                      Example: If you have a family room that has 1 double bed and 2 single beds, just enter 4 for adults and 0 for children since children can sleep in adult beds.
                    </p>
                  </div>
                  <div className="grid grid-cols-[2fr_1fr] gap-3">
                    <Field label="Title (e.g. Deluxe Double Room)">
                      <input
                        className={inputCls}
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        required
                      />
                    </Field>
                    <Field label="Room Kind">
                      <Select value={form.room_kind} onValueChange={v => setForm(f => ({ ...f, room_kind: v }))}>
                        <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-dropdown rounded-xl border-white/30">
                          <SelectItem value="room" className="text-sm rounded-lg">Room</SelectItem>
                          <SelectItem value="apartment" className="text-sm rounded-lg">Apartment</SelectItem>
                          <SelectItem value="bed" className="text-sm rounded-lg">Bed</SelectItem>
                          <SelectItem value="dorm" className="text-sm rounded-lg">Dorm</SelectItem>
                          <SelectItem value="villa" className="text-sm rounded-lg">Villa</SelectItem>
                          <SelectItem value="house" className="text-sm rounded-lg">House</SelectItem>
                          <SelectItem value="tent" className="text-sm rounded-lg">Tent</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field label="Description (Optional)">
                    <textarea
                      className={`${inputCls} resize-none h-20 py-2`}
                      placeholder="Describe the room features..."
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Number of Rooms">
                      <input
                        className={inputCls}
                        type="number"
                        min="1"
                        value={form.count_of_rooms}
                        onChange={e => setForm(f => ({ ...f, count_of_rooms: e.target.value }))}
                      />
                    </Field>
                    <Field label="Total Capacity">
                      <input
                        className={inputCls}
                        type="number"
                        min="1"
                        value={form.capacity}
                        onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                      />
                    </Field>
                  </div>

                  <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mt-4 border-t border-black/5 dark:border-white/10 pt-4">Occupancy Limits</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Max Adults">
                      <input
                        className={inputCls}
                        type="number"
                        min="1"
                        value={form.occ_adults}
                        onChange={e => setForm(f => ({ ...f, occ_adults: e.target.value }))}
                      />
                    </Field>
                    <Field label="Default Occupancy">
                      <input
                        className={inputCls}
                        type="number"
                        min="1"
                        value={form.default_occupancy}
                        onChange={e => setForm(f => ({ ...f, default_occupancy: e.target.value }))}
                      />
                    </Field>
                    <Field label="Max Children">
                      <input
                        className={inputCls}
                        type="number"
                        min="0"
                        value={form.occ_children}
                        onChange={e => setForm(f => ({ ...f, occ_children: e.target.value }))}
                      />
                    </Field>
                    <Field label="Max Infants">
                      <input
                        className={inputCls}
                        type="number"
                        min="0"
                        value={form.occ_infants}
                        onChange={e => setForm(f => ({ ...f, occ_infants: e.target.value }))}
                      />
                    </Field>
                  </div>
                </>
              )}

              {tab === "content" && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                    Photos
                  </p>

                  {form.content.photos.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {form.content.photos.map((ph, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border group"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                            <img
                              src={ph.preview || ph.url}
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
                              {ph.file?.name || (ph.url ? ph.url.split("/").pop() : "Existing photo")}
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

                  <div className="rounded-xl border border-dashed border-border p-4 space-y-3 bg-muted/10">
                    <div className="flex items-center gap-2 text-muted-foreground/60">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs font-semibold">Add Photo</span>
                    </div>

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

                    <div className="grid grid-cols-1 gap-2">
                      <input
                        className={inputCls}
                        placeholder="Description"
                        value={newPhoto.description}
                        onChange={e => setNewPhoto(p => ({ ...p, description: e.target.value }))}
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
              )}
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-end gap-3 shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting} className="hover:bg-black/5 dark:hover:bg-white/10">
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-room-type-form"
            disabled={submitting || !form.title || editLoading}
            className="bg-green-500 hover:bg-green-600 text-white min-w-[120px]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Room Type"}
          </Button>
        </div>
      </div>
    </>
  );
};
