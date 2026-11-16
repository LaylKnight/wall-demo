"use client";

import * as React from "react";
import { X } from "lucide-react";
import { type Post } from "@/lib/posts-store";
import { formatFullTimestamp, formatRelativeTime } from "@/lib/utils";

interface PostFeedProps {
  posts: Post[];
  isLoading: boolean;
  highlightedPostId: string | null;
}

export function PostFeed({
  posts,
  isLoading,
  highlightedPostId,
}: PostFeedProps) {
  const [lightboxImage, setLightboxImage] = React.useState<{
    url: string;
    author: string;
  } | null>(null);

  // Force periodic re-render every 30s so relative timestamps ("Just now", "2m ago") stay live
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 pt-2" aria-busy="true" aria-label="Loading wall posts">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="pb-4 border-b-[3px] border-double border-neutral-400/70 animate-pulse"
          >
            <div className="h-5 w-28 rounded bg-neutral-300/80 mb-2.5" />
            <div className="h-5 w-full rounded bg-neutral-300/60 mb-1.5" />
            <div className="h-5 w-3/4 rounded bg-neutral-300/60" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-neutral-400/70 p-8 text-center font-hand text-xl text-neutral-600">
        No posts on Greg&apos;s Wall yet. Be the first to write something above!
      </div>
    );
  }

  return (
    <>
      <div className="divide-y-0">
        {posts.map((post, idx) => {
          const isNew = post.id === highlightedPostId;
          const isLast = idx === posts.length - 1;

          return (
            <article
              key={post.id}
              className={`py-3.5 transition-colors duration-500 ${
                !isLast
                  ? "border-b-[3px] border-double border-neutral-600/80"
                  : ""
              } ${
                isNew
                  ? "animate-fade-in-up bg-[#2585e8]/8 -mx-2 px-2 rounded-lg"
                  : ""
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <h3 className="font-sans text-[19px] sm:text-[20px] font-semibold text-[#1e1e1e] tracking-tight leading-snug">
                  {post.author_name}
                </h3>

                <time
                  dateTime={post.created_at}
                  title={formatFullTimestamp(post.created_at)}
                  className="font-sans font-normal text-[12px] text-neutral-500 shrink-0 select-none"
                >
                  {formatRelativeTime(post.created_at)}
                </time>
              </div>

              {post.message && (
                <p className="font-sans font-normal text-[17px] sm:text-[18px] text-[#222222] leading-[1.42] whitespace-pre-wrap break-words">
                  {post.message}
                </p>
              )}

              {post.image_url && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxImage({
                        url: post.image_url!,
                        author: post.author_name,
                      })
                    }
                    className="group relative inline-block overflow-hidden rounded-xl border-2 border-neutral-700/80 bg-white p-1.5 shadow-sm transition-transform hover:scale-[1.01]"
                  >
                    <img
                      src={post.image_url}
                      alt={`Uploaded by ${post.author_name}`}
                      className="max-h-64 w-auto rounded-lg object-contain"
                    />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Lightbox Modal for Uploaded Post Images */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-fade-in-up"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-3xl rounded-2xl border-2 border-neutral-800 bg-[#edece8] p-3 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="Close image preview"
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-white shadow-md hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={lightboxImage.url}
              alt={`Shared by ${lightboxImage.author}`}
              className="max-h-[80vh] w-auto rounded-xl object-contain mx-auto"
            />
            <div className="mt-2 text-center font-hand text-base text-neutral-700">
              Shared by {lightboxImage.author}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
