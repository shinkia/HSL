import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderOpen, Tag, Users, MessageCircle, Eye } from "lucide-react";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => base44.entities.Post.list("-created_date", 100),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list(),
  });
  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => base44.entities.Tag.list(),
  });
  const { data: comments = [] } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: () => base44.entities.Comment.list("-created_date", 100),
  });
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;
  const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon={FileText} label="已发布" value={published} color="bg-primary/10 text-primary" />
        <StatCard icon={FileText} label="草稿" value={drafts} color="bg-amber-100 text-amber-600" />
        <StatCard icon={FolderOpen} label="分类" value={categories.length} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Tag} label="标签" value={tags.length} color="bg-purple-100 text-purple-600" />
        <StatCard icon={MessageCircle} label="评论" value={comments.length} color="bg-green-100 text-green-600" />
        <StatCard icon={Eye} label="总浏览" value={totalViews} color="bg-pink-100 text-pink-600" />
      </div>

      {/* Recent posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近帖子</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.slice(0, 10).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">暂无帖子</p>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 10).map((post) => (
                <div key={post.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground">{post.author_name}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      post.status === "published"
                        ? "bg-green-100 text-green-700"
                        : post.status === "draft"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {post.status === "published" ? "已发布" : post.status === "draft" ? "草稿" : "归档"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}