import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const PRESET_COLORS = ["#0D9488", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444", "#10B981", "#6366F1"];

export default function CategoriesManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", slug: "", color: PRESET_COLORS[0], description: "", sort_order: 0 });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => base44.entities.Category.list("sort_order"),
  });

  const reset = () => {
    setForm({ name: "", slug: "", color: PRESET_COLORS[0], description: "", sort_order: 0 });
    setEditing(null);
  };

  const handleEdit = (cat) => {
    setEditing(cat.id);
    setForm({ name: cat.name, slug: cat.slug, color: cat.color, description: cat.description || "", sort_order: cat.sort_order || 0 });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    const data = { ...form };
    if (!data.slug) data.slug = data.name.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, "-");

    if (editing) {
      await base44.entities.Category.update(editing, data);
    } else {
      await base44.entities.Category.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    setOpen(false);
    reset();
    toast({ title: editing ? "分类已更新" : "分类已创建" });
  };

  const handleDelete = async (id) => {
    await base44.entities.Category.delete(id);
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">分类管理</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />新建分类</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "编辑分类" : "新建分类"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-1.5 block">名称</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="分类名称" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="url-slug" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">颜色</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-8 p-0 border-0 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">描述</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="分类描述（可选）" />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">排序</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="gap-2">保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-xl p-4 bg-card">
            <div className="flex items-center gap-3">
              <Skeleton className="w-4 h-4 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
        {!isLoading && categories.map((cat) => (
          <div key={cat.id} className="border rounded-xl p-4 bg-card flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <div>
                <p className="font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">/{cat.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(cat)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cat.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {!isLoading && categories.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={FolderOpen}
              title="暂无分类"
              actionLabel="新建分类"
              actionIcon={Plus}
              onAction={() => setOpen(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}