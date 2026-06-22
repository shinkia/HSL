import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * Reusable "Load more" button for paginated lists.
 *
 * Props:
 *   - hasMore: boolean — whether more items might exist
 *   - isLoading: boolean — currently fetching the next page
 *   - onLoadMore: () => void
 *   - count: number — current loaded count (optional, for display)
 *   - total: number — total available (optional)
 */
export default function LoadMoreButton({ hasMore, isLoading, onLoadMore, count, total }) {
  if (!hasMore && (!count || count === 0)) return null;
  return (
    <div className="flex flex-col items-center gap-2 py-6">
      {hasMore ? (
        <Button
          variant="outline"
          onClick={onLoadMore}
          disabled={isLoading}
          className="min-w-[140px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              加载中...
            </>
          ) : (
            "加载更多"
          )}
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">— 没有更多了 —</span>
      )}
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground tabular-nums">
          已显示 {count}{typeof total === "number" ? ` / ${total}` : ""} 条
        </span>
      )}
    </div>
  );
}
