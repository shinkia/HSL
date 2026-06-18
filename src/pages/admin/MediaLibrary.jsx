import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Copy, Image } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function MediaLibrary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const { data: media = [] } = useQuery({
    queryKey: ["media"],
    queryFn: () => base44.entities.MediaItem.list("-created_date", 100),
  });

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.MediaItem.create({
        name: file.name,
        url: file_url,
        type: file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "document",
        size: file.size,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["media"] });
    setUploading(false);
    toast({ title: "上传完成" });
  };

  const handleDelete = async (id) => {
    await base44.entities.MediaItem.delete(id);
    queryClient.invalidateQueries({ queryKey: ["media"] });
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast({ title: "链接已复制" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">媒体库</h1>
        <Button className="gap-2 relative" disabled={uploading}>
          <Upload className="h-4 w-4" />
          {uploading ? "上传中..." : "上传文件"}
          <input
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {media.map((item) => (
          <div key={item.id} className="border rounded-xl overflow-hidden bg-card group">
            <div className="aspect-square bg-muted flex items-center justify-center relative">
              {item.type === "image" ? (
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Image className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => copyUrl(item.url)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs truncate">{item.name}</p>
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full text-center py-20">
            <Image className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">暂无媒体文件</p>
          </div>
        )}
      </div>
    </div>
  );
}