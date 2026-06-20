import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Lock } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import LikeButton from "@/components/forum/LikeButton";
import ReportButton from "@/components/forum/ReportButton";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import HoneypotField from "@/components/HoneypotField";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function CommentSection({ postId, comments = [], onCommentAdded, likedCommentIds }) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (honeypot) {
      setContent("");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("createComment", {
        post_id: postId,
        content: content.trim(),
      });
      setContent("");
      if (res.data.status === "pending") {
        toast({ title: "评论已提交，等待管理员审核" });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "评论失败";
      toast({ title: msg, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    if (onCommentAdded) onCommentAdded();
  };

  const renderComments = () => {
    if (comments.length === 0) {
      return <EmptyState icon={MessageCircle} title="成为第一个评论的人" />;
    }
    return (
      <div className="space-y-4">
        {comments.map((comment) => {
          const authorPath = comment.user_id ? null : null;
          return (
            <div key={comment.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                <span className="text-sm font-medium text-primary">
                  {(comment.author_name || "匿")[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {comment.user_id ? (
                    <Link
                      to={`/user/${encodeURIComponent(comment.author_name)}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {comment.author_name}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium">{comment.author_name}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {comment.created_date &&
                      formatDistanceToNow(new Date(comment.created_date), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <LikeButton targetType="comment" targetId={comment.id} count={comment.like_count || 0} liked={likedCommentIds?.has(comment.id) || false} />
                  <ReportButton targetType="comment" targetId={comment.id} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <MessageCircle className="h-5 w-5 text-primary" />
        评论 ({comments.length})
      </h3>

      {/* Comment form / gate */}
      {!isAuthenticated ? (
        <div className="p-6 rounded-xl bg-muted/50 text-center">
          <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">请先登录后再评论</p>
          <Link to={`/login?return=${encodeURIComponent(window.location.pathname)}`}>
            <Button size="sm">登录</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl bg-muted/50">
          <HoneypotField value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
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
              disabled={submitting || !content.trim()}
              size="sm"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              发表评论
            </Button>
          </div>
        </form>
      )}

      {renderComments()}
    </div>
  );
}