import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function CommentSection({ postId, comments = [], onCommentAdded }) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSubmitting(true);
    await base44.entities.Comment.create({
      post_id: postId,
      author_name: name.trim(),
      content: content.trim(),
      status: "approved",
    });
    setName("");
    setContent("");
    setSubmitting(false);
    if (onCommentAdded) onCommentAdded();
  };

  return (
    <div className="space-y-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <MessageCircle className="h-5 w-5 text-primary" />
        评论 ({comments.length})
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl bg-muted/50">
        <Input
          placeholder="您的昵称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-card"
        />
        <Textarea
          placeholder="分享您的想法..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="bg-card resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting || !name.trim() || !content.trim()}
            size="sm"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            发表评论
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            暂无评论，来说第一句吧
          </p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-primary">
                {(comment.author_name || "匿")[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{comment.author_name}</span>
                <span className="text-xs text-muted-foreground">
                  {comment.created_date &&
                    formatDistanceToNow(new Date(comment.created_date), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}