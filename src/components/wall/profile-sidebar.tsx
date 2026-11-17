"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface SidebarCardProps {
  title: string;
  children: React.ReactNode;
}

function SidebarCard({ title, children }: SidebarCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="w-full overflow-hidden rounded-[12px] border-[2px] border-[var(--wall-border)] bg-white text-[var(--wall-text-body)]">
      {/* Mobile Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between bg-[#EBF4FF] px-2.5 sm:px-4 py-2 font-sans font-semibold text-[15px] sm:text-[16px] text-[var(--wall-btn-dark-text)] sm:hidden"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--wall-btn-dark-text)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Tablet/Desktop Static Header */}
      <div className="hidden sm:block bg-[#EBF4FF] px-4 py-2 border-b-[2px] border-[var(--wall-border)] font-sans font-semibold text-[16px] text-[var(--wall-btn-dark-text)]">
        {title}
      </div>

      {/* Content: collapsible on mobile, always visible on sm+ */}
      <div
        className={`${
          isOpen ? "block border-t-[2px] border-[var(--wall-border)]" : "hidden"
        } sm:block sm:border-t-0 px-2.5 sm:px-4 py-3 sm:py-4 font-sans text-[13px] sm:text-[14px] leading-[1.45]`}
      >
        {children}
      </div>
    </div>
  );
}

export function ProfileSidebar() {
  return (
    <aside className="w-full lg:w-[260px] shrink-0 grid grid-cols-2 lg:flex lg:flex-col gap-3 sm:gap-5 lg:sticky lg:top-5 items-start lg:items-stretch">
      {/* Greg Wientjes Profile Portrait */}
      <div className="w-full overflow-hidden rounded-[12px] bg-[#F8F9FB] border-[1.5px] border-[var(--wall-border)]/25 shadow-sm">
        <div className="relative w-full aspect-square overflow-hidden">
          <img
            src="/greg-profile.png"
            alt="Greg Wientjes"
            className="w-full h-full object-cover block select-none pointer-events-none"
          />
        </div>
      </div>

      {/* Bio + Information Cards (accordion on mobile, static cards on sm+) */}
      <div className="w-full flex flex-col gap-3 sm:gap-5">
        <SidebarCard title="Bio">
          <div className="max-h-[130px] overflow-y-auto pr-1 pb-2">
            <p className="font-normal text-[var(--wall-text-body)]">
              Builder, coffee enthusiast, and lifelong learner based in Palo Alto.
              Always tinkering with web apps, late-night side projects, and
              questionable dance moves.
            </p>
          </div>
        </SidebarCard>

        <SidebarCard title="Information">
          <div className="space-y-4">
            <div>
              <div className="font-semibold text-[var(--wall-text-heading)]">
                Networks:
              </div>
              <div className="font-normal text-[var(--wall-text-body)]">
                Stanford Alum
              </div>
            </div>

            <div>
              <div className="font-semibold text-[var(--wall-text-heading)]">
                Current City:
              </div>
              <div className="font-normal text-[var(--wall-text-body)]">
                Palo Alto, CA
              </div>
            </div>
          </div>
        </SidebarCard>
      </div>
    </aside>
  );
}
