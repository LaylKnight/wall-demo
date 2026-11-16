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
    <header className="w-full mb-5 select-none">
      <div className="wall-header-bar relative flex items-center justify-between bg-[#2585e8] px-4 py-2 text-white border-[2px] border-[#1f2937] rounded-[8px] shadow-[0_2px_0_rgba(0,0,0,0.18)]">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl sm:text-[26px] font-bold tracking-wide leading-none lowercase drop-shadow-[0_1px_0_rgba(0,0,0,0.2)]">
            wall
          </span>
          <span className="hidden sm:inline-block text-xs font-sans bg-white/15 px-2 py-0.5 rounded-full text-white/95">
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
            className="flex items-center gap-1.5 rounded-md bg-black/20 px-2.5 py-1 text-xs font-sans text-white/95"
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
              className="inline-flex items-center gap-1 rounded-md bg-white/15 hover:bg-white/25 active:bg-white/30 px-2.5 py-1 text-xs font-sans font-medium text-white transition-colors disabled:opacity-50"
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
