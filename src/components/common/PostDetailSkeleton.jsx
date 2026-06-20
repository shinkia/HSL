import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PostDetailSkeleton() {
  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-sm border mb-4">
      <Skeleton className="w-full h-72" />
      <div className="px-5 sm:px-8 py-6">
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 w-3/4 mb-4" />
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </article>
  );
}