import React from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getPostUrl } from "@/lib/locations";
import LikeButton from "@/components/forum/LikeButton";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23f3f4f6'%3E%3Crect width='80' height='80'/%3E%3C/svg%3E";

export default function PostCard({ post, categories = [], tags = [], likedPostIds }) {
  const category = categories.find((c) => c.id === post.category_id);
  const postTags = (post.tags || []).map((tid) => tags.find((t) => t.id === tid)).filter(Boolean);

  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: false, locale: zhCN })
    : "";

  const isPinned = post.is_pinned;

  return (
    <article
      className={`flex items-center gap-3 px-3 md:px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-muted ${
        isPinned ? "bg-green-50 hover:bg-green-100/70" : "bg-white"
      }`}
    >
      {/* Thumbnail */}
      <Link to={getPostUrl(post)} className="shrink-0">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={post.cover_image || PLACEHOLDER_IMG}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
          />
        </div>
      </Link>

      {/* Main content */}
      <div className="flex-1 min-w-0 py-0.5">
        <Link to={getPostUrl(post)} className="block">
          <h3 className="text-[15px] font-semibold text-[#1a1a1a] hover:text-primary transition-colors line-clamp-2 leading-snug mb-1.5">
            {isPinned && (
              <span className="inline-block mr-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded align-middle">置顶</span>
            )}
            {post.title}
          </h3>
        </Link>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {post.post_type === "fr" && (
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded">心得</span>
          )}
          {post.post_type === "qna" && (
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">问答</span>
          )}
          {category && (
            <Link
              to={`/category/${category.slug}`}
              className="badge-category hover:opacity-90 transition-opacity"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </Link>
          )}
          {postTags.map((tag) => (
            <Link
              key={tag.id}
              to={`/tag/${tag.slug}`}
              className="badge-tag hover:opacity-80 transition-opacity"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: likes + replies + time */}
      <div className="shrink-0 flex flex-col items-end gap-1 ml-1.5 md:ml-2">
        <div className="flex items-center gap-3">
          <LikeButton targetType="post" targetId={post.id} count={post.like_count || 0} liked={likedPostIds?.has(post.id) || false} />
          <Link to={getPostUrl(post)} className="flex items-center gap-1 text-gray-400">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="text-xs md:text-sm font-medium text-gray-600">{post.reply_count || 0}</span>
          </Link>
        </div>
        <Link to={getPostUrl(post)}>
          <span className="text-[11px] md:text-xs text-gray-400 whitespace-nowrap">{timeAgo}</span>
        </Link>
      </div>
    </article>
  );
}