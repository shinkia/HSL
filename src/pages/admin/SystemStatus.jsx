import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, Shield, Mail } from "lucide-react";

export default function SystemStatus() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["system-status"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getSystemStatus");
      return res.data;
    },
  });

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
          ) : status?.recaptcha?.configured ? (
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
                在 Base44 Settings → Secrets 中添加 RECAPTCHA_SECRET_KEY 以启用
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
          ) : status?.email?.configured ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              已配置 (Base44 内置)
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <XCircle className="h-4 w-4" />
              未配置
            </div>
          )}
        </div>
      </div>
    </div>
  );
}