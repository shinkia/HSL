import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Sidebar from "@/components/forum/Sidebar";
import PostCard from "@/components/forum/PostCard";
import PostListSkeleton from "@/components/common/PostListSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadMoreButton from "@/components/common/LoadMoreButton";
import { FileText, Search, FolderOpen, Tag } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { label: "最新", value: "latest" },
  { label: "热门", value: "hot" },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortTab, setSortTab] = useState("latest");

  const categoryFilter = searchParams.get("category");
  const tagFilter = searchParams.get("tag");
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

  const [limit, setLimit] = useState(PAGE_SIZE);
  // Reset to first page when filters change
  useEffect(() => { setLimit(PAGE_SIZE); }, [categoryFilter, tagFilter, searchQuery, sortTab]);

  const sortField = sortTab === "hot" ? "-like_count" : "-created_date";

  const { data: posts = [], isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["posts", categoryFilter, sortField, limit],
    queryFn: async () => {
      const filter = { status: "published" };
      if (categoryFilter) filter.category_id = categoryFilter;
      return base44.entities.Post.filter(filter, sortField, limit);
    },
    keepPreviousData: true,
  });

  // If the fetch returned fewer rows than limit, no more pages exist
  const hasMore = posts.length === limit;

  const likedPostIds = useLikes("post", posts.map((p) => p.id));

  let filteredPosts = posts;

  if (tagFilter) {
    filteredPosts = filteredPosts.filter((p) => (p.tags || []).includes(tagFilter));
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter(
      (p) => p.title?.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q)
    );
  }

  // Sort already done server-side via sortField; pinned still gets bubbled

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
    <div className="flex-1 overflow-x-hidden">
      <Navbar
        categories={categories}
        tags={tags}
        memberCount={users.length}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-6">
          {/* Left sidebar - desktop only */}
          <div className="hidden md:block w-52 shrink-0">
            <div className="sticky top-20">
              <Sidebar categories={categories} tags={tags} memberCount={users.length} />
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0">
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
              {isLoading && <PostListSkeleton />}

              {isError && <ErrorState onRetry={refetch} />}

              {!isLoading && !isError && filteredPosts.length === 0 && (
                <EmptyState
                  icon={searchQuery ? Search : categoryFilter ? FolderOpen : tagFilter ? Tag : FileText}
                  title={
                    searchQuery ? "未找到相关帖子，试试其他关键词"
                    : categoryFilter ? "该分类下暂无帖子"
                    : tagFilter ? "该标签下暂无帖子"
                    : "暂无帖子"
                  }
                />
              )}

              {!isLoading && !isError && filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} categories={categories} tags={tags} likedPostIds={likedPostIds} />
              ))}
            </div>

            {!isLoading && !isError && filteredPosts.length > 0 && (
              <LoadMoreButton
                hasMore={hasMore}
                isLoading={isFetching}
                count={filteredPosts.length}
                onLoadMore={() => setLimit((n) => n + PAGE_SIZE)}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}