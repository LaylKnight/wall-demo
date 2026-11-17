"use client";

import * as React from "react";
import {
  ImagePlus,
  Loader2,
  AlertCircle,
  X,
  Send,
  UploadCloud,
} from "lucide-react";
import {
  AUTHOR_STORAGE_KEY,
  MAX_IMAGES_PER_POST,
  MAX_MESSAGE_LENGTH,
  fileToCompressedDataUrl,
  type CreatePostInput,
} from "@/lib/posts-store";
import { validateImageFile } from "@/lib/security";

interface PostComposerProps {
  onSharePost: (input: CreatePostInput) => Promise<void>;
  isSubmitting: boolean;
}

interface AttachedImage {
  id: string;
  file: File;
  previewUrl: string;
}

const QUICK_AUTHORS = [
  "Greg Wientjes",
  "Anna",
  "Adelaida",
  "Juho",
  "Maija",
  "Alex",
  "Sheryl",
];

export function PostComposer({ onSharePost, isSubmitting }: PostComposerProps) {
  const [authorName, setAuthorName] = React.useState("Greg Wientjes");
  const [message, setMessage] = React.useState("");
  const [attachments, setAttachments] = React.useState<AttachedImage[]>([]);
  const [showDropzone, setShowDropzone] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAuthor = window.localStorage.getItem(AUTHOR_STORAGE_KEY);
      if (savedAuthor) {
        setAuthorName(savedAuthor);
      }
    }
  }, []);

  React.useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleAuthorChange = (val: string) => {
    setAuthorName(val);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTHOR_STORAGE_KEY, val);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    if (nextValue.length <= MAX_MESSAGE_LENGTH) {
      setMessage(nextValue);
      if (error) setError(null);
    }
  };

  const processSelectedFiles = async (fileList: FileList | File[]) => {
    setError(null);
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const remainingSlots = MAX_IMAGES_PER_POST - attachments.length;
    if (remainingSlots <= 0) {
      setError(`You can attach up to ${MAX_IMAGES_PER_POST} images per post.`);
      return;
    }

    const filesToProcess = incoming.slice(0, remainingSlots);
    const nextAttachments: AttachedImage[] = [];
    const errors: string[] = [];

    for (const file of filesToProcess) {
      const check = await validateImageFile(file);
      if (!check.valid) {
        errors.push(`${file.name}: ${check.error}`);
        continue;
      }
      try {
        const previewUrl = await fileToCompressedDataUrl(file);
        nextAttachments.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          previewUrl,
        });
      } catch {
        errors.push(`${file.name}: Could not process the selected image.`);
      }
    }

    if (incoming.length > remainingSlots) {
      errors.push(`Maximum of ${MAX_IMAGES_PER_POST} images per post.`);
    }

    if (nextAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...nextAttachments]);
      setShowDropzone(false);
    }

    if (errors.length > 0) {
      setError(errors[0]);
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      await processSelectedFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedMsg = message.trim();
    if (!trimmedMsg && attachments.length === 0) {
      setError("Write a short message or attach a photo to share on Greg's Wall.");
      textareaRef.current?.focus();
      return;
    }

    if (trimmedMsg.length > MAX_MESSAGE_LENGTH) {
      setError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setError(null);
    try {
      await onSharePost({
        author_name: authorName.trim() || "Greg Wientjes",
        message: trimmedMsg,
        imageFiles: attachments.map((a) => a.file),
        imageDataUrls: attachments.map((a) => a.previewUrl),
      });
      setMessage("");
      setAttachments([]);
      setShowDropzone(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while sharing your post."
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const charsRemaining = MAX_MESSAGE_LENGTH - message.length;
  const isNearLimit = charsRemaining <= 30;
  const isAtLimit = charsRemaining === 0;
  const canShare =
    !isSubmitting && (message.trim().length > 0 || attachments.length > 0);
  const canAddMore = attachments.length < MAX_IMAGES_PER_POST;

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      {/* "Post as:" Quick Author Selector (no text input box) */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-sans text-[13px] font-medium text-[var(--wall-text-body)] mr-0.5">
          Post as:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {QUICK_AUTHORS.map((name) => {
            const active =
              authorName.trim().toLowerCase() === name.toLowerCase();
            return (
              <button
                key={name}
                type="button"
                onClick={() => handleAuthorChange(name)}
                className={`px-3 py-1 rounded-[8px] font-sans text-[13px] font-medium transition-colors border-[1.5px] ${
                  active
                    ? "bg-[var(--wall-bg-blue)] text-[var(--wall-btn-white-text)] border-[var(--wall-border-highlight)]"
                    : "bg-white text-[var(--wall-btn-dark-text)] border-[var(--wall-border-default-btn)] hover:bg-[var(--wall-bg-input)]"
                }`}
              >
                {name === "Greg Wientjes" ? "Greg" : name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Outer Composer Card */}
      <div className="rounded-[16px] border-[2px] border-[var(--wall-border)] bg-white p-4">
        {/* Inner Textarea Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-[12px] border-[2px] bg-[var(--wall-bg-input)] transition-colors ${
            isDragging
              ? "border-[var(--wall-border-highlight)] bg-[#EBF4FF]"
              : "border-[var(--wall-border-input)] focus-within:border-[var(--wall-border-highlight)]"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={4}
            disabled={isSubmitting}
            placeholder="Write something on Greg's wall..."
            aria-label="Write something on Greg's wall"
            className="w-full resize-none bg-transparent px-4 py-3 font-sans text-[16px] font-normal leading-snug text-[var(--wall-text-body)] placeholder:text-[var(--wall-border-input)] focus:outline-none disabled:opacity-60"
          />

          {/* Attached Image Thumbnail Previews (horizontal row, borderless) */}
          {attachments.length > 0 && (
            <div className="px-4 pb-3 pt-2 flex flex-row items-center gap-2.5 overflow-x-auto">
              {attachments.map((item) => (
                <div key={item.id} className="relative shrink-0">
                  <img
                    src={item.previewUrl}
                    alt="Attachment preview"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(item.id)}
                    aria-label="Remove attached image"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--wall-border)] text-white shadow hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Character Counter */}
        <div className="mt-1.5 mb-3 flex items-center justify-between">
          <span
            aria-live="polite"
            className={`font-sans text-[12px] font-medium ${
              isAtLimit
                ? "text-red-600"
                : isNearLimit
                ? "text-amber-600"
                : "text-[var(--wall-text-muted)]"
            }`}
          >
            {message.length}/{MAX_MESSAGE_LENGTH}
          </span>
          {attachments.length > 0 && (
            <span className="font-sans text-[12px] text-[var(--wall-text-muted)]">
              {attachments.length}/{MAX_IMAGES_PER_POST} images attached
            </span>
          )}
        </div>

        {/* Collapsible Drop Image Interface */}
        {showDropzone && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Drop images here or click to browse"
            className={`relative mb-3 flex flex-col items-center justify-center gap-1.5 rounded-[12px] border-[2px] border-dashed px-4 py-6 text-center cursor-pointer transition-colors animate-fade-in-up ${
              isDragging
                ? "border-[var(--wall-border-highlight)] bg-[#EBF4FF]"
                : "border-[var(--wall-border-input)] bg-[var(--wall-bg-input)] hover:border-[var(--wall-border-highlight)] hover:bg-[#F1F6FC]"
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropzone(false);
              }}
              aria-label="Close drop image panel"
              className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[var(--wall-text-muted)] hover:bg-[var(--wall-border)]/10 hover:text-[var(--wall-border)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF4FF] text-[var(--wall-text-link)]">
              <UploadCloud className="h-5 w-5" />
            </div>

            <div className="font-sans text-[14px] font-medium text-[var(--wall-text-body)]">
              Drag &amp; drop images here, or{" "}
              <span className="text-[var(--wall-text-link)] underline underline-offset-2">
                browse files
              </span>
            </div>
            <div className="font-sans text-[12px] text-[var(--wall-text-muted)]">
              PNG, JPG, WEBP, or GIF • Up to {MAX_IMAGES_PER_POST} images • Max 5 MB each
            </div>
          </div>
        )}

        {/* Error Message Banner */}
        {error && (
          <div
            role="alert"
            className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800 animate-fade-in-up"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss alert"
              className="shrink-0 rounded-full p-0.5 text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Composer Footer: Upload Image + Blue Share Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => setShowDropzone((prev) => !prev)}
              disabled={isSubmitting || !canAddMore}
              aria-expanded={showDropzone}
              className={`inline-flex items-center gap-2 rounded-[8px] border-[1.5px] px-3.5 py-2 text-[13px] font-sans font-medium transition-colors active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed ${
                showDropzone
                  ? "border-[var(--wall-border-highlight)] bg-[#EBF4FF] text-[var(--wall-btn-dark-text)]"
                  : "border-[var(--wall-border-default-btn)] bg-white hover:bg-[var(--wall-bg-input)] text-[var(--wall-btn-dark-text)]"
              }`}
            >
              <ImagePlus className="h-4 w-4 text-[var(--wall-text-link)]" />
              <span>
                {attachments.length > 0
                  ? canAddMore
                    ? `Add Image (${attachments.length}/${MAX_IMAGES_PER_POST})`
                    : `Max Images (${MAX_IMAGES_PER_POST}/${MAX_IMAGES_PER_POST})`
                  : "Upload Image"}
              </span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!canShare}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-[var(--wall-border-highlight)] bg-[var(--wall-bg-blue)] hover:bg-[#1b72cc] px-6 py-2 text-[14px] font-sans font-semibold text-[var(--wall-btn-white-text)] transition-colors active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
