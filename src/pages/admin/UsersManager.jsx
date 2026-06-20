import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { Users, Ban, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function UsersManager() {
  const queryClient = useQueryClient();
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("-created_date"),
  });

  const { data: highReportUsers = [] } = useQuery({
    queryKey: ["high-report-users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getReportedUserCounts");
      return res.data.highReportUsers || [];
    },
  });

  const handleRoleChange = async (userId, role) => {
    await base44.entities.User.update(userId, { role });
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const openBanDialog = (user) => {
    setBanTarget(user);
    setBanReason("");
    setBanDuration("");
    setBanDialogOpen(true);
  };

  const handleBan = async () => {
    if (!banTarget) return;
    try {
      let bannedUntil = null;
      if (banDuration) {
        const days = parseInt(banDuration);
        if (days > 0) {
          bannedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        }
      }
      await base44.functions.invoke("banUser", {
        target_user_id: banTarget.id,
        reason: banReason.trim(),
        banned_until: bannedUntil,
      });
      toast({ title: "用户已封禁" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setBanDialogOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "操作失败";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const handleUnban = async (user) => {
    try {
      await base44.functions.invoke("unbanUser", { target_user_id: user.id });
      toast({ title: "用户已解封" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "操作失败";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const roleLabels = {
    admin: "管理员",
    moderator: "版主",
    author: "作者",
    user: "成员",
  };

  const isHighReport = (userId) => highReportUsers.some((u) => u.user_id === userId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>

      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">用户</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">邮箱</th>
                <th className="text-left px-4 py-3 font-medium">角色</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">注册时间</th>
                <th className="text-left px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableSkeleton cols={5} />}
              {!isLoading && users.map((user) => {
                const isBanned = user.banned && (!user.banned_until || new Date(user.banned_until) > new Date());
                const highReport = isHighReport(user.id);
                return (
                  <tr key={user.id} className={`border-b last:border-0 ${isBanned ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {(user.username || user.full_name || "U")[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{user.username || user.full_name || "未知用户"}</span>
                          <div className="flex items-center gap-1.5">
                            {isBanned && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded">
                                <Ban className="h-3 w-3" /> 已封禁
                              </span>
                            )}
                            {highReport && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-700 rounded">
                                <AlertTriangle className="h-3 w-3" /> 举报次数高
                              </span>
                            )}
                            {!user.email_verified && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                                未验证
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <Select value={user.role || "user"} onValueChange={(v) => handleRoleChange(user.id, v)}>
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">管理员</SelectItem>
                          <SelectItem value="moderator">版主</SelectItem>
                          <SelectItem value="author">作者</SelectItem>
                          <SelectItem value="user">成员</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {user.created_date && format(new Date(user.created_date), "yyyy-MM-dd")}
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== "admin" && (
                        isBanned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 text-green-600 hover:text-green-700"
                            onClick={() => handleUnban(user)}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            解封
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 text-red-600 hover:text-red-700"
                            onClick={() => openBanDialog(user)}
                          >
                            <Ban className="h-3.5 w-3.5" />
                            封禁
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon={Users} title="暂无用户" description="邀请用户加入后将显示在这里" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>封禁用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-muted-foreground">
              确认封禁 <span className="font-medium text-foreground">{banTarget?.username || banTarget?.email}</span>？
            </div>
            <div className="space-y-2">
              <Label>封禁原因</Label>
              <Input
                placeholder="请输入封禁原因"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>封禁时长（天，留空为永久）</Label>
              <Input
                type="number"
                min="1"
                placeholder="如 7"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleBan}>确认封禁</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}