import React, { useState, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

export default function LikeButton({ targetType, targetId, count = 0, liked = false, size = "sm" }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [optimisticLiked, setOptimisticLiked] = useState(liked);
  const [optimisticCount, setOptimisticCount] = useState(count);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOptimisticLiked(liked);
  }, [liked]);

  useEffect(() => {
    setOptimisticCount(count);
  }, [count]);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "请先登录后再点赞",
        action: (
          <button
            onClick={() => {
              window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`;
            }}
            className="text-primary font-medium text-sm hover:underline"
          >
            登录
          </button>
        ),
      });
      return;
    }

    if (loading) return;

    const prevLiked = optimisticLiked;
    const prevCount = optimisticCount;

    // Optimistic update
    const newLiked = !prevLiked;
    setOptimisticLiked(newLiked);
    setOptimisticCount(Math.max(0, prevCount + (newLiked ? 1 : -1)));
    setLoading(true);

    try {
      const res = await base44.functions.invoke("toggleLike", {
        target_type: targetType,
        target_id: targetId,
      });
      setOptimisticLiked(res.data.liked);
      setOptimisticCount(res.data.like_count);
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
    } catch (error) {
      // Revert on error
      setOptimisticLiked(prevLiked);
      setOptimisticCount(prevCount);
      toast({ title: "操作失败，请重试" });
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  const textSize = size === "sm" ? "text-xs md:text-sm" : "text-sm";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1 transition-colors disabled:opacity-50 ${
        optimisticLiked ? "text-primary" : "text-gray-400 hover:text-primary"
      }`}
    >
      <ThumbsUp className={`${iconSize} ${optimisticLiked ? "fill-current" : ""}`} />
      <span className={`${textSize} font-medium ${optimisticLiked ? "text-primary" : "text-gray-600"}`}>
        {optimisticCount}
      </span>
    </button>
  );
}