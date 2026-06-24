import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle2, XCircle, Shield, Mail, HardDrive, Loader2, Trash2 } from "lucide-react";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/storage-cleanup`;

export default function SystemStatus() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["system-status"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getSystemStatus");
      return res.data;
    },
  });

  // Storage cleanup state
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);

  const callCleanup = async (purge = false) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast({ title: "请先登录", variant: "destructive" });
      return null;
    }
    const url = purge ? `${FUNCTION_URL}?purge=true` : FUNCTION_URL;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  };

  const handleScan = async () => {
    setScanLoading(true);
    try {
      const result = await callCleanup(false);
      setScanResult(result);
      toast({ title: `扫描完成: ${result.orphan_count} 个孤立文件` });
    } catch (e) {
      toast({ title: "扫描失败", description: e.message, variant: "destructive" });
    } finally {
      setScanLoading(false);
    }
  };

  const handlePurge = async () => {
    if (!scanResult || scanResult.orphan_count === 0) return;
    if (!confirm(`确认删除 ${scanResult.orphan_count} 个文件 (${formatBytes(scanResult.orphan_total_bytes)})？此操作不可恢复。`)) return;
    setPurgeLoading(true);
    try {
      const result = await callCleanup(true);
      toast({ title: `已删除 ${result.deleted} 个文件，释放 ${formatBytes(result.freed_bytes)}` });
      setScanResult(null);
    } catch (e) {
      toast({ title: "删除失败", description: e.message, variant: "destructive" });
    } finally {
      setPurgeLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">系统状态</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* reCAPTCHA */}
        <div className="border rounded-xl bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">reCAPTCHA 验证</h2>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : status?.recaptcha_configured ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              已配置
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-sm text-red-500 mb-2">
                <XCircle className="h-4 w-4" />
                未配置
              </div>
              <p className="text-xs text-muted-foreground">
                在 Netlify 环境变量中添加 VITE_RECAPTCHA_SITE_KEY 以启用
              </p>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="border rounded-xl bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">邮件服务</h2>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : status?.email_configured ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              已配置 (Resend)
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              已配置 (Resend via Supabase SMTP)
            </div>
          )}
        </div>
      </div>

      {/* Storage cleanup */}
      <div className="mt-6 border rounded-xl bg-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <HardDrive className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">存储清理</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          扫描 <code className="bg-muted px-1 rounded">post-images</code> 中未被任何帖子引用的孤立文件。先扫描查看清单，确认后再永久删除。
        </p>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleScan} disabled={scanLoading} variant="outline">
            {scanLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />扫描中...</>
            ) : "扫描孤立文件"}
          </Button>
          {scanResult && scanResult.orphan_count > 0 && (
            <Button onClick={handlePurge} disabled={purgeLoading} variant="destructive">
              {purgeLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />删除中...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />删除 {scanResult.orphan_count} 个文件</>
              )}
            </Button>
          )}
        </div>

        {scanResult && (
          <div className="mt-4 space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted rounded-lg">
              <Stat label="总文件数" value={scanResult.total_files} />
              <Stat label="已引用" value={scanResult.referenced} />
              <Stat label="孤立文件" value={scanResult.orphan_count} highlight={scanResult.orphan_count > 0} />
            </div>
            {scanResult.orphan_count > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  查看孤立文件清单 ({formatBytes(scanResult.orphan_total_bytes)})
                </summary>
                <ul className="mt-2 max-h-64 overflow-y-auto space-y-1 font-mono">
                  {scanResult.orphans.map((o) => (
                    <li key={o.path} className="text-muted-foreground">
                      {o.path} <span className="text-xs">({formatBytes(o.size)})</span>
                    </li>
                  ))}
                  {scanResult.orphans.length < scanResult.orphan_count && (
                    <li className="text-muted-foreground italic">… 及其他 {scanResult.orphan_count - scanResult.orphans.length} 个 (响应已截断)</li>
                  )}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${highlight ? "text-amber-600" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
