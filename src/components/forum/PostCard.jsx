import React from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Eye, Clock, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function PostCard({ post, categories = [], tags = [] }) {
  const category = categories.find((c) => c.id === post.category_id);
  const postTags = (post.tags || []).map((tid) => tags.find((t) => t.id === tid)).filter(Boolean);

  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale: zhCN })
    : "";

  return (
    <Link
      to={`/posts/${post.slug}`}
      className="block group"
    >
      <article className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-card border border-transparent hover:border-primary/10 hover:shadow-sm transition-all duration-200">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {post.is_pinned && (
              <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
            {category && (
              <Badge
                variant="secondary"
                className="text-xs font-normal border"
                style={{
                  borderColor: category.color + "40",
                  backgroundColor: category.color + "10",
                  color: category.color,
                }}
              >
                {category.name}
              </Badge>
            )}
            {postTags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs font-normal text-muted-foreground">
                {tag.name}
              </Badge>
            ))}
          </div>

          <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {post.author_name && (
              <span className="font-medium text-foreground/70">{post.author_name}</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {post.reply_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.view_count || 0}
            </span>
          </div>
        </div>

        {/* Cover image */}
        {post.cover_image && (
          <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
            <img
              src={post.cover_image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </article>
    </Link>
  );
}