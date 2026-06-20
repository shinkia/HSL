import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Sidebar from "@/components/forum/Sidebar";
import Breadcrumbs from "@/components/forum/Breadcrumbs";

export default function TagsPage() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list("sort_order"),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => base44.entities.Tag.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["posts", "all"],
    queryFn: () => base44.entities.Post.filter({ status: "published" }, "-created_date", 200),
  });

  const getPostCount = (tagId) => posts.filter((p) => (p.tags || []).includes(tagId)).length;

  return (
    <div className="flex-1 overflow-x-hidden">
      <Navbar categories={categories} tags={tags} memberCount={users.length} />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Breadcrumbs items={[{ label: "全部标签" }]} />
        <div className="flex gap-6">
          <div className="hidden md:block w-52 shrink-0">
            <div className="sticky top-20">
              <Sidebar categories={categories} tags={tags} memberCount={users.length} />
            </div>
          </div>
          <main className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-6">全部标签</h1>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/tag/${tag.slug}`}
                  className="inline-flex items-center gap-2 bg-white border rounded-lg px-4 py-2.5 hover:shadow-md transition-all"
                >
                  <span className="text-sm font-medium">#{tag.name}</span>
                  <span className="text-xs text-muted-foreground">{getPostCount(tag.id)}</span>
                </Link>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}