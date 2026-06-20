import React from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldBan } from "lucide-react";

export default function Banned() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");
  const bannedUntil = searchParams.get("banned_until");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card rounded-2xl border shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <ShieldBan className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-xl font-bold mb-2">账号已被封禁</h1>
        {reason && <p className="text-muted-foreground text-sm mb-2">原因：{reason}</p>}
        {bannedUntil && (
          <p className="text-muted-foreground text-sm mb-2">
            解封时间：{new Date(bannedUntil).toLocaleString()}
          </p>
        )}
        <p className="text-muted-foreground text-sm mb-6">
          如有疑问，请联系管理员：admin@example.com
        </p>
        <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full h-11">
          返回首页
        </Button>
      </div>
    </div>
  );
}