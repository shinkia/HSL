import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import HoneypotField from "@/components/HoneypotField";

const REASONS = ["垃圾广告", "色情/不良内容", "诈骗", "辱骂/骚扰", "重复内容", "其他"];

export default function ReportModal({ open, onOpenChange, targetType, targetId }) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    if (honeypot) {
      onOpenChange(false);
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitReport", {
        target_type: targetType,
        target_id: targetId,
        reason,
        detail: detail.trim() || null,
      });
      if (res.data.already_reported) {
        toast({ title: "您已举报过此内容，我们正在处理" });
      } else {
        toast({ title: "举报已提交，我们会尽快处理" });
      }
      setReason("");
      setDetail("");
      onOpenChange(false);
    } catch (error) {
      toast({ title: "提交失败，请重试" });
    } finally {
      setSubmitting(false);
    }
  };

  const targetLabel = targetType === "post" ? "帖子" : "评论";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>举报此{targetLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <HoneypotField value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          <div className="space-y-2">
            <Label>举报原因</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="请选择原因" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>详细说明（可选）</Label>
            <Textarea
              placeholder="请详细说明原因（可选）"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              取消
            </Button>
            <Button type="submit" disabled={submitting || !reason}>
              {submitting ? "提交中..." : "提交"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}