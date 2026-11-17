"use client";

import * as React from "react";
import { X } from "lucide-react";
import { parsePhotoUrls, type Post } from "@/lib/posts-store";
import { isSafeImageUrl } from "@/lib/security";
import { formatFullTimestamp, formatRelativeTime } from "@/lib/utils";

function getPostImages(post: Post): string[] {
  if (post.image_urls && post.image_urls.length > 0) {
    return post.image_urls.filter(isSafeImageUrl);
  }
  return parsePhotoUrls(post.image_url);
}

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
      <div className="rounded-xl border-2 border-dashed border-[var(--wall-border-input)] p-8 text-center font-sans text-base text-[var(--wall-text-muted)]">
        No posts on Greg&apos;s Wall yet. Be the first to write something above!
      </div>
    );
  }

  return (
    <>
      <div>
        {posts.map((post) => {
          const isNew = post.id === highlightedPostId;
          const postImages = getPostImages(post);

          return (
            <article
              key={post.id}
              className={`py-4 border-b border-[#466482]/20 transition-colors duration-700 -mx-2 px-2 ${
                isNew
                  ? "animate-fade-in-up bg-[#F8F9FB]"
                  : "bg-transparent"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <h3 className="font-sans text-[16px] sm:text-[17px] font-semibold text-[var(--wall-text-heading)] tracking-tight leading-snug">
                  {post.author_name}
                </h3>

                <time
                  dateTime={post.created_at}
                  title={formatFullTimestamp(post.created_at)}
                  className="font-sans font-normal text-[12px] text-[var(--wall-text-muted)] shrink-0 select-none"
                >
                  {formatRelativeTime(post.created_at)}
                </time>
              </div>

              {post.message && (
                <p className="font-sans font-normal text-[15px] sm:text-[16px] text-[var(--wall-text-body)] leading-[1.45] whitespace-pre-wrap break-words">
                  {post.message}
                </p>
              )}

              {postImages.length === 1 && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxImage({
                        url: postImages[0],
                        author: post.author_name,
                      })
                    }
                    className="group relative inline-block overflow-hidden rounded-xl transition-transform hover:scale-[1.01]"
                  >
                    <img
                      src={postImages[0]}
                      alt={`Uploaded by ${post.author_name}`}
                      className="max-h-64 w-auto rounded-xl object-contain"
                    />
                  </button>
                </div>
              )}

              {postImages.length > 1 && (
                <div className="mt-2.5 grid grid-cols-2 gap-2 max-w-lg">
                  {postImages.map((url, idx) => (
                    <button
                      key={`${post.id}-img-${idx}`}
                      type="button"
                      onClick={() =>
                        setLightboxImage({
                          url,
                          author: post.author_name,
                        })
                      }
                      className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl transition-transform hover:scale-[1.01]"
                    >
                      <img
                        src={url}
                        alt={`Uploaded by ${post.author_name} (${idx + 1})`}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    </button>
                  ))}
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
            className="relative max-h-[90vh] max-w-3xl rounded-2xl border-2 border-[var(--wall-border)] bg-white p-3 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="Close image preview"
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--wall-border)] bg-[var(--wall-border)] text-white shadow-md hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={lightboxImage.url}
              alt={`Shared by ${lightboxImage.author}`}
              className="max-h-[80vh] w-auto rounded-xl object-contain mx-auto"
            />
            <div className="mt-2 text-center font-sans text-sm font-medium text-[var(--wall-text-body)]">
              Shared by {lightboxImage.author}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
