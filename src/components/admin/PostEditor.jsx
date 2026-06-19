import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import SeoPanel from "./SeoPanel";
import ReactQuill from "react-quill";
import { Save, ArrowLeft, Upload, ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const emptyPost = {
  title: "", slug: "", content: "", excerpt: "", category_id: "", tags: [], images: [],
  status: "draft", cover_image: "", author_name: "", is_pinned: false,
  contact_whatsapp: "", contact_phone: "", contact_telegram: "",
  contact_link: "", contact_link_label: "",
  seo_title: "", meta_description: "", focus_keyword: "",
  og_image: "", og_title: "", og_description: "",
  twitter_title: "", twitter_description: "", twitter_image: "",
  canonical_url: "", noindex: false, nofollow: false, schema_type: "Article",
};

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!id;
  const quillRef = useRef(null);

  const [form, setForm] = useState(emptyPost);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list("sort_order"),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => base44.entities.Tag.list(),
  });

  const { data: existingPosts = [] } = useQuery({
    queryKey: ["edit-post", id],
    queryFn: () => base44.entities.Post.filter({ id }),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingPosts.length > 0) {
      setForm({ ...emptyPost, ...existingPosts[0] });
    }
  }, [existingPosts]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const generateSlug = (title) =>
    title.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "") ||
    `post-${Date.now()}`;

  const handleTitleChange = (value) => {
    update("title", value);
    if (!isEditing || !form.slug) update("slug", generateSlug(value));
  };

  // Use a ref so the stable useMemo modules object always calls the latest handler
  const imageHandlerRef = useRef(null);
  imageHandlerRef.current = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.style.display = "none";
    document.body.appendChild(input);
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      document.body.removeChild(input);
      if (!file) return;
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, "image", file_url);
        quill.setSelection(range.index + 1);
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"],
      ],
      handlers: { image: () => imageHandlerRef.current() },
    },
  }), []);

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update("cover_image", file_url);
    setCoverUploading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.category_id) {
      toast({ title: "请填写标题和分类", variant: "destructive" });
      return;
    }
    setSaving(true);
    const data = { ...form };
    if (!data.slug) data.slug = generateSlug(data.title);
    if (isEditing) {
      await base44.entities.Post.update(id, data);
    } else {
      await base44.entities.Post.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    setSaving(false);
    toast({ title: isEditing ? "帖子已更新" : "帖子已创建" });
    navigate("/admin/posts");
  };

  const toggleTag = (tagId) => {
    const current = form.tags || [];
    update("tags", current.includes(tagId) ? current.filter((t) => t !== tagId) : [...current, tagId]);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/posts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">{isEditing ? "编辑帖子" : "新建帖子"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={form.status} onValueChange={(v) => update("status", v)}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="published">发布</SelectItem>
              <SelectItem value="archived">归档</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <Label className="text-xs mb-1.5 block">标题</Label>
            <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="帖子标题" className="text-lg font-medium" />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">URL Slug</Label>
            <Input value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="url-friendly-slug" />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">摘要</Label>
            <Textarea value={form.excerpt || ""} onChange={(e) => update("excerpt", e.target.value)} placeholder="帖子简短描述" rows={2} className="resize-none" />
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">内容 <span className="text-muted-foreground font-normal">（支持插入图片）</span></Label>
            <ReactQuill
              ref={quillRef}
              value={form.content || ""}
              onChange={(v) => update("content", v)}
              theme="snow"
              modules={modules}
            />
          </div>

          {/* Contact section */}
          <div className="border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-sm">联系信息</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">WhatsApp 号码</Label>
                <Input value={form.contact_whatsapp || ""} onChange={(e) => update("contact_whatsapp", e.target.value)} placeholder="+60123456789" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">电话号码</Label>
                <Input value={form.contact_phone || ""} onChange={(e) => update("contact_phone", e.target.value)} placeholder="+60123456789" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Telegram</Label>
                <Input value={form.contact_telegram || ""} onChange={(e) => update("contact_telegram", e.target.value)} placeholder="@username" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">自定义链接</Label>
                <Input value={form.contact_link || ""} onChange={(e) => update("contact_link", e.target.value)} placeholder="https://..." />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs mb-1.5 block">链接显示文字</Label>
                <Input value={form.contact_link_label || ""} onChange={(e) => update("contact_link_label", e.target.value)} placeholder="了解更多" />
              </div>
            </div>
          </div>

          <SeoPanel data={form} onChange={setForm} />
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <div className="border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-sm">分类</h3>
            <Select value={form.category_id || ""} onValueChange={(v) => update("category_id", v)}>
              <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-sm">标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    (form.tags || []).includes(tag.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cover image with file upload */}
          <div className="border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-sm">封面图片</h3>
            <Button variant="outline" size="sm" className="w-full gap-2 relative" disabled={coverUploading}>
              <ImageIcon className="h-4 w-4" />
              {coverUploading ? "上传中..." : "从设备上传"}
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>
            <div className="text-xs text-muted-foreground text-center">— 或粘贴图片链接 —</div>
            <Input
              value={form.cover_image || ""}
              onChange={(e) => update("cover_image", e.target.value)}
              placeholder="https://..."
            />
            {form.cover_image && (
              <img src={form.cover_image} alt="" className="rounded-lg w-full h-32 object-cover bg-muted" />
            )}
          </div>

          <div className="border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-sm">作者</h3>
            <Input value={form.author_name || ""} onChange={(e) => update("author_name", e.target.value)} placeholder="作者名称" />
          </div>

          <div className="border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <Label className="text-sm">置顶帖子</Label>
              <Switch checked={form.is_pinned || false} onCheckedChange={(v) => update("is_pinned", v)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}