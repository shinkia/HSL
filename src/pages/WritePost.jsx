import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TiptapEditor from "@/components/admin/TiptapEditor";
import Navbar from "@/components/forum/Navbar";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { LOCATIONS } from "@/lib/locations";

export default function WritePost() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const type = searchParams.get("type") || "fr";
  const editId = searchParams.get("id");
  const isEditing = !!editId;

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list("sort_order"),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => base44.entities.Tag.list(),
  });

  const category = categories.find((c) => c.slug === type);

  const { data: existingPosts = [] } = useQuery({
    queryKey: ["edit-post", editId],
    queryFn: () => base44.entities.Post.filter({ id: editId }),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingPosts.length > 0) {
      const post = existingPosts[0];
      if (post.user_id !== user?.id) {
        toast({ title: "无权编辑此帖子", variant: "destructive" });
        navigate("/");
        return;
      }
      setTitle(post.title || "");
      setLocation(post.location || "");
      setContent(post.content || "");
      setSelectedTags(post.tags || []);
    }
  }, [existingPosts]);

  const generateSlug = (t) =>
    t.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "") ||
    `post-${Date.now()}`;

  const handleSubmit = async () => {
    if (!title.trim() || !location || !content.trim()) {
      toast({ title: "请填写标题、地区和内容", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "分类加载中，请稍后", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        slug: isEditing && existingPosts[0]?.slug ? existingPosts[0].slug : generateSlug(title.trim()),
        content,
        category_id: category.id,
        location,
        tags: selectedTags,
        post_type: type,
        status: "published",
        user_id: user.id,
        author_name: user.username || user.full_name || user.email,
      };
      let result;
      if (isEditing) {
        await base44.entities.Post.update(editId, data);
        result = { slug: existingPosts[0]?.slug };
      } else {
        result = await base44.entities.Post.create(data);
      }
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      toast({ title: "发布成功" });
      navigate(`/posts/${result.slug || existingPosts[0]?.slug}`);
    } catch (err) {
      toast({ title: err.message || "发布失败", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="flex-1 overflow-x-hidden">
      <Navbar categories={categories} tags={tags} memberCount={0} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">{isEditing ? "编辑帖子" : "发帖"}</h1>
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "发布中..." : isEditing ? "更新" : "发布"}
          </Button>
        </div>

        {/* Locked category badge */}
        {category && (
          <div className="mb-4">
            <span className="badge-category" style={{ backgroundColor: category.color }}>
              发布到: {category.name}
            </span>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <Label className="text-xs mb-1.5 block">标题 <span className="text-destructive">*</span></Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="帖子标题"
              className="text-lg font-medium"
            />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">地区 <span className="text-destructive">*</span></Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger><SelectValue placeholder="选择地区" /></SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">内容 <span className="text-destructive">*</span></Label>
            <TiptapEditor value={content} onChange={setContent} />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">标签 <span className="text-muted-foreground font-normal">（可选）</span></Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selectedTags.includes(tag.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}