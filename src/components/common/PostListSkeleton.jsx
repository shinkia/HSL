import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PostListSkeleton({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0">
          <Skeleton className="w-[72px] h-[72px] rounded-lg shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      ))}
    </>
  );
}