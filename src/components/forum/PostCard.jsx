import React from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%23f3f4f6'%3E%3Crect width='80' height='80'/%3E%3C/svg%3E";

export default function PostCard({ post, categories = [], tags = [] }) {
  const category = categories.find((c) => c.id === post.category_id);
  const postTags = (post.tags || []).map((tid) => tags.find((t) => t.id === tid)).filter(Boolean);

  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: false, locale: zhCN })
    : "";

  const isPinned = post.is_pinned;

  return (
    <Link to={`/posts/${post.slug}`} className="block group">
      <article
        className={`flex items-center gap-3 px-3 md:px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-gray-50 ${
          isPinned ? "bg-green-50 hover:bg-green-100/70" : "bg-white"
        }`}
      >
        {/* Thumbnail */}
        <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={post.cover_image || PLACEHOLDER_IMG}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="text-[15px] font-semibold text-[#1a1a1a] group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1.5">
            {isPinned && (
              <span className="inline-block mr-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded align-middle">置顶</span>
            )}
            {post.title}
          </h3>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {category && (
              <span
                className="badge-category"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </span>
            )}
            {postTags.map((tag) => (
              <span
                key={tag.id}
                className="badge-tag"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        {/* Right: replies + time */}
        <div className="shrink-0 flex flex-col items-end gap-1 text-right ml-1.5 md:ml-2">
          <div className="flex items-center gap-1 text-gray-400">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="text-xs md:text-sm font-medium text-gray-600">{post.reply_count || 0}</span>
          </div>
          <span className="text-[11px] md:text-xs text-gray-400 whitespace-nowrap">{timeAgo}</span>
        </div>
      </article>
    </Link>
  );
}