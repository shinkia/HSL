import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className="h-5 w-full max-w-[120px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}