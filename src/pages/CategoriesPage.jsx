import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Sidebar from "@/components/forum/Sidebar";
import Breadcrumbs from "@/components/forum/Breadcrumbs";

export default function CategoriesPage() {
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

  const getPostCount = (catId) => posts.filter((p) => p.category_id === catId).length;

  return (
    <div className="flex-1 overflow-x-hidden">
      <Navbar categories={categories} tags={tags} memberCount={users.length} />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Breadcrumbs items={[{ label: "全部分类" }]} />
        <div className="flex gap-6">
          <div className="hidden md:block w-52 shrink-0">
            <div className="sticky top-20">
              <Sidebar categories={categories} tags={tags} memberCount={users.length} />
            </div>
          </div>
          <main className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-6">全部分类</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="bg-white rounded-xl border p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <h3 className="font-semibold text-lg">{cat.name}</h3>
                  </div>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{cat.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{getPostCount(cat.id)} 篇帖子</p>
                </Link>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}