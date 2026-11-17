import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isSafeImageUrl,
  reencodeSafeImageBlob,
  sanitizeTextInput,
  validateImageFile,
} from "@/lib/security";

export interface Post {
  id: string;
  author_name: string;
  message: string;
  image_url?: string | null;
  image_urls?: string[];
  created_at: string;
}

export interface CreatePostInput {
  author_name: string;
  message: string;
  imageFiles?: File[];
  imageDataUrls?: string[];
  imageFile?: File | null;
  imageDataUrl?: string | null;
}

export const MAX_MESSAGE_LENGTH = 280;
export const MAX_IMAGES_PER_POST = 4;
export const STORAGE_KEY = "wall_demo_posts_v1";
export const AUTHOR_STORAGE_KEY = "wall_demo_author_v1";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET?.trim() || "wall-images";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

/**
 * Exact seed posts from the 2008-style Greg Wientjes Wall reference mockup,
 * ordered newest-first in reverse chronological order.
 */
export function getInitialSeedPosts(): Post[] {
  const now = Date.now();
  const min = 60 * 1000;
  const hour = 60 * min;

  return [
    {
      id: "seed-1-anna",
      author_name: "Anna",
      message:
        "Hey Greg, did you debug your coffee maker yet? Last cup tasted like JavaScript errors.",
      image_url: null,
      created_at: new Date(now - 5 * min).toISOString(),
    },
    {
      id: "seed-2-adelaida",
      author_name: "Adelaida",
      message:
        "Greg, saw your last coding session—pretty sure you broke Stack Overflow again! 🚨",
      image_url: null,
      created_at: new Date(now - 22 * min).toISOString(),
    },
    {
      id: "seed-3-juho",
      author_name: "Juho",
      message:
        "Greg, are you still coding in pajamas, or have you upgraded to full-time sweatpants mode?",
      image_url: null,
      created_at: new Date(now - 1 * hour).toISOString(),
    },
    {
      id: "seed-4-maija",
      author_name: "Maija",
      message:
        "Greg, rumor has it your computer has more stickers than code running on it. Confirm?",
      image_url: null,
      created_at: new Date(now - 3 * hour).toISOString(),
    },
    {
      id: "seed-5-alex",
      author_name: "Alex",
      message:
        "Yo Greg, just pulled an all-nighter on the assignment. Turns out sleep deprivation doesn’t improve coding skills. Weird!",
      image_url: null,
      created_at: new Date(now - 6 * hour).toISOString(),
    },
    {
      id: "seed-6-sheryl",
      author_name: "Sheryl",
      message:
        "Greg, when are we gonna deploy your latest dance moves to production? #AgileDancer",
      image_url: null,
      created_at: new Date(now - 24 * hour).toISOString(),
    },
  ];
}

function sortNewestFirst(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Compress an uploaded image into a compact Data URL for reliable localStorage
 * persistence while keeping visual crispness.
 */
export async function fileToCompressedDataUrl(
  file: File,
  maxWidth = 1000,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/webp", quality);
        resolve(compressed);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export interface SupabasePostRow {
  id: string;
  user_id?: string | null;
  author_name?: string | null;
  body?: string | null;
  photo_url?: string | null;
  created_at?: string | null;
}

export function parsePhotoUrls(raw?: string | null): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (u): u is string => typeof u === "string" && isSafeImageUrl(u)
        );
      }
    } catch {
      return [];
    }
  }
  return isSafeImageUrl(trimmed) ? [trimmed] : [];
}

function serializePhotoUrls(urls: string[]): string | null {
  if (urls.length === 0) return null;
  if (urls.length === 1) return urls[0];
  return JSON.stringify(urls);
}

