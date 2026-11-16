"use client";

import * as React from "react";

export function ProfileSidebar() {
  return (
    <aside className="w-full md:w-[250px] lg:w-[270px] shrink-0 flex flex-col gap-5">
      {/* Greg Wientjes Profile Portrait cropped directly from the reference image */}
      <div className="w-full max-w-[260px] mx-auto md:max-w-none overflow-hidden rounded-[18px] bg-[#d8d7d2] shadow-sm border-[1.5px] border-neutral-400/80">
        <div className="relative w-full aspect-[524/514] overflow-hidden">
          <img
            src="/reference-wall.webp"
            alt="Greg Wientjes"
            className="block select-none pointer-events-none max-w-none"
            style={{
              width: "355.53%",
              marginLeft: "-4.96%",
              marginTop: "-25.57%",
            }}
          />
        </div>
      </div>

      {/* 2008-Style Information Box */}
      <div className="flex flex-col gap-1.5 text-[#222222]">
        <div className="wall-info-header px-3.5 py-1.5 rounded-[10px] border-[1.5px] border-neutral-500/80 font-sans font-semibold text-[18px] leading-snug tracking-tight">
          Information
        </div>

        <div className="wall-info-card px-4 py-4 rounded-[18px] border-[1.5px] border-neutral-400/80 font-sans text-[16px] leading-[1.4] space-y-4">
          <div>
            <div className="font-medium text-neutral-600 text-[14px]">Networks</div>
            <div className="font-normal text-neutral-900">Stanford Alum</div>
          </div>

          <div>
            <div className="font-medium text-neutral-600 text-[14px]">Current City</div>
            <div className="font-normal text-neutral-900">Palo Alto, CA</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
