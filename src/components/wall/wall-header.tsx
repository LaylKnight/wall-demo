"use client";

import * as React from "react";
import { Database, HardDrive, RotateCcw } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/posts-store";

interface WallHeaderProps {
  onResetDemo: () => void;
  isResetting: boolean;
  postCount: number;
}

export function WallHeader({
  onResetDemo,
  isResetting,
  postCount,
}: WallHeaderProps) {
  return (
    <header className="w-full mb-6 select-none">
      <div className="relative flex items-center justify-between bg-[var(--wall-bg-header)] px-5 py-2.5 text-[var(--wall-text-light)] border-[2px] border-[var(--wall-border)] rounded-[10px]">
        <div className="flex items-center gap-3">
          <span className="font-sans text-2xl sm:text-[26px] font-bold tracking-tight leading-none lowercase">
            thewall
          </span>
          <span className="hidden sm:inline-block text-xs font-medium bg-white/15 px-2.5 py-0.5 rounded-full text-[var(--wall-text-light)]">
            {postCount} {postCount === 1 ? "post" : "posts"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            title={
              isSupabaseConfigured
                ? "Connected to Supabase Database + Realtime"
                : "Running in LocalStorage Mode (persists across refreshes; ready for Supabase)"
            }
            className="flex items-center gap-1.5 rounded-md bg-[#06305C]/25 px-2.5 py-1 text-xs font-medium text-[var(--wall-text-light)]"
          >
            {isSupabaseConfigured ? (
              <>
                <Database className="h-3.5 w-3.5 text-emerald-300" />
                <span className="hidden md:inline">Supabase Live</span>
              </>
            ) : (
              <>
                <HardDrive className="h-3.5 w-3.5 text-amber-200" />
                <span className="hidden md:inline">LocalStorage Mode</span>
              </>
            )}
          </div>

          {!isSupabaseConfigured && (
            <button
              type="button"
              onClick={onResetDemo}
              disabled={isResetting}
              title="Reset wall posts back to the original 6 demo posts"
              className="inline-flex items-center gap-1 rounded-md bg-white/15 hover:bg-white/25 active:bg-white/30 px-2.5 py-1 text-xs font-medium text-[var(--wall-text-light)] transition-colors disabled:opacity-50"
            >
              <RotateCcw
                className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`}
              />
              <span>Reset Demo</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
