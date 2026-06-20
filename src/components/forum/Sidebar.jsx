import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Users } from "lucide-react";

export default function Sidebar({ categories = [], tags = [], memberCount = 0, onNavigate }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const handleClick = () => {
    if (onNavigate) onNavigate();
  };

  const isCategoryActive = (cat) => currentPath === `/category/${cat.slug}`;
  const isTagActive = (tag) => currentPath === `/tag/${tag.slug}`;

  return (
    <aside className="space-y-8">
      {/* Members */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{memberCount} 位成员</span>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">分类</h3>
          <Link
            to="/categories"
            onClick={handleClick}
            className="text-xs text-primary hover:underline"
          >
            全部
          </Link>
        </div>
        <div className="space-y-1">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              onClick={handleClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isCategoryActive(cat)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-muted text-foreground/80"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="truncate">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">标签</h3>
          <Link
            to="/tags"
            onClick={handleClick}
            className="text-xs text-primary hover:underline"
          >
            全部
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              to={`/tag/${tag.slug}`}
              onClick={handleClick}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs transition-colors ${
                isTagActive(tag)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}