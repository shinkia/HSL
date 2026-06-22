import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkValid, setLinkValid] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Detect a valid password recovery context.
  // Supabase auto-processes the URL hash (#access_token=...) and creates a session.
  // We just wait briefly for that to happen, then check if a session exists.
  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setLinkValid(true);
        setReady(true);
      }
    });

    // Give Supabase ~1.2s to process the URL, then conclude
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setLinkValid(!!data.session);
      setReady(true);
    }, 1200);

    return () => {
      clearTimeout(t);
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("密码至少 8 个字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ password: newPassword });
      toast({ title: "密码已重置，请重新登录" });
      await base44.auth.logout(false);
      navigate("/login");
    } catch (err) {
      setError(err.message || "重置失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <AuthLayout icon={Lock} title="加载中" subtitle="正在验证重置链接...">
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  if (!linkValid) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="重置链接无效"
        subtitle="此密码重置链接已失效或缺失"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            重新申请重置链接
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          您使用的链接看起来不完整或已过期，请重新申请密码重置邮件。
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Lock} title="设置新密码" subtitle="请输入您的新密码">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">新密码</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="至少 8 个字符"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
              minLength={8}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">确认密码</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="再输一次"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
              minLength={8}
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              重置中...
            </>
          ) : (
            "重置密码"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
