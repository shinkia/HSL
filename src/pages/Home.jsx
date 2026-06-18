import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Sidebar from "@/components/forum/Sidebar";
import PostCard from "@/components/forum/PostCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("latest");

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

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", categoryFilter, tagFilter, searchQuery],
    queryFn: async () => {
      const filter = { status: "published" };
      if (categoryFilter) filter.category_id = categoryFilter;
      const result = await base44.entities.Post.filter(filter, "-created_date", 100);
      return result;
    },
  });

  // Filter and sort
  let filteredPosts = posts;

  if (tagFilter) {
    filteredPosts = filteredPosts.filter((p) => (p.tags || []).includes(tagFilter));
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredPosts = filteredPosts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q)
    );
  }

  if (tab === "hot") {
    filteredPosts = [...filteredPosts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  }

  const handleSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        categories={categories}
        tags={tags}
        memberCount={users.length}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Left sidebar - desktop only */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <Sidebar categories={categories} tags={tags} memberCount={users.length} />
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="mb-6">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="latest">最新</TabsTrigger>
                  <TabsTrigger value="hot">热门</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Posts */}
            <div className="space-y-2">
              {isLoading &&
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="p-5 rounded-xl bg-card">
                      <Skeleton className="h-4 w-20 mb-3" />
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}

              {!isLoading && filteredPosts.length === 0 && (
                <div className="text-center py-20">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无帖子</p>
                </div>
              )}

              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  categories={categories}
                  tags={tags}
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}