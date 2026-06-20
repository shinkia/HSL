import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Eye, FileText } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import TableSkeleton from "@/components/common/TableSkeleton";

export default function PostsList() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => base44.entities.Post.list("-created_date", 200),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list(),
  });

  const filtered = search
    ? posts.filter((p) => p.title?.toLowerCase().includes(search.toLowerCase()))
    : posts;

  const handleDelete = async (id) => {
    await base44.entities.Post.delete(id);
    queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
  };

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || "-";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">帖子管理</h1>
        <Button onClick={() => navigate("/admin/posts/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          新建帖子
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索帖子..."
          className="pl-10"
        />
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">标题</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">分类</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">状态</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">浏览</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableSkeleton cols={5} />}
              {isError && (
                <tr>
                  <td colSpan={5}>
                    <ErrorState onRetry={refetch} />
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.map((post) => (
                <tr key={post.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-xs">{post.title}</p>
                    <p className="text-xs text-muted-foreground">{post.author_name}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {getCategoryName(post.category_id)}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        post.status === "published" ? "bg-green-100 text-green-700"
                        : post.status === "draft" ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {post.status === "published" ? "已发布" : post.status === "draft" ? "草稿" : "归档"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {post.view_count || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {post.status === "published" && (
                        <Link to={`/posts/${post.slug}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/posts/${post.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>此操作不可撤销，确定要删除该帖子吗？</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(post.id)}>删除</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={FileText}
                      title="暂无帖子"
                      actionLabel="新建帖子"
                      actionIcon={Plus}
                      onAction={() => navigate("/admin/posts/new")}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}