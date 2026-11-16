"use client";

import * as React from "react";
import { ImagePlus, Loader2, AlertCircle, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AUTHOR_STORAGE_KEY,
  MAX_MESSAGE_LENGTH,
  fileToCompressedDataUrl,
  type CreatePostInput,
} from "@/lib/posts-store";

interface PostComposerProps {
  onSharePost: (input: CreatePostInput) => Promise<void>;
  isSubmitting: boolean;
}

const QUICK_AUTHORS = ["Greg Wientjes", "Anna", "Adelaida", "Juho", "Maija", "Alex", "Sheryl"];

export function PostComposer({ onSharePost, isSubmitting }: PostComposerProps) {
  const [authorName, setAuthorName] = React.useState("Greg Wientjes");
  const [message, setMessage] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
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

  const processSelectedFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP, or GIF).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image size must be under 8 MB.");
      return;
    }
    try {
      const previewDataUrl = await fileToCompressedDataUrl(file);
      setImageFile(file);
      setImagePreview(previewDataUrl);
    } catch {
      setError("Could not process the selected image. Please try another file.");
    }
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedMsg = message.trim();
    if (!trimmedMsg && !imagePreview) {
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
        imageFile,
        imageDataUrl: imagePreview,
      });
      setMessage("");
      setImageFile(null);
      setImagePreview(null);
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
    !isSubmitting && (message.trim().length > 0 || Boolean(imagePreview));

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      {/* Author Name Bar */}
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <div className="relative flex items-center w-full sm:w-64">
          <User className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-neutral-500" />
          <Input
            type="text"
            value={authorName}
            onChange={(e) => handleAuthorChange(e.target.value)}
            placeholder="Your name (e.g. Anna)"
            maxLength={50}
            aria-label="Author name"
            className="pl-8 h-8 font-hand text-[16px] bg-white/75 border-neutral-400/90 focus-visible:ring-[#2585e8]"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap text-xs">
          <span className="text-neutral-500 font-sans text-[11px] mr-0.5">
            Post as:
          </span>
          {QUICK_AUTHORS.map((name) => {
            const active = authorName.trim().toLowerCase() === name.toLowerCase();
            return (
              <button
                key={name}
                type="button"
                onClick={() => handleAuthorChange(name)}
                className={`px-2 py-0.5 rounded-full font-hand text-[13px] transition-colors border ${
                  active
                    ? "bg-[#2585e8] text-white border-[#2585e8]"
                    : "bg-white/60 text-neutral-700 border-neutral-300 hover:bg-white"
                }`}
              >
                {name === "Greg Wientjes" ? "Greg" : name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reference-style Dashed & Striped Message Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`wall-composer-box relative rounded-[18px] border-[3px] border-dashed transition-all ${
          isDragging
            ? "border-[#2585e8] bg-[#d8ecff]/80 scale-[1.005]"
            : "border-[#2b2b2b]"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={3}
          disabled={isSubmitting}
          placeholder="Write something on Greg's Wall... (max 280 characters)"
          aria-label="Write something on Greg's Wall"
          className="w-full resize-none bg-transparent px-4 py-3 font-hand text-[20px] leading-snug text-[#1f1f1f] placeholder:text-[#3a4a5e]/60 focus:outline-none disabled:opacity-60"
        />

        {/* Attached Image Preview inside the composer */}
        {imagePreview && (
          <div className="px-4 pb-3 pt-1">
            <div className="relative inline-block rounded-xl border-2 border-[#2b2b2b]/80 bg-white p-1.5 shadow-sm">
              <img
                src={imagePreview}
                alt="Attachment preview"
                className="max-h-44 w-auto rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                aria-label="Remove attached image"
                className="absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-white shadow hover:bg-red-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message Banner */}
      {error && (
        <div
          role="alert"
          className="mt-2.5 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800 animate-fade-in-up"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Composer Footer: Image Upload + Character Counter + Blue Share Button */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-400/90 bg-white/80 hover:bg-white px-3 py-1.5 text-xs font-sans font-medium text-neutral-800 shadow-sm transition-all active:translate-y-[1px] disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4 text-[#2585e8]" />
            <span>{imagePreview ? "Change Photo" : "Upload Photo"}</span>
          </button>

          {/* Character Counter Pill */}
          <div
            aria-live="polite"
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-sans font-medium transition-colors ${
              isAtLimit
                ? "bg-red-100 text-red-700 border border-red-300"
                : isNearLimit
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-black/5 text-neutral-600"
            }`}
          >
            <span>
              {message.length} / {MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>

        <Button
          type="submit"
          variant="wallShare"
          size="lg"
          disabled={!canShare}
          className="min-w-[108px] h-11 px-6 text-[21px] font-bold tracking-wide shadow-[0_2px_0_#155799]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-base">Sharing...</span>
            </>
          ) : (
            "Share"
          )}
        </Button>
      </div>
    </form>
  );
}
