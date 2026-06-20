import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Sidebar from "@/components/forum/Sidebar";
import PostCard from "@/components/forum/PostCard";
import PostListSkeleton from "@/components/common/PostListSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Breadcrumbs from "@/components/forum/Breadcrumbs";
import { FileText } from "lucide-react";
import { getLocationBySlug, resolveLocationSlug } from "@/lib/locations";

const SORT_OPTIONS = [
  { label: "最新", value: "latest" },
  { label: "热门", value: "hot" },
];

export default function LocationPage() {
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const [sortTab, setSortTab] = useState("latest");

  const resolvedSlug = resolveLocationSlug(locationSlug);
  const location = getLocationBySlug(resolvedSlug);

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

  const { data: posts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["posts", "location", location?.name],
    queryFn: () =>
      base44.entities.Post.filter(
        { location: location.name, status: "published" },
        "-created_date",
        100
      ),
    enabled: !!location,
  });

  if (!location) {
    return (
      <div className="flex-1 overflow-x-hidden">
        <Navbar categories={categories} tags={tags} memberCount={users.length} />
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl border shadow-sm">
            <EmptyState
              icon={FileText}
              title="地区不存在"
              description="该地区页面不存在"
              actionLabel="返回首页"
              onAction={() => navigate("/")}
            />
          </div>
        </div>
      </div>
    );
  }

  let filteredPosts = posts;
  if (sortTab === "hot") {
    filteredPosts = [...filteredPosts].sort(
      (a, b) => (b.view_count || 0) - (a.view_count || 0)
    );
  }
  filteredPosts = [
    ...filteredPosts.filter((p) => p.is_pinned),
    ...filteredPosts.filter((p) => !p.is_pinned),
  ];

  return (
    <div className="flex-1 overflow-x-hidden">
      <Navbar categories={categories} tags={tags} memberCount={users.length} />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Breadcrumbs items={[{ label: location.displayName }]} />
        <div className="flex gap-6">
          <div className="hidden md:block w-52 shrink-0">
            <div className="sticky top-20">
              <Sidebar categories={categories} tags={tags} memberCount={users.length} />
            </div>
          </div>
          <main className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-4">{location.displayName}</h1>

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

            <div className="bg-white rounded-xl border overflow-hidden">
              {isLoading && <PostListSkeleton />}
              {isError && <ErrorState onRetry={refetch} />}
              {!isLoading && !isError && filteredPosts.length === 0 && (
                <EmptyState icon={FileText} title="该地区暂无帖子" />
              )}
              {!isLoading &&
                !isError &&
                filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} categories={categories} tags={tags} />
                ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}