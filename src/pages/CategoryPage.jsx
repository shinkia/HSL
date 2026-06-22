import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Sidebar from "@/components/forum/Sidebar";
import Breadcrumbs from "@/components/forum/Breadcrumbs";
import PostCard from "@/components/forum/PostCard";
import PostListSkeleton from "@/components/common/PostListSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadMoreButton from "@/components/common/LoadMoreButton";
import { FolderOpen } from "lucide-react";

const PAGE_SIZE = 20;

export default function CategoryPage() {
  const { slug } = useParams();
  const [limit, setLimit] = useState(PAGE_SIZE);
  useEffect(() => { setLimit(PAGE_SIZE); }, [slug]);

  const { data: categories = [], isLoading: catLoading } = useQuery({
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

  const category = categories.find((c) => c.slug === slug);

  const { data: posts = [], isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["posts", "category", category?.id, limit],
    queryFn: () => base44.entities.Post.filter({ category_id: category.id, status: "published" }, "-created_date", limit),
    enabled: !!category?.id,
    keepPreviousData: true,
  });
  const hasMore = posts.length === limit;

  if (!catLoading && categories.length > 0 && !category) {
    return (
      <div className="flex-1 overflow-x-hidden">
        <Navbar categories={categories} tags={tags} memberCount={users.length} />
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Breadcrumbs items={[{ label: "分类不存在" }]} />
          <div className="bg-white rounded-2xl border shadow-sm">
            <EmptyState
              icon={FolderOpen}
              title="分类不存在"
              description="该分类可能已被删除或链接有误"
              actionLabel="返回首页"
              onAction={() => window.location.href = "/"}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-hidden">
      <Navbar categories={categories} tags={tags} memberCount={users.length} />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Breadcrumbs items={category ? [{ label: category.name }] : []} />
        <div className="flex gap-6">
          <div className="hidden md:block w-52 shrink-0">
            <div className="sticky top-20">
              <Sidebar categories={categories} tags={tags} memberCount={users.length} />
            </div>
          </div>
          <main className="flex-1 min-w-0">
            {isLoading && <PostListSkeleton />}
            {isError && <ErrorState onRetry={refetch} />}
            {!isLoading && !isError && (
              <>
                <div className="bg-white rounded-xl border overflow-hidden">
                  {posts.length === 0 ? (
                    <EmptyState icon={FolderOpen} title="该分类下暂无帖子" />
                  ) : (
                    posts.map((post) => (
                      <PostCard key={post.id} post={post} categories={categories} tags={tags} />
                    ))
                  )}
                </div>
                {posts.length > 0 && (
                  <LoadMoreButton
                    hasMore={hasMore}
                    isLoading={isFetching}
                    count={posts.length}
                    onLoadMore={() => setLimit((n) => n + PAGE_SIZE)}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}