export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGE_SIZE_LABEL = "5 MB";

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/**
 * Strip ASCII control characters (except \n, \r, \t) and Unicode bidi/zero-width
 * spoofing characters while preserving normal text and emojis.
 */
export function sanitizeTextInput(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "");
}

/**
 * Allow only safe HTTPS URLs or raster image Data URLs (blocks javascript:,
 * data:text/html, and data:image/svg+xml).
 */
export function isSafeImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (/^https:\/\//i.test(trimmed)) return true;
  if (/^http:\/\/localhost(?::\d+)?\//i.test(trimmed)) return true;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(trimmed)) {
    return true;
  }
  return false;
}

function detectImageMagicBytes(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // GIF: GIF8 (47 49 46 38)
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }

  // WEBP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export async function validateImageFile(
  file: File
): Promise<{ valid: true; mime: string } | { valid: false; error: string }> {
  if (!file || file.size === 0) {
    return { valid: false, error: "Selected image file is empty." };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image size must be under ${MAX_IMAGE_SIZE_LABEL}.`,
    };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: "Only PNG, JPG, WEBP, and GIF images are allowed.",
    };
  }

  try {
    const headerBuffer = await file.slice(0, 12).arrayBuffer();
    const detectedMime = detectImageMagicBytes(new Uint8Array(headerBuffer));
    if (!detectedMime || !ALLOWED_IMAGE_MIME_TYPES.has(detectedMime)) {
      return {
        valid: false,
        error:
          "Invalid or corrupted image file. Please choose a real PNG, JPG, WEBP, or GIF.",
      };
    }
    return { valid: true, mime: detectedMime };
  } catch {
    return {
      valid: false,
      error: "Could not verify the selected image file.",
    };
  }
}

/**
 * Re-encode static raster images through Canvas as WebP to strip EXIF metadata
 * and any trailing payloads while keeping dimensions reasonable.
 */
export async function reencodeSafeImageBlob(
  file: File,
  detectedMime: string,
  maxWidth = 1200,
  quality = 0.85
): Promise<{ blob: Blob; ext: string; contentType: string }> {
  if (detectedMime === "image/gif") {
    return { blob: file, ext: "gif", contentType: "image/gif" };
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image."));
    };
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to encode image."));
            return;
          }
          resolve({ blob, ext: "webp", contentType: "image/webp" });
        },
        "image/webp",
        quality
      );
    };
    img.src = objectUrl;
  });
}
