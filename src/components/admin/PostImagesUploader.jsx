import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2, GripVertical, Loader2 } from "lucide-react";

export default function PostImagesUploader({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push(file_url);
    }
    onChange([...images, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onChange(reordered);
  };

  return (
    <div className="border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">图片（可拖动排序）</h3>
        <span className="text-xs text-muted-foreground">{images.length} 张</span>
      </div>

      <Button variant="outline" size="sm" className="w-full gap-2 relative" disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {uploading ? "上传中..." : "上传图片（可多选）"}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={uploading}
        />
      </Button>

      {images.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="post-images">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {images.map((url, index) => (
                  <Draggable key={url + index} draggableId={url + index} index={index}>
                    {(prov, snapshot) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        className={`flex items-center gap-2 p-2 rounded-lg border bg-card ${
                          snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""
                        }`}
                      >
                        <span {...prov.dragHandleProps} className="cursor-grab text-muted-foreground shrink-0">
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <img src={url} alt="" className="w-12 h-12 rounded object-cover bg-muted shrink-0" />
                        <span className="text-xs text-muted-foreground flex-1 truncate">图片 {index + 1}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => removeImage(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}