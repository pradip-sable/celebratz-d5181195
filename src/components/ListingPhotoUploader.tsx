import React, { useState, useRef } from "react";
import { Camera, Upload, Link as LinkIcon, Sparkles, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { resolveMediaUrl } from "@/lib/media-url";

export interface MediaItem {
  path: string;
}

export interface ListingPhotoUploaderProps {
  value: MediaItem[];
  onChange: (value: MediaItem[]) => void;
  onRemovePhoto?: (removedPath: string) => void;
  folderId: string;
  userId: string;
  error?: string | null;
  disabled?: boolean;
}

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

async function downscaleImage(file: File, maxDimension = 1600, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      // Fill canvas with white before drawing so transparent PNGs/WebPs don't turn black in JPEG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Image compression failed"));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image file"));
    };
    img.src = url;
  });
}

export function ListingPhotoUploader({
  value,
  onChange,
  onRemovePhoto,
  folderId,
  userId,
  error,
  disabled,
}: ListingPhotoUploaderProps) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (disabled || isUploading) return;
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    if (!userId) {
      toast.error("User session missing. Please sign in again.");
      return;
    }

    const availableSlots = MAX_PHOTOS - value.length;
    if (availableSlots <= 0) {
      toast.error(`You can only upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of fileArray) {
      if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
        toast.error(`"${file.name}" is not a supported format. Please use JPG, PNG, or WebP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`"${file.name}" exceeds the 5 MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) return;

    const filesToUpload = validFiles.slice(0, availableSlots);
    if (validFiles.length > availableSlots) {
      toast.warning(`Only ${availableSlots} more photo${availableSlots === 1 ? "" : "s"} can be added.`);
    }

    setIsUploading(true);
    const uploadedItems: MediaItem[] = [];

    for (const file of filesToUpload) {
      const toastId = toast.loading(`Uploading ${file.name}...`);
      try {
        const compressedBlob = await downscaleImage(file);
        const uuid = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15);
        const storagePath = `${userId}/${folderId}/${uuid}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("listing-media")
          .upload(storagePath, compressedBlob, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        uploadedItems.push({ path: storagePath });
        toast.success(`Uploaded ${file.name}`, { id: toastId });
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}: ${err?.message || "Storage error"}`, { id: toastId });
      }
    }

    setIsUploading(false);
    if (uploadedItems.length > 0) {
      onChange([...value, ...uploadedItems]);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (value.length >= MAX_PHOTOS) {
      toast.error(`You can only add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    if (!trimmed.startsWith("https://")) {
      toast.error("Please provide a secure HTTPS image URL (e.g. https://...).");
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      toast.error("Invalid URL format.");
      return;
    }

    onChange([...value, { path: trimmed }]);
    setUrlInput("");
    toast.success("Image URL added to gallery");
  };

  const handleSetCover = (idx: number) => {
    if (idx === 0 || idx >= value.length) return;
    const item = value[idx];
    if (!item) return;
    const next = [item, ...value.filter((_, i) => i !== idx)];
    onChange(next);
  };

  const handleRemove = (idx: number) => {
    const item = value[idx];
    if (onRemovePhoto && item) {
      onRemovePhoto(item.path);
    }
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-5 bg-accent-subtle/40 rounded-2xl border border-accent/80 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
            <Camera className="w-4 h-4 text-accent" />
            Photos &amp; Media Showcase
          </h3>
          <p className="text-xs text-muted-foreground">
            Upload multiple photos for your listing. You can select any photo as the cover photo; otherwise the first photo will be used automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-accent-subtle text-accent-dark border border-accent/60 w-fit">
            {value.length} Photo{value.length === 1 ? "" : "s"}
          </span>
          <div className="flex bg-muted p-0.5 rounded-lg text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setTab("upload")}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                tab === "upload"
                  ? "bg-card shadow-xs text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="w-3 h-3" />
              Browse Device
            </button>
            <button
              type="button"
              onClick={() => setTab("url")}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                tab === "url"
                  ? "bg-card shadow-xs text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              Image URL
            </button>
          </div>
        </div>
      </div>

      {/* Upload Inputs */}
      <div className="p-4 bg-card rounded-xl border border-border space-y-4">
        {tab === "upload" ? (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleUploadFiles(e.dataTransfer.files);
            }}
            className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors text-center group ${
              isDragging
                ? "border-primary bg-primary-subtle/50"
                : "border-border hover:border-primary bg-muted/40 hover:bg-primary-subtle/30"
            }`}
          >
            <div className="p-3 rounded-full bg-primary-subtle text-primary group-hover:scale-110 transition-transform mb-2">
              {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
            </div>
            <span className="text-sm font-bold text-foreground mb-0.5">
              {isUploading ? "Uploading photos..." : "Click to browse or drop photos here"}
            </span>
            <span className="text-xs text-muted-foreground">
              Select one or multiple images (JPG, PNG, WEBP — up to 5 MB each, max {MAX_PHOTOS} total)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files) handleUploadFiles(e.target.files);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="hidden"
              disabled={disabled || isUploading}
            />
          </label>
        ) : (
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              disabled={disabled}
              className="flex-1 bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground outline-hidden focus:border-primary"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={disabled}
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs font-bold shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
            >
              + Add Photo
            </button>
          </div>
        )}

        {/* Gallery Grid */}
        {value.length > 0 ? (
          <div className="pt-2 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-1 pb-1 border-b border-border-subtle">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-accent" />
                Listing Gallery ({value.length})
              </span>
              <span className="text-[11px] text-muted-foreground italic">
                Click &quot;Set as Cover&quot; on any photo to choose your main showcase image.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {value.map((img, idx) => {
                const isCover = idx === 0;
                const previewSrc = resolveMediaUrl(img.path) || "";

                return (
                  <div
                    key={`${img.path}-${idx}`}
                    className={`relative group rounded-xl overflow-hidden aspect-4/3 bg-muted shadow-2xs transition-all ${
                      isCover ? "ring-3 ring-accent border-2 border-accent shadow-md" : "border border-border"
                    }`}
                  >
                    <img
                      src={previewSrc}
                      alt={`Uploaded photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />

                    {isCover ? (
                      <span className="absolute top-1.5 left-1.5 bg-accent text-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 select-none">
                        <Sparkles className="w-3 h-3 fill-foreground" />
                        Cover Photo
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetCover(idx)}
                        className="absolute top-1.5 left-1.5 bg-surface-dark/80 hover:bg-surface-dark text-surface-dark-foreground text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs transition-colors opacity-90 hover:opacity-100 cursor-pointer"
                        title="Make this the main cover photo"
                      >
                        Set as Cover
                      </button>
                    )}

                    <span className="absolute bottom-1.5 left-1.5 bg-surface-dark/70 text-surface-dark-foreground text-[9px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-xs select-none">
                      #{idx + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-destructive hover:bg-destructive text-destructive-foreground rounded-md shadow-xs opacity-90 hover:opacity-100 transition-all cursor-pointer"
                      title="Remove this photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-xs bg-muted/40 rounded-xl border border-border">
            No photos added yet. Upload files or paste URLs above to showcase your business.
          </div>
        )}

        {error && <p className="text-xs font-medium text-destructive mt-1">{error}</p>}
      </div>
    </div>
  );
}
