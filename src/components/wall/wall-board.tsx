"use client";

import * as React from "react";
import { X } from "lucide-react";
import { WallHeader } from "@/components/wall/wall-header";
import { ProfileSidebar } from "@/components/wall/profile-sidebar";
import { PostComposer } from "@/components/wall/post-composer";
import { PostFeed } from "@/components/wall/post-feed";
import {
  STORAGE_KEY,
  createPost,
  fetchPosts,
  getSupabaseClient,
  mapSupabaseRowToPost,
  resetLocalPostsToSeed,
  type CreatePostInput,
  type Post,
  type SupabasePostRow,
} from "@/lib/posts-store";

export function WallBoard() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [feedError, setFeedError] = React.useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = React.useState<string | null>(
    null
  );

  const loadPosts = React.useCallback(async () => {
    setFeedError(null);
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      setFeedError(
        err instanceof Error ? err.message : "Failed to load Wall posts."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  // Listen for cross-tab localStorage updates or Supabase Realtime events
  React.useEffect(() => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const channel = supabase
        .channel("public:posts")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "posts" },
          (payload) => {
            const incoming = mapSupabaseRowToPost(
              payload.new as SupabasePostRow
            );
            setPosts((prev) => {
              if (prev.some((p) => p.id === incoming.id)) return prev;
              return [incoming, ...prev];
            });
            setHighlightedPostId(incoming.id);
          }
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        void loadPosts();
      }
    };
    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, [loadPosts]);

  React.useEffect(() => {
    if (!highlightedPostId) return;
    const timer = setTimeout(() => {
      setHighlightedPostId(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [highlightedPostId]);

  React.useEffect(() => {
    if (!feedError) return;
    const timer = setTimeout(() => {
      setFeedError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [feedError]);

  const handleSharePost = async (input: CreatePostInput) => {
    setIsSubmitting(true);
    try {
      const created = await createPost(input);
      setPosts((prev) => {
        const filtered = prev.filter((p) => p.id !== created.id);
        return [created, ...filtered];
      });
      setHighlightedPostId(created.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const reset = await resetLocalPostsToSeed();
      setPosts(reset);
      setHighlightedPostId(null);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[var(--wall-text-body)] py-4 px-4 sm:px-6">
      <div className="mx-auto max-w-[980px]">
        {/* Top Blue "thewall" Bar */}
        <WallHeader
          onResetDemo={handleResetDemo}
          isResetting={isResetting}
          postCount={posts.length}
        />

        {/* Two-Column 2008 Facebook Wall Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Sticky Left Column: Greg's Photo + Information Box */}
          <ProfileSidebar />

          {/* Right Column: Greg Wientjes Header + Wall Composer + Live Feed */}
          <main className="flex-1 w-full min-w-0">
            <h1 className="font-sans text-[30px] sm:text-[34px] font-bold text-[var(--wall-text-heading)] tracking-tight leading-tight mb-1">
              Greg Wientjes
            </h1>

            <div className="font-sans font-semibold text-[18px] text-[var(--wall-btn-dark-text)] mb-4">
              Wall
            </div>

            <PostComposer
              onSharePost={handleSharePost}
              isSubmitting={isSubmitting}
            />

            <hr className="border-t-[2px] border-[var(--wall-border)] my-5" />

            {feedError && (
              <div
                role="alert"
                className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 animate-fade-in-up"
              >
                <span>{feedError}</span>
                <button
                  type="button"
                  onClick={() => setFeedError(null)}
                  aria-label="Dismiss error"
                  className="shrink-0 rounded-full p-0.5 text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <PostFeed
              posts={posts}
              isLoading={isLoading}
              highlightedPostId={highlightedPostId}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
