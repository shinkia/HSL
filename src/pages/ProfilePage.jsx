import React from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/forum/Navbar";
import Breadcrumbs from "@/components/forum/Breadcrumbs";
import PostCard from "@/components/forum/PostCard";
import EmptyState from "@/components/common/EmptyState";
import { Calendar, MessageCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function ProfilePage() {
  const { username } = useParams();

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

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ["posts", "all"],
    queryFn: () => base44.entities.Post.filter({ status: "published" }, "-created_date", 200),
  });

  const user = users.find((u) => u.username === username);
  const userPosts = user ? allPosts.filter((p) => p.user_id === user.id) : [];

  const avatarUrl = user?.avatar || (username ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}` : "");

  return (
    <div className="flex-1 overflow-x-hidden">
      <Navbar categories={categories} tags={tags} memberCount={users.length} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: username ? `@${username}` : "用户" }]} />

        {!user ? (
          <div className="bg-white rounded-2xl border shadow-sm">
            <EmptyState
              icon={FileText}
              title="用户不存在"
              description="该用户可能已注销或链接有误"
              actionLabel="返回首页"
              onAction={() => window.location.href = "/"}
            />
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 mb-4">
              <div className="flex items-start gap-4">
                <img
                  src={avatarUrl}
                  alt={user.username}
                  className="w-20 h-20 rounded-full bg-muted shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold">{user.username}</h1>
                  {user.bio && <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(user.created_date), "yyyy年MM月加入", { locale: zhCN })}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {user.post_count || userPosts.length} 篇帖子
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {user.comment_count || 0} 条评论
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User's posts */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold">帖子</h3>
              </div>
              {isLoading && <p className="p-4 text-sm text-muted-foreground">加载中...</p>}
              {!isLoading && userPosts.length === 0 && (
                <EmptyState icon={FileText} title="暂无帖子" />
              )}
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} categories={categories} tags={tags} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}