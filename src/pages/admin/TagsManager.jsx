import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Tag } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

export default function TagsManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: () => base44.entities.Tag.list(),
  });

  const handleAdd = async () => {
    if (!name.trim()) return;
    const slug = name.trim().toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, "-");
    await base44.entities.Tag.create({ name: name.trim(), slug });
    queryClient.invalidateQueries({ queryKey: ["tags"] });
    setName("");
    toast({ title: "标签已创建" });
  };

  const handleDelete = async (id) => {
    await base44.entities.Tag.delete(id);
    queryClient.invalidateQueries({ queryKey: ["tags"] });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">标签管理</h1>

      <div className="flex gap-2 mb-6 max-w-sm">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="新标签名称"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          添加
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {isLoading && Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
        {!isLoading && tags.map((tag) => (
          <div
            key={tag.id}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border text-sm"
          >
            <span>#{tag.name}</span>
            <button onClick={() => handleDelete(tag.id)} className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {!isLoading && tags.length === 0 && (
          <div className="w-full">
            <EmptyState icon={Tag} title="暂无标签" description="在上方输入框添加第一个标签" />
          </div>
        )}
      </div>
    </div>
  );
}