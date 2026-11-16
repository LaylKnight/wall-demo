"use client";

import * as React from "react";
import { WallHeader } from "@/components/wall/wall-header";
import { ProfileSidebar } from "@/components/wall/profile-sidebar";
import { PostComposer } from "@/components/wall/post-composer";
import { PostFeed } from "@/components/wall/post-feed";
import {
  STORAGE_KEY,
  createPost,
  fetchPosts,
  getSupabaseClient,
  resetLocalPostsToSeed,
  type CreatePostInput,
  type Post,
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
            const incoming = payload.new as Post;
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

  const handleSharePost = async (input: CreatePostInput) => {
    setIsSubmitting(true);
    try {
      const created = await createPost(input);
      setPosts((prev) => {
        const filtered = prev.filter((p) => p.id !== created.id);
        return [created, ...filtered];
      });
      setHighlightedPostId(created.id);
      setTimeout(() => {
        setHighlightedPostId((current) =>
          current === created.id ? null : current
        );
      }, 2500);
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
    <div className="min-h-screen bg-[#edece8] text-[#1f1f1f] py-3 px-3 sm:px-6">
      <div className="mx-auto max-w-[920px]">
        {/* Top Blue "wall" Bar */}
        <WallHeader
          onResetDemo={handleResetDemo}
          isResetting={isResetting}
          postCount={posts.length}
        />

        {/* Two-Column 2008 Facebook Wall Layout */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Left Column: Greg's Photo + Information Box */}
          <ProfileSidebar />

          {/* Right Column: Greg Wientjes Header + Wall Composer + Live Feed */}
          <main className="flex-1 w-full min-w-0">
            <h1 className="font-sans text-[28px] sm:text-[31px] font-bold text-[#1e1e1e] tracking-tight leading-tight mb-3">
              Greg Wientjes
            </h1>

            <div className="font-sans font-semibold text-[20px] text-[#222222] mb-2">
              Wall
            </div>

            <PostComposer
              onSharePost={handleSharePost}
              isSubmitting={isSubmitting}
            />

            {feedError && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                {feedError}
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
