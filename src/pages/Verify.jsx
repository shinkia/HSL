import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    (async () => {
      try {
        const res = await base44.functions.invoke("verifyEmail", { token });
        if (res.data.success) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch (e) {
        setStatus("error");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card rounded-2xl border shadow-sm p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold mb-2">正在验证...</h1>
            <p className="text-muted-foreground text-sm">请稍候</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">邮箱验证成功</h1>
            <p className="text-muted-foreground text-sm mb-6">您现在可以发帖和评论了</p>
            <Button onClick={() => navigate("/login")} className="w-full h-11">
              去登录
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">验证失败</h1>
            <p className="text-muted-foreground text-sm mb-6">验证链接无效或已过期</p>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full h-11">
              返回首页
            </Button>
          </>
        )}
      </div>
    </div>
  );
}