import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { uploadAvatar } from "@/lib/storage";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function ProfileEditDialog({ open, onOpenChange, user, onSaved }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState({
    username: user?.username ?? "",
    bio: user?.bio ?? "",
    avatar: user?.avatar ?? "",
  });

  // Re-sync when user changes
  React.useEffect(() => {
    if (user) {
      setForm({
        username: user.username ?? "",
        bio: user.bio ?? "",
        avatar: user.avatar ?? "",
      });
    }
  }, [user?.id]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "图片过大", description: "请选择小于 2MB 的图片", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const { file_url } = await uploadAvatar(file);
      setForm((f) => ({ ...f, avatar: file_url }));
    } catch (err) {
      toast({ title: "上传失败", description: err.message || "请稍后再试", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (form.username.length < 3 || form.username.length > 20) {
      toast({ title: "用户名格式不正确", description: "3-20 字符，字母/数字/下划线", variant: "destructive" });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      toast({ title: "用户名只能包含字母、数字、下划线", variant: "destructive" });
      return;
    }
    if (form.bio.length > 200) {
      toast({ title: "简介过长", description: "最多 200 字符", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const updated = await base44.auth.updateMe({
        username: form.username.trim(),
        bio: form.bio.trim() || null,
        avatar: form.avatar || null,
      });
      toast({ title: "资料已更新" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSaved?.(updated);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "保存失败",
        description: err.message?.includes("unique") ? "用户名已被占用" : err.message || "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const previewAvatar =
    form.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.username || "user")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑个人资料</DialogTitle>
          <DialogDescription>更新你的头像、用户名和个人简介</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <img
              src={previewAvatar}
              alt={form.username}
              className="w-20 h-20 rounded-full bg-muted shrink-0 object-cover"
            />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                上传头像
              </Button>
              <p className="text-xs text-muted-foreground mt-1">PNG / JPG / WEBP, 最大 2MB</p>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              maxLength={20}
              placeholder="3-20 字符，字母/数字/下划线"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">个人简介</Label>
              <span className="text-xs text-muted-foreground">{form.bio.length}/200</span>
            </div>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              maxLength={200}
              placeholder="介绍一下你自己..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving || uploadingAvatar}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
