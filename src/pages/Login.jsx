import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import HoneypotField from "@/components/HoneypotField";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("return") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Honeypot check
    if (honeypot) {
      window.location.href = returnUrl;
      return;
    }

    setLoading(true);
    try {
      // Pre-login check (ban status, rate limit)
      const checkRes = await base44.functions.invoke("preLoginCheck", { email });
      if (checkRes.data.banned) {
        const params = new URLSearchParams();
        if (checkRes.data.reason) params.set("reason", checkRes.data.reason);
        if (checkRes.data.banned_until) params.set("banned_until", checkRes.data.banned_until);
        navigate(`/banned?${params.toString()}`);
        return;
      }
      if (checkRes.data.rate_limited) {
        setError("登录尝试过多，请稍后再试");
        return;
      }

      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnUrl;
    } catch (err) {
      // Record failed login attempt for rate limiting
      try {
        await base44.functions.invoke("recordFailedLogin", { email });
      } catch (e) {}
      setError(err.message || "邮箱或密码错误");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", returnUrl);
  };

  const handleDemo = async () => {
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword("demo@hsl.test", "demo1234");
      window.location.href = returnUrl;
    } catch (err) {
      setError("演示账号暂时不可用");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="欢迎回来"
      subtitle="登录您的账号"
      footer={
        <>
          还没有账号？{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            注册
          </Link>
        </>
      }
    >
      <Button
        className="w-full h-12 text-sm font-medium mb-3"
        onClick={handleDemo}
        disabled={loading}
      >
        ⚡ 试用账号（一键登录）
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        使用Google登录
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">或</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <HoneypotField value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">密码</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              忘记密码？
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              登录中...
            </>
          ) : (
            "登录"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}