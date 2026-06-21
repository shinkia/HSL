import React from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { searchPosts } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Sidebar from "@/components/forum/Sidebar";
import Breadcrumbs from "@/components/forum/Breadcrumbs";
import PostCard from "@/components/forum/PostCard";
import PostListSkeleton from "@/components/common/PostListSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { Search } from "lucide-react";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

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

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search-posts", query],
    queryFn: () => searchPosts(query, 100),
    enabled: !!query,
  });

  return (
    <div className="flex-1 overflow-x-hidden">
      <Navbar categories={categories} tags={tags} memberCount={users.length} />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Breadcrumbs items={[{ label: "搜索结果" }]} />
        <div className="flex gap-6">
          <div className="hidden md:block w-52 shrink-0">
            <div className="sticky top-20">
              <Sidebar categories={categories} tags={tags} memberCount={users.length} />
            </div>
          </div>
          <main className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-2">搜索结果: {query}</h1>
            <p className="text-sm text-muted-foreground mb-4">共找到 {results.length} 条结果</p>
            {isLoading && <PostListSkeleton />}
            {!isLoading && results.length === 0 && (
              <div className="bg-white rounded-xl border overflow-hidden">
                <EmptyState icon={Search} title="未找到相关帖子，试试其他关键词" />
              </div>
            )}
            {!isLoading && results.length > 0 && (
              <div className="bg-white rounded-xl border overflow-hidden">
                {results.map((post) => (
                  <PostCard key={post.id} post={post} categories={categories} tags={tags} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}