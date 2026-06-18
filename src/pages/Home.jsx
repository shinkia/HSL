import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Sidebar from "@/components/forum/Sidebar";
import PostCard from "@/components/forum/PostCard";
import CityTabs from "@/components/forum/CityTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

const SORT_OPTIONS = [
  { label: "最新", value: "latest" },
  { label: "热门", value: "hot" },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortTab, setSortTab] = useState("latest");

  const categoryFilter = searchParams.get("category");
  const tagFilter = searchParams.get("tag");
  const cityFilter = searchParams.get("city") || "";
  const searchQuery = searchParams.get("search") || "";

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

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", categoryFilter, tagFilter, searchQuery],
    queryFn: async () => {
      const filter = { status: "published" };
      if (categoryFilter) filter.category_id = categoryFilter;
      return base44.entities.Post.filter(filter, "-created_date", 100);
    },
  });

  let filteredPosts = posts;

  if (tagFilter) {
    filteredPosts = filteredPosts.filter((p) => (p.tags || []).includes(tagFilter));
  }

  if (cityFilter) {
    filteredPosts = filteredPosts.filter((p) =>
      p.title?.includes(cityFilter) || p.excerpt?.includes(cityFilter) || (p.tags || []).some((tid) => {
        const tag = tags.find((t) => t.id === tid);
        return tag?.name === cityFilter;
      })
    );
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter(
      (p) => p.title?.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q)
    );
  }

  if (sortTab === "hot") {
    filteredPosts = [...filteredPosts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  }

  // Pinned always on top
  filteredPosts = [
    ...filteredPosts.filter((p) => p.is_pinned),
    ...filteredPosts.filter((p) => !p.is_pinned),
  ];

  const handleSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("search", value);
    else params.delete("search");
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
      <Navbar
        categories={categories}
        tags={tags}
        memberCount={users.length}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-6">
          {/* Left sidebar - desktop only */}
          <div className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-20">
              <Sidebar categories={categories} tags={tags} memberCount={users.length} />
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* City tabs */}
            <div className="mb-3 bg-white rounded-xl border px-3 py-2">
              <CityTabs />
            </div>

            {/* Sort/filter row */}
            <div className="flex items-center gap-2 mb-3 bg-white rounded-xl border px-3 py-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortTab(opt.value)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    sortTab === opt.value
                      ? "bg-primary text-white font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <div className="ml-auto text-xs text-gray-400">{filteredPosts.length} 个帖子</div>
            </div>

            {/* Post list */}
            <div className="bg-white rounded-xl border overflow-hidden">
              {isLoading &&
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b">
                    <Skeleton className="w-[72px] h-[72px] rounded-lg shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}

              {!isLoading && filteredPosts.length === 0 && (
                <div className="text-center py-20">
                  <FileText className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400">暂无帖子</p>
                </div>
              )}

              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} categories={categories} tags={tags} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}