export function mapSupabaseRowToPost(row: SupabasePostRow): Post {
  const urls = parsePhotoUrls(row.photo_url);
  return {
    id: row.id,
    author_name: sanitizeTextInput(row.author_name?.trim() || "Greg Wientjes"),
    message: sanitizeTextInput(row.body ?? ""),
    image_url: urls[0] ?? null,
    image_urls: urls,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

export async function fetchPosts(): Promise<Post[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("posts")
      .select("id, user_id, author_name, body, photo_url, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "Failed to load posts from Supabase.");
    }
    return ((data as SupabasePostRow[]) ?? []).map(mapSupabaseRowToPost);
  }

  // LocalStorage fallback mode
  if (typeof window === "undefined") {
    return getInitialSeedPosts();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeds = getInitialSeedPosts();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      return seeds;
    }
    const parsed = JSON.parse(raw) as Post[];
    if (!Array.isArray(parsed)) {
      const seeds = getInitialSeedPosts();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
      return seeds;
    }
    return sortNewestFirst(parsed);
  } catch {
    return getInitialSeedPosts();
  }
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const trimmedAuthor =
    sanitizeTextInput(input.author_name).trim().slice(0, 60) || "Greg Wientjes";
  const trimmedMessage = sanitizeTextInput(input.message).trim();

  const files: File[] = input.imageFiles?.length
    ? input.imageFiles
    : input.imageFile
    ? [input.imageFile]
    : [];
  const dataUrls: string[] = input.imageDataUrls?.length
    ? input.imageDataUrls
    : input.imageDataUrl
    ? [input.imageDataUrl]
    : [];

  if (!trimmedMessage && files.length === 0 && dataUrls.length === 0) {
    throw new Error("Please write a message or attach an image before sharing.");
  }

  if (files.length > MAX_IMAGES_PER_POST || dataUrls.length > MAX_IMAGES_PER_POST) {
    throw new Error(`You can attach up to ${MAX_IMAGES_PER_POST} images per post.`);
  }

  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    throw new Error(
      `Message exceeds the ${MAX_MESSAGE_LENGTH}-character limit (${trimmedMessage.length}/${MAX_MESSAGE_LENGTH}).`
    );
  }

  for (const url of dataUrls) {
    if (!isSafeImageUrl(url)) {
      throw new Error("Invalid image data.");
    }
  }

  const validatedFiles: Array<{ file: File; mime: string }> = [];
  for (const file of files) {
    const check = await validateImageFile(file);
    if (!check.valid) {
      throw new Error(check.error);
    }
    validatedFiles.push({ file, mime: check.mime });
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    let uploadedUrls: string[] = [...dataUrls];

    if (validatedFiles.length > 0) {
      uploadedUrls = await Promise.all(
        validatedFiles.map(async ({ file, mime }) => {
          const { blob, ext, contentType } = await reencodeSafeImageBlob(
            file,
            mime
          );
          const filePath = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from(storageBucket)
            .upload(filePath, blob, {
              cacheControl: "3600",
              contentType,
              upsert: false,
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from(storageBucket)
              .getPublicUrl(filePath);
            return publicUrlData.publicUrl;
          }
          return fileToCompressedDataUrl(file);
        })
      );
    }

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          author_name: trimmedAuthor,
          body: trimmedMessage,
          photo_url: serializePhotoUrls(uploadedUrls),
        },
      ])
      .select("id, user_id, author_name, body, photo_url, created_at")
      .single();

    if (error) {
      throw new Error(error.message || "Failed to publish post to Supabase.");
    }
    return mapSupabaseRowToPost(data as SupabasePostRow);
  }

  // LocalStorage mode
  let localUrls: string[] = [...dataUrls];
  if (localUrls.length === 0 && validatedFiles.length > 0) {
    localUrls = await Promise.all(
      validatedFiles.map(({ file }) => fileToCompressedDataUrl(file))
    );
  }

  // Tiny simulated network latency for realistic loading state feedback
  await new Promise((res) => setTimeout(res, 220));

  const newPost: Post = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author_name: trimmedAuthor,
    message: trimmedMessage,
    image_url: localUrls[0] ?? null,
    image_urls: localUrls,
    created_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const existing = await fetchPosts();
    const updated = sortNewestFirst([newPost, ...existing]);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      throw new Error(
        "Browser localStorage is full. Try clearing or resetting demo posts, or use a smaller image."
      );
    }
  }

  return newPost;
}

export async function resetLocalPostsToSeed(): Promise<Post[]> {
  const seeds = getInitialSeedPosts();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  }
  return seeds;
}
