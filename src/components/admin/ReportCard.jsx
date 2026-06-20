import React, { useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, Trash2, Check, Eye, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

const STATUS_CONFIG = {
  pending: { label: "待处理", className: "bg-amber-100 text-amber-700" },
  reviewed: { label: "已查看", className: "bg-blue-100 text-blue-700" },
  actioned: { label: "已处理", className: "bg-red-100 text-red-700" },
  dismissed: { label: "已驳回", className: "bg-gray-100 text-gray-600" },
};

export default function ReportCard({ report, reporter, targetUrl, highPriority }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState(report.admin_note || "");
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing] = useState(false);

  const handleAction = async (action) => {
    setActing(true);
    try {
      await base44.functions.invoke("actionReport", {
        report_id: report.id,
        action,
        admin_note: note.trim() || null,
      });
      toast({ title: "操作成功" });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["pending-report-count"] });
    } catch (error) {
      toast({ title: "操作失败，请重试" });
    } finally {
      setActing(false);
    }
  };

  const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
  const targetLabel = report.target_type === "post" ? "帖子" : "评论";

  return (
    <div className={`bg-white rounded-xl border p-4 ${highPriority ? "border-red-300 ring-1 ring-red-200" : ""}`}>
      {highPriority && (
        <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium mb-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          高优先级 — 多人举报
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Reporter avatar */}
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
          {reporter?.avatar ? (
            <img src={reporter.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-primary">
              {(reporter?.username || report.reporter_id || "?")[0].toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Reporter + date + status */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium">{reporter?.username || "未知用户"}</span>
            <span className="text-xs text-muted-foreground">
              {report.created_date && format(new Date(report.created_date), "yyyy-MM-dd HH:mm", { locale: zhCN })}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${status.className}`}>{status.label}</span>
          </div>

          {/* Reason */}
          <div className="text-sm font-medium text-foreground mb-1">原因：{report.reason}</div>

          {/* Detail */}
          {report.detail && (
            <div className="text-sm text-muted-foreground">
              {expanded || report.detail.length <= 100 ? (
                <p>{report.detail}</p>
              ) : (
                <p>
                  {report.detail.slice(0, 100)}...
                  <button onClick={() => setExpanded(true)} className="text-primary hover:underline ml-1">展开</button>
                </p>
              )}
            </div>
          )}

          {/* Target link */}
          {targetUrl && (
            <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
              <ExternalLink className="h-3 w-3" />
              查看{targetLabel}
            </a>
          )}

          {/* Admin note input (only for pending) */}
          {report.status === "pending" && (
            <div className="mt-3">
              <Textarea
                placeholder="管理员备注（可选）"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          )}
          {report.status !== "pending" && report.admin_note && (
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium">管理员备注：</span>{report.admin_note}
            </div>
          )}

          {/* Action buttons (only for pending) */}
          {report.status === "pending" && (
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="destructive" onClick={() => handleAction("delete_content")} disabled={acting} className="gap-1">
                <Trash2 className="h-3.5 w-3.5" />
                删除内容
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAction("dismiss")} disabled={acting} className="gap-1">
                <Check className="h-3.5 w-3.5" />
                保留内容
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAction("review")} disabled={acting} className="gap-1">
                <Eye className="h-3.5 w-3.5" />
                标记已查看
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}