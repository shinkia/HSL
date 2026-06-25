import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, ArrowUp, ArrowDown, MapPin, Loader2 } from "lucide-react";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/^-+|-+$/g, "");
}

const EMPTY_FORM = { name: "", slug: "", display_name: "", chinese_name: "", alias: "" };

export default function LocationsManager() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["locations-admin"],
    queryFn: () => base44.entities.Location.list("sort_order"),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["locations-admin"] });
    queryClient.invalidateQueries({ queryKey: ["locations"] });
  };

  const handleNameChange = (value) => {
    setForm((f) => ({
      ...f,
      name: value,
      slug: f.slug === slugify(f.name) || !f.slug ? slugify(value) : f.slug,
      display_name: f.display_name === f.name || !f.display_name ? value : f.display_name,
    }));
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.display_name.trim()) {
      toast({ title: "请填写地区名称、URL slug 和标签显示名", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const maxOrder = locations.reduce((m, l) => Math.max(m, l.sort_order || 0), 0);
      await base44.entities.Location.create({
        name: form.name.trim(),
        slug: form.slug.trim(),
        display_name: form.display_name.trim(),
        chinese_name: form.chinese_name.trim() || null,
        alias: form.alias.trim() || null,
        sort_order: maxOrder + 1,
        active: true,
      });
      toast({ title: `地区「${form.name}」已添加` });
      setForm(EMPTY_FORM);
      invalidate();
    } catch (err) {
      toast({
        title: "添加失败",
        description: err.message?.includes("unique") ? "名称或 slug 已存在" : err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (loc) => {
    // Check if any posts use this location
    const { count } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("location", loc.name);

    if (count > 0) {
      toast({
        title: "无法删除",
        description: `该地区下还有 ${count} 篇帖子，请先将帖子迁移到其他地区。`,
        variant: "destructive",
      });
      return;
    }
    setDeletingId(loc.id);
    try {
      await base44.entities.Location.delete(loc.id);
      toast({ title: `地区「${loc.name}」已删除` });
      invalidate();
    } catch (err) {
      toast({ title: "删除失败", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleMove = async (index, direction) => {
    const sorted = [...locations];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const a = sorted[index];
    const b = sorted[targetIndex];
    try {
      await Promise.all([
        base44.entities.Location.update(a.id, { sort_order: b.sort_order }),
        base44.entities.Location.update(b.id, { sort_order: a.sort_order }),
      ]);
      invalidate();
    } catch (err) {
      toast({ title: "排序失败", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">地区管理</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        管理导航栏中显示的地区标签。添加新地区后，用户发帖时即可选择该地区。
      </p>

      {/* Existing locations */}
      <div className="border rounded-lg overflow-hidden mb-8">
        <div className="bg-muted px-4 py-2.5 text-xs font-medium text-muted-foreground flex gap-4">
          <span className="w-6" />
          <span className="flex-1">地区名称</span>
          <span className="w-16 text-center">标签</span>
          <span className="w-24 text-center">帖子数</span>
          <span className="w-16" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : locations.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">暂无地区</div>
        ) : (
          locations.map((loc, i) => (
            <LocationRow
              key={loc.id}
              loc={loc}
              index={i}
              total={locations.length}
              onMove={handleMove}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ))
        )}
      </div>

      {/* Add form */}
      <div className="border rounded-lg p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> 添加新地区
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs mb-1.5 block">
              地区名称 <span className="text-destructive">*</span>
              <span className="text-muted-foreground font-normal ml-1">(存储值，如 Seremban)</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Seremban"
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">
              标签显示名 <span className="text-destructive">*</span>
              <span className="text-muted-foreground font-normal ml-1">(导航栏显示)</span>
            </Label>
            <Input
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              placeholder="SBN"
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">
              URL Slug <span className="text-destructive">*</span>
              <span className="text-muted-foreground font-normal ml-1">(如 seremban)</span>
            </Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="seremban"
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">
              中文名
              <span className="text-muted-foreground font-normal ml-1">(可选)</span>
            </Label>
            <Input
              value={form.chinese_name}
              onChange={(e) => setForm((f) => ({ ...f, chinese_name: e.target.value }))}
              placeholder="芙蓉"
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">
              短别名
              <span className="text-muted-foreground font-normal ml-1">(可选，如 ns → negeri-sembilan)</span>
            </Label>
            <Input
              value={form.alias}
              onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
              placeholder="sbn"
            />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={saving} className="mt-4 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          添加地区
        </Button>
      </div>
    </div>
  );
}

function LocationRow({ loc, index, total, onMove, onDelete, deletingId }) {
  const { data: postCount } = useQuery({
    queryKey: ["location-post-count", loc.name],
    queryFn: async () => {
      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("location", loc.name);
      return count || 0;
    },
  });

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-t first:border-t-0 hover:bg-muted/30">
      <div className="flex flex-col gap-0.5 w-6">
        <button
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-20"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
          className="text-muted-foreground hover:text-foreground disabled:opacity-20"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{loc.name}</p>
        <p className="text-xs text-muted-foreground">/{loc.slug}{loc.alias ? ` (别名: /${loc.alias})` : ""}</p>
      </div>
      <div className="w-16 text-center">
        <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{loc.display_name}</span>
      </div>
      <div className="w-24 text-center text-sm text-muted-foreground">
        {postCount ?? "—"}
      </div>
      <div className="w-16 flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(loc)}
          disabled={deletingId === loc.id}
        >
          {deletingId === loc.id
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
