"use client";

import React from "react";

export interface AvatarCirclesProps {
  className?: string;
  numPeople?: number;
  avatarUrls: Array<{
    imageUrl?: string;
    profileUrl?: string;
    name?: string;
    initials?: string;
  }>;
}

export function AvatarCircles({
  numPeople,
  avatarUrls,
  className = "",
}: AvatarCirclesProps) {
  return (
    <div className={`flex items-center -space-x-2 rtl:space-x-reverse ${className}`}>
      {avatarUrls.map((url, index) => (
        <div
          key={index}
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[11px] font-semibold text-[#001d3d] shadow-sm hover:z-10 transition-transform hover:scale-105"
          title={url.name}
        >
          {url.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="h-full w-full rounded-full object-cover"
              src={url.imageUrl}
              alt={url.name || `Avatar ${index + 1}`}
            />
          ) : (
            <span>{url.initials || url.name?.slice(0, 2).toUpperCase() || "HR"}</span>
          )}
        </div>
      ))}
      {(numPeople !== undefined && numPeople > 0) && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#001d3d] text-[10px] font-medium text-white shadow-sm">
          +{numPeople}
        </div>
      )}
    </div>
  );
}